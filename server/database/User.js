const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    return await this.findOne({ email });
  }

  async findByUsername(username) {
    return await this.findOne({ username });
  }

  async findByUserId(userId) {
    return await this.findOne({ userId });
  }

  async findByGoogleId(googleId) {
    return await this.findOne({ googleId });
  }

  async findByEmailOrUsername(email, username) {
    const { db } = require('../config/database');
    return await db(this.table).where('email', email).orWhere('username', username).first();
  }

  async create(userData) {
    // Hash password if provided
    if (userData.password) {
      const salt = await bcrypt.genSalt(12);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    // Initialize joinedGroups as empty array
    if (!userData.joinedGroups) {
      userData.joinedGroups = '[]';
    } else if (Array.isArray(userData.joinedGroups)) {
      userData.joinedGroups = JSON.stringify(userData.joinedGroups);
    }

    return await super.create(userData);
  }

  async update(userId, updateData) {
    // Hash password if provided
    if (updateData.password) {
      const salt = await bcrypt.genSalt(12);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    // Handle joinedGroups array
    if (updateData.joinedGroups && Array.isArray(updateData.joinedGroups)) {
      updateData.joinedGroups = JSON.stringify(updateData.joinedGroups);
    }

    const { db } = require('../config/database');
    await db(this.table).where('userId', userId).update(updateData);
    return await this.findByUserId(userId);
  }

  async addGroup(userId, groupId) {
    const user = await this.findByUserId(userId);
    if (!user) return null;

    let joinedGroups = [];
    if (user.joinedGroups) {
      try {
        joinedGroups = JSON.parse(user.joinedGroups);
      } catch (e) {
        joinedGroups = [];
      }
    }

    if (!joinedGroups.includes(groupId)) {
      joinedGroups.push(groupId);
      return await this.update(userId, { joinedGroups: JSON.stringify(joinedGroups) });
    }

    return user;
  }

  async comparePassword(candidatePassword, hashedPassword) {
    if (!hashedPassword) return false;
    return bcrypt.compare(candidatePassword, hashedPassword);
  }
}

module.exports = new User();