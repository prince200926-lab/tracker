const Task = require('../database/Task');
const Group = require('../database/Group');
const logger = require('../utils/logger');

// @desc    Create a new task
// @route   POST /api/tasks/create
// @access  Private (Group Members)
const createTask = async (req, res) => {
  try {
    const { groupId, subject, chapter, lectureNo, description, deadline } = req.body;

    // Validation
    if (!groupId || !subject || !chapter || !lectureNo) {
      logger.warn('Task creation attempt with missing required fields');
      return res.status(400).json({ message: 'Group ID, subject, chapter, and lecture number are required' });
    }

    // Find group
    const group = await Group.findByGroupId(groupId);

    if (!group) {
      logger.warn(`Task creation failed: Group not found (${groupId})`);
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    let members = [];
    if (group.members) {
      try {
        members = JSON.parse(group.members);
      } catch (e) {
        members = [];
      }
    }

    if (!members.includes(req.user.userId)) {
      logger.warn(`Unauthorized task creation attempt by ${req.user.username} in group ${group.groupName}`);
      return res.status(403).json({ message: 'Only group members can create tasks' });
    }

    // Initialize completion status for all members
    const completionStatus = {};
    members.forEach(memberId => {
      completionStatus[memberId] = false;
    });

    // Create task - store createdBy to allow only creator to delete
    const task = await Task.create({
      taskId: `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      subject,
      chapter,
      lectureNo,
      description: description || '',
      deadline: deadline ? new Date(deadline) : undefined,
      assignedBy: req.user.userId,
      createdBy: req.user.userId,
      createdByName: req.user.displayName || req.user.username,
      groupId,
      completionStatus
    });

    logger.info(`Task created: ${task.subject} - ${task.chapter} in group ${group.groupName} by leader ${req.user.username}`);

    // Parse completionStatus for real-time event
    let parsedCompletionStatus = {};
    if (task.completionStatus) {
      try {
        parsedCompletionStatus = JSON.parse(task.completionStatus);
      } catch (e) {
        parsedCompletionStatus = {};
      }
    }

    // Emit real-time event to all group members
    const taskForEmit = {
      ...task,
      completionStatus: parsedCompletionStatus
    };
    req.app.get('io').to(groupId).emit('task-created', taskForEmit);

    const taskResponse = {
      ...task,
      completionStatus: parsedCompletionStatus
    };

    res.status(201).json(taskResponse);
  } catch (error) {
    logger.error(`Task creation error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark task as complete
// @route   POST /api/tasks/mark-complete
// @access  Private (Group Members)
const markTaskComplete = async (req, res) => {
  try {
    const { taskId, completed } = req.body;

    if (!taskId) {
      logger.warn('Task completion attempt with missing task ID');
      return res.status(400).json({ message: 'Task ID is required' });
    }

    // Find task
    const task = await Task.findByTaskId(taskId);

    if (!task) {
      logger.warn(`Task completion failed: Task not found (${taskId})`);
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is a member of the group
    const group = await Group.findByGroupId(task.groupId);

    if (!group) {
      logger.error(`Task completion failed: Group not found for task ${taskId}`);
      return res.status(404).json({ message: 'Group not found' });
    }

    // Parse members from JSON string
    let members = [];
    if (group.members) {
      try {
        members = JSON.parse(group.members);
      } catch (e) {
        members = [];
      }
    }

    if (!members.includes(req.user.userId)) {
      logger.warn(`Unauthorized task completion attempt by ${req.user.username} for task ${taskId}`);
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    // Update completion status
    await Task.updateCompletionStatus(taskId, req.user.userId, completed);

    logger.info(`Task ${task.subject} marked as ${completed ? 'complete' : 'incomplete'} by ${req.user.username}`);

    // Emit real-time event to all group members
    req.app.get('io').to(task.groupId).emit('task-updated', {
      taskId: task.taskId,
      userId: req.user.userId,
      completed
    });

    // Get the updated completion status
    const completedStatus = await Task.getCompletionStatus(taskId, req.user.userId);

    res.json({
      taskId: task.taskId,
      completed: completedStatus
    });
  } catch (error) {
    logger.error(`Task completion error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get tasks for a group
// @route   GET /api/tasks/group/:groupId
// @access  Private (Group Members)
const getGroupTasks = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Find group
    const group = await Group.findByGroupId(groupId);

    if (!group) {
      logger.warn(`Get tasks failed: Group not found (${groupId})`);
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member of the group
    // Parse members from JSON string
    let members = [];
    if (group.members) {
      try {
        members = JSON.parse(group.members);
      } catch (e) {
        members = [];
      }
    }

    if (!members.includes(req.user.userId)) {
      logger.warn(`Unauthorized task retrieval attempt by ${req.user.username} for group ${groupId}`);
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    // Find all tasks for the group
    const tasks = await Task.findByGroupId(groupId);

    // Process tasks to parse completionStatus
    const processedTasks = tasks.map(task => {
      let completionStatus = {};
      if (task.completionStatus) {
        try {
          completionStatus = JSON.parse(task.completionStatus);
        } catch (e) {
          completionStatus = {};
        }
      }

      return {
        ...task,
        completionStatus
      };
    });

    logger.info(`Retrieved ${processedTasks.length} tasks for group ${group.groupName} for user ${req.user.username}`);

    res.json(processedTasks);
  } catch (error) {
    logger.error(`Get group tasks error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Task creator only)
const deleteTask = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    
    const task = await Task.findByTaskId(taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is the creator
    if (task.createdBy !== req.user.userId) {
      logger.warn(`Unauthorized task delete attempt by ${req.user.username} for task ${taskId}`);
      return res.status(403).json({ message: 'Only the task creator can delete this task' });
    }

    // Get group to emit event
    const group = await Group.findByGroupId(task.groupId);
    
    // Delete task
    await Task.delete(task.id);
    
    logger.info(`Task ${task.subject} deleted by ${req.user.username}`);
    
    // Emit real-time event
    req.app.get('io').to(task.groupId).emit('task-deleted', { taskId: task.taskId, groupId: task.groupId });
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error(`Delete task error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createTask,
  markTaskComplete,
  getGroupTasks,
  deleteTask
};