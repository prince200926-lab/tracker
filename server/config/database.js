const knex = require('knex');
const path = require('path');
const fs = require('fs');

// Ensure the database directory exists
const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// SQLite database configuration
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: path.join(dbDir, 'academic-goals-tracker.db')
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(dbDir, 'migrations')
  },
  seeds: {
    directory: path.join(dbDir, 'seeds')
  }
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create users table
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
        table.text('joinedGroups').defaultTo('[]'); // Store as JSON string
        table.timestamps(true, true);
      });
    }

    // Create groups table
    const groupTableExists = await db.schema.hasTable('groups');
    if (!groupTableExists) {
      await db.schema.createTable('groups', (table) => {
        table.increments('id').primary();
        table.string('groupId').unique().notNullable();
        table.string('groupName').notNullable();
        table.string('leaderId').notNullable();
        table.text('members').defaultTo('[]'); // Store as JSON string
        table.text('pendingRequests').defaultTo('[]'); // Store as JSON string
        table.string('groupCode').unique().notNullable();
        table.timestamps(true, true);
      });
    }

    // Create tasks table
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
        table.timestamps(true, true);
      });
    } else {
      // Add new columns if they don't exist
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