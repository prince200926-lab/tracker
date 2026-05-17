const { db } = require('../config/database');

class BaseModel {
  constructor(tableName) {
    this.table = tableName;
  }

  async findAll() {
    return await db(this.table).select('*');
  }

  async findById(id) {
    return await db(this.table).where('id', id).first();
  }

  async findOne(condition) {
    return await db(this.table).where(condition).first();
  }

  async findMany(condition) {
    return await db(this.table).where(condition);
  }

  async create(data) {
    const [id] = await db(this.table).insert(data);
    return await this.findById(id);
  }

  async update(id, data) {
    await db(this.table).where('id', id).update(data);
    return await this.findById(id);
  }

  async delete(id) {
    return await db(this.table).where('id', id).del();
  }

  async updateWhere(condition, data) {
    return await db(this.table).where(condition).update(data);
  }
}

module.exports = BaseModel;