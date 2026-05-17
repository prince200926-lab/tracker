const Group = require('../database/Group');
const User = require('../database/User');
const generateUniqueCode = require('../utils/generateCode');
const logger = require('../utils/logger');

// @desc    Create a new group
// @route   POST /api/groups/create
// @access  Private
const createGroup = async (req, res) => {
  try {
    const { groupName } = req.body;

    if (!groupName) {
      logger.warn('Group creation attempt with missing group name');
      return res.status(400).json({ message: 'Group name is required' });
    }

    // Generate unique group code
    let groupCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      groupCode = generateUniqueCode();
      const existingGroup = await Group.findByGroupCode(groupCode);
      if (!existingGroup) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      logger.error('Failed to generate unique group code after maximum attempts');
      return res.status(500).json({ message: 'Unable to generate unique group code' });
    }

    // Create group
    const group = await Group.create({
      groupId: `group_${Date.now()}`,
      groupName,
      leaderId: req.user.userId,
      members: [req.user.userId],
      groupCode
    });

    // Add group to user's joinedGroups
    await User.addGroup(req.user.userId, group.groupId);

    logger.info(`Group created: ${group.groupName} (${group.groupId}) by user ${req.user.username}`);

    // Parse members and pendingRequests from JSON strings
    let members = [];
    let pendingRequests = [];

    if (group.members) {
      try {
        members = JSON.parse(group.members);
      } catch (e) {
        members = [];
      }
    }

    if (group.pendingRequests) {
      try {
        pendingRequests = JSON.parse(group.pendingRequests);
      } catch (e) {
        pendingRequests = [];
      }
    }

    const groupData = {
      groupId: group.groupId,
      groupName: group.groupName,
      leaderId: group.leaderId,
      members: members,
      pendingRequests: pendingRequests,
      groupCode: group.groupCode
    };

    // Emit real-time event
    req.app.get('io').emit('group-created', groupData);

    res.status(201).json(groupData);
  } catch (error) {
    logger.error(`Group creation error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Join a group
// @route   POST /api/groups/join
// @access  Private
const joinGroup = async (req, res) => {
  try {
    const { groupCode } = req.body;

    if (!groupCode) {
      logger.warn('Group join attempt with missing group code');
      return res.status(400).json({ message: 'Group code is required' });
    }

    // Validate group code format
    if (groupCode.length !== 6) {
      logger.warn(`Invalid group code format: ${groupCode}`);
      return res.status(400).json({ message: 'Group code must be 6 characters' });
    }

    // Find group by code
    const group = await Group.findByGroupCode(groupCode.toUpperCase());

    if (!group) {
      logger.warn(`Group not found for code: ${groupCode}`);
      return res.status(404).json({ message: 'Group not found' });
    }

    // Parse members and pendingRequests from JSON strings
    let members = [];
    let pendingRequests = [];

    if (group.members) {
      try {
        members = JSON.parse(group.members);
      } catch (e) {
        members = [];
      }
    }

    if (group.pendingRequests) {
      try {
        pendingRequests = JSON.parse(group.pendingRequests);
      } catch (e) {
        pendingRequests = [];
      }
    }

    // Check if user is already a member
    if (members.includes(req.user.userId)) {
      logger.warn(`User ${req.user.username} already member of group ${group.groupName}`);
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    // Check if user already has a pending request
    const existingRequest = pendingRequests.find(request => request.userId === req.user.userId);
    if (existingRequest) {
      logger.warn(`User ${req.user.username} already has pending request for group ${group.groupName}`);
      return res.status(400).json({ message: 'You already have a pending request for this group' });
    }

    // Add join request
    pendingRequests.push({
      userId: req.user.userId,
      username: req.user.username,
      displayName: req.user.displayName
    });

    await Group.update(group.groupId, { pendingRequests: JSON.stringify(pendingRequests) });

    logger.info(`Join request submitted by ${req.user.username} for group ${group.groupName}`);

    // Emit event to group members (especially leader)
    req.app.get('io').to(group.groupId).emit('join-request-received', {
      groupId: group.groupId,
      userId: req.user.userId,
      username: req.user.username,
      displayName: req.user.displayName
    });

    res.json({
      message: 'Join request submitted successfully',
      groupId: group.groupId,
      groupName: group.groupName
    });
  } catch (error) {
    logger.error(`Group join error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Respond to join request
// @route   POST /api/groups/respond-request
// @access  Private (Group Leader only)
const respondToJoinRequest = async (req, res) => {
  try {
    const { groupId, userId, action } = req.body;

    if (!groupId || !userId || !action) {
      logger.warn('Join request response attempt with missing fields');
      return res.status(400).json({ message: 'GroupId, userId, and action are required' });
    }

    // Find group
    const group = await Group.findByGroupId(groupId);

    if (!group) {
      logger.warn(`Group not found: ${groupId}`);
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is the group leader
    if (group.leaderId !== req.user.userId) {
      logger.warn(`Unauthorized join request response attempt by ${req.user.username} for group ${group.groupName}`);
      return res.status(403).json({ message: 'Only group leaders can respond to join requests' });
    }

    // Parse members and pendingRequests from JSON strings
    let members = [];
    let pendingRequests = [];

    if (group.members) {
      try {
        members = JSON.parse(group.members);
      } catch (e) {
        members = [];
      }
    }

    if (group.pendingRequests) {
      try {
        pendingRequests = JSON.parse(group.pendingRequests);
      } catch (e) {
        pendingRequests = [];
      }
    }

    // Find the request
    const requestIndex = pendingRequests.findIndex(request => request.userId === userId);

    if (requestIndex === -1) {
      logger.warn(`Join request not found for user ${userId} in group ${group.groupName}`);
      return res.status(404).json({ message: 'Join request not found' });
    }

    const request = pendingRequests[requestIndex];

    if (action === 'accept') {
      // Add user to members
      members.push(userId);

      // Remove from pending requests
      pendingRequests.splice(requestIndex, 1);

      // Add group to user's joinedGroups
      await User.addGroup(userId, groupId);

      await Group.update(groupId, {
        members: JSON.stringify(members),
        pendingRequests: JSON.stringify(pendingRequests)
      });

      logger.info(`User ${request.username} accepted to group ${group.groupName} by leader ${req.user.username}`);

      // Emit event to the requester
      req.app.get('io').emit('join-request-responded', {
        groupId,
        userId,
        approved: true,
        groupName: group.groupName
      });

      res.json({
        message: 'User accepted successfully',
        memberId: userId,
        memberName: request.displayName
      });
    } else if (action === 'reject') {
      // Remove from pending requests
      pendingRequests.splice(requestIndex, 1);
      await Group.update(groupId, {
        pendingRequests: JSON.stringify(pendingRequests)
      });

      logger.info(`User ${request.username} rejected from group ${group.groupName} by leader ${req.user.username}`);

      // Emit event to the requester
      req.app.get('io').emit('join-request-responded', {
        groupId,
        userId,
        approved: false,
        groupName: group.groupName
      });

      res.json({
        message: 'User rejected successfully'
      });
    } else {
      logger.warn(`Invalid action for join request response: ${action}`);
      res.status(400).json({ message: 'Action must be either accept or reject' });
    }
  } catch (error) {
    logger.error(`Join request response error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get group details
// @route   GET /api/groups/:id
// @access  Private (Members only)
const getGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;

    // Find group
    const group = await Group.findByGroupId(groupId);

    if (!group) {
      logger.warn(`Group not found: ${groupId}`);
      return res.status(404).json({ message: 'Group not found' });
    }

    // Parse members from JSON string
    let membersArray = [];
    if (group.members) {
      try {
        membersArray = JSON.parse(group.members);
      } catch (e) {
        membersArray = [];
      }
    }

    // Check if user is a member
    if (!membersArray.includes(req.user.userId)) {
      logger.warn(`Unauthorized access attempt by ${req.user.username} to group ${group.groupName}`);
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    // Get member details
    const members = [];
    for (const userId of membersArray) {
      const user = await User.findByUserId(userId);
      if (user) {
        members.push({
          userId: user.userId,
          username: user.username,
          displayName: user.displayName
        });
      }
    }

    logger.info(`Group details retrieved for ${group.groupName} by user ${req.user.username}`);

    // Parse pendingRequests from JSON string
    let pendingRequests = [];
    if (group.pendingRequests) {
      try {
        pendingRequests = JSON.parse(group.pendingRequests);
      } catch (e) {
        pendingRequests = [];
      }
    }

    res.json({
      groupId: group.groupId,
      groupName: group.groupName,
      leaderId: group.leaderId,
      members,
      pendingRequests: req.user.userId === group.leaderId ? pendingRequests : undefined,
      groupCode: group.groupCode
    });
  } catch (error) {
    logger.error(`Get group error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Leave a group
// @route   POST /api/groups/leave
// @access  Private
const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    
    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    const group = await Group.findByGroupId(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    let members = [];
    if (group.members) {
      try { members = JSON.parse(group.members); } catch (e) { members = []; }
    }

    if (!members.includes(req.user.userId)) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }

    if (group.leaderId === req.user.userId) {
      return res.status(400).json({ message: 'Group leader cannot leave. Transfer leadership first or delete the group.' });
    }

    const index = members.indexOf(req.user.userId);
    members.splice(index, 1);
    
    await Group.update(groupId, { members: JSON.stringify(members) });
    
    logger.info(`User ${req.user.username} left group ${group.groupName}`);
    res.json({ message: 'Left group successfully' });
  } catch (error) {
    logger.error(`Leave group error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a group (leader only)
// @route   DELETE /api/groups/:id
// @access  Private
const deleteGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    
    const group = await Group.findByGroupId(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.leaderId !== req.user.userId) {
      return res.status(403).json({ message: 'Only group leader can delete the group' });
    }

    await Group.delete(group.id);
    
    logger.info(`Group ${group.groupName} deleted by leader ${req.user.username}`);
    
    // Emit real-time event
    req.app.get('io').emit('group-deleted', { groupId: group.groupId });
    
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    logger.error(`Delete group error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's groups
// @route   GET /api/groups/user
// @access  Private
const getUserGroups = async (req, res) => {
  try {
    // Find groups where user is a member
    const groups = await Group.findByMember(req.user.userId);

    // Process groups to parse JSON fields
    const processedGroups = groups.map(group => {
      // Parse members from JSON string
      let members = [];
      if (group.members) {
        try {
          members = JSON.parse(group.members);
        } catch (e) {
          members = [];
        }
      }

      // Parse pendingRequests from JSON string
      let pendingRequests = [];
      if (group.pendingRequests) {
        try {
          pendingRequests = JSON.parse(group.pendingRequests);
        } catch (e) {
          pendingRequests = [];
        }
      }

      return {
        ...group,
        members,
        pendingRequests
      };
    });

    logger.info(`Retrieved ${processedGroups.length} groups for user ${req.user.username}`);

    res.json(processedGroups);
  } catch (error) {
    logger.error(`Get user groups error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createGroup,
  joinGroup,
  respondToJoinRequest,
  getGroup,
  getUserGroups,
  leaveGroup,
  deleteGroup
};