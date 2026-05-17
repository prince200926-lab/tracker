const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: { min: 0, max: 7 }
});

const initializeDatabase = async () => {
  try {
    const userTableExists = await db.schema.hasTable('users');
    if (!userTableExists) {
      await db.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('userId').unique().notNullable();
        table.string('username').unique().notNullable();
        table.string('email').unique().notNullable();
        table.string('password');
        table.string('displayName').notNullable();
        table.string('googleId').unique();
        table.text('joinedGroups').defaultTo('[]');
        table.timestamp('createdAt').defaultTo(db.fn.now());
        table.timestamp('updatedAt').defaultTo(db.fn.now());
      });
    }

    const groupTableExists = await db.schema.hasTable('groups');
    if (!groupTableExists) {
      await db.schema.createTable('groups', (table) => {
        table.increments('id').primary();
        table.string('groupId').unique().notNullable();
        table.string('groupName').notNullable();
        table.string('leaderId').notNullable();
        table.text('members').defaultTo('[]');
        table.text('pendingRequests').defaultTo('[]');
        table.string('groupCode').unique().notNullable();
        table.timestamp('createdAt').defaultTo(db.fn.now());
        table.timestamp('updatedAt').defaultTo(db.fn.now());
      });
    }

    const taskTableExists = await db.schema.hasTable('tasks');
    if (!taskTableExists) {
      await db.schema.createTable('tasks', (table) => {
        table.increments('id').primary();
        table.string('taskId').unique().notNullable();
        table.string('subject').notNullable();
        table.string('chapter').notNullable();
        table.string('lectureNo').notNullable();
        table.text('description');
        table.datetime('deadline');
        table.string('assignedBy').notNullable();
        table.string('createdBy').notNullable();
        table.string('createdByName');
        table.string('groupId').notNullable();
        table.text('completionStatus').defaultTo('{}');
        table.timestamp('createdAt').defaultTo(db.fn.now());
        table.timestamp('updatedAt').defaultTo(db.fn.now());
      });
    } else {
      const hasCreatedBy = await db.schema.hasColumn('tasks', 'createdBy');
      if (!hasCreatedBy) {
        await db.schema.table('tasks', (table) => {
          table.string('createdBy');
          table.string('createdByName');
        });
      }
    }

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = {
  db,
  initializeDatabase
};