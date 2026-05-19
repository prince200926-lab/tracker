const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Make io accessible to controllers
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const taskRoutes = require('./routes/taskRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/tasks', taskRoutes);

// Routes placeholder
app.get('/', (req, res) => {
  res.json({ message: 'Academic Goals Tracker API' });
});

const { db } = require('./config/database');

app.get('/api/init-tables', async (req, res) => {
  try {
    const { initializeDatabase } = require('./config/database');
    await initializeDatabase();
    res.json({ status: 'ok', message: 'Tables created/verified' });
  } catch (err) {
    res.json({ status: 'error', error: err.message });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const result = await db.raw('SELECT 1');
    const tables = await db('information_schema.tables')
      .select('table_name')
      .where('table_schema', 'public');
    res.json({ 
      status: 'ok', 
      database: 'connected', 
      tables: tables.map(t => t.table_name),
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    res.json({ status: 'error', database: 'disconnected', error: err.message, timestamp: new Date().toISOString() });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a group room
  socket.on('join-group-room', (groupId) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined group ${groupId}`);
  });

  // Handle task completion
  socket.on('task-completed', ({ taskId, userId, completed, groupId }) => {
    // Broadcast to all users in the group including sender
    io.to(groupId).emit('task-updated', { taskId, userId, completed });
  });

  // Handle join requests
  socket.on('join-request', ({ groupId, userData }) => {
    // Notify group leader
    socket.to(groupId).emit('join-request-received', { groupId, userData });
  });

  // Handle join request responses
  socket.on('join-request-response', ({ groupId, userId, approved }) => {
    // Notify the requesting user
    io.to(userId).emit('join-request-responded', { groupId, approved });

    // If approved, notify all group members
    if (approved) {
      socket.to(groupId).emit('member-joined', { userId });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Serve static client files (for production build)
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Catch-all for client-side routing (SPA)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  }
});

// Database connection
const { initializeDatabase } = require('./config/database');

initializeDatabase()
  .then(() => console.log("PostgreSQL database initialized"))
  .catch(err => {
    console.error("Database initialization error:", err);
    process.exit(1);
  });

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});