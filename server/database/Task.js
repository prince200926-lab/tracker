const BaseModel = require('./BaseModel');

class Task extends BaseModel {
  constructor() {
    super('tasks');
  }

  async findByTaskId(taskId) {
    return await this.findOne({ taskId });
  }

  async findByGroupId(groupId) {
    return await this.findMany({ groupId });
  }

  async create(taskData) {
    // Initialize completionStatus as empty object
    if (!taskData.completionStatus) {
      taskData.completionStatus = '{}';
    } else if (typeof taskData.completionStatus === 'object' && !Array.isArray(taskData.completionStatus)) {
      taskData.completionStatus = JSON.stringify(taskData.completionStatus);
    }

    return await super.create(taskData);
  }

  async update(taskId, updateData) {
    // Handle completionStatus object
    if (updateData.completionStatus && typeof updateData.completionStatus === 'object' && !Array.isArray(updateData.completionStatus)) {
      updateData.completionStatus = JSON.stringify(updateData.completionStatus);
    }

    const { db } = require('../config/database');
    await db(this.table).where('taskId', taskId).update(updateData);
    return await this.findByTaskId(taskId);
  }

  async updateCompletionStatus(taskId, userId, completed) {
    const task = await this.findByTaskId(taskId);
    if (!task) return null;

    let completionStatus = {};
    if (task.completionStatus) {
      try {
        completionStatus = JSON.parse(task.completionStatus);
      } catch (e) {
        completionStatus = {};
      }
    }

    completionStatus[userId] = completed;
    return await this.update(taskId, { completionStatus: JSON.stringify(completionStatus) });
  }

  async getCompletionStatus(taskId, userId) {
    const task = await this.findByTaskId(taskId);
    if (!task) return false;

    let completionStatus = {};
    if (task.completionStatus) {
      try {
        completionStatus = JSON.parse(task.completionStatus);
      } catch (e) {
        completionStatus = {};
      }
    }

    return !!completionStatus[userId];
  }
}

module.exports = new Task();