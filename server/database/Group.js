const BaseModel = require('./BaseModel');

class Group extends BaseModel {
  constructor() {
    super('groups');
  }

  async findByGroupId(groupId) {
    return await this.findOne({ groupId });
  }

  async findByGroupCode(groupCode) {
    return await this.findOne({ groupCode });
  }

  async findByMember(userId) {
    const { db } = require('../config/database');
    // We need to search in the members JSON array
    return await db(this.table).whereRaw(`members LIKE '%"${userId}"%'`);
  }

  async create(groupData) {
    // Initialize members and pendingRequests as arrays
    if (!groupData.members) {
      groupData.members = '[]';
    } else if (Array.isArray(groupData.members)) {
      groupData.members = JSON.stringify(groupData.members);
    }

    if (!groupData.pendingRequests) {
      groupData.pendingRequests = '[]';
    } else if (Array.isArray(groupData.pendingRequests)) {
      groupData.pendingRequests = JSON.stringify(groupData.pendingRequests);
    }

    return await super.create(groupData);
  }

  async update(groupId, updateData) {
    // Handle members array
    if (updateData.members && Array.isArray(updateData.members)) {
      updateData.members = JSON.stringify(updateData.members);
    }

    // Handle pendingRequests array
    if (updateData.pendingRequests && Array.isArray(updateData.pendingRequests)) {
      updateData.pendingRequests = JSON.stringify(updateData.pendingRequests);
    }

    const { db } = require('../config/database');
    await db(this.table).where('groupId', groupId).update(updateData);
    return await this.findByGroupId(groupId);
  }

  async addMember(groupId, userId) {
    const group = await this.findByGroupId(groupId);
    if (!group) return null;

    let members = [];
    if (group.members) {
      try {
        members = JSON.parse(group.members);
      } catch (e) {
        members = [];
      }
    }

    if (!members.includes(userId)) {
      members.push(userId);
      return await this.update(groupId, { members: JSON.stringify(members) });
    }

    return group;
  }

  async removeMember(groupId, userId) {
    const group = await this.findByGroupId(groupId);
    if (!group) return null;

    let members = [];
    if (group.members) {
      try {
        members = JSON.parse(group.members);
      } catch (e) {
        members = [];
      }
    }

    const index = members.indexOf(userId);
    if (index > -1) {
      members.splice(index, 1);
      return await this.update(groupId, { members: JSON.stringify(members) });
    }

    return group;
  }

  async addPendingRequest(groupId, requestData) {
    const group = await this.findByGroupId(groupId);
    if (!group) return null;

    let pendingRequests = [];
    if (group.pendingRequests) {
      try {
        pendingRequests = JSON.parse(group.pendingRequests);
      } catch (e) {
        pendingRequests = [];
      }
    }

    // Check if user already has a pending request
    const existingRequest = pendingRequests.find(req => req.userId === requestData.userId);
    if (!existingRequest) {
      pendingRequests.push(requestData);
      return await this.update(groupId, { pendingRequests: JSON.stringify(pendingRequests) });
    }

    return group;
  }

  async removePendingRequest(groupId, userId) {
    const group = await this.findByGroupId(groupId);
    if (!group) return null;

    let pendingRequests = [];
    if (group.pendingRequests) {
      try {
        pendingRequests = JSON.parse(group.pendingRequests);
      } catch (e) {
        pendingRequests = [];
      }
    }

    const index = pendingRequests.findIndex(req => req.userId === userId);
    if (index > -1) {
      pendingRequests.splice(index, 1);
      return await this.update(groupId, { pendingRequests: JSON.stringify(pendingRequests) });
    }

    return group;
  }
}

module.exports = new Group();