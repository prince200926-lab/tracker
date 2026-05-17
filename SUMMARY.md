# Academic Goals Tracker - Project Summary

## Overview

This is a full-stack collaborative academic progress tracking platform called "Academic Goals Tracker". The application allows users to create or join study groups, assign subject-wise academic tasks, and track completion status across all group members in real time.

## Features Implemented

### Authentication System
- Username/password registration and login
- JWT token-based authentication
- Display name setup after first login
- Protected routes for all authenticated features

### Group Management
- Create study groups with unique 6-digit alphanumeric codes
- Join groups using invitation codes
- Group leader management (only leaders can create tasks and approve join requests)
- Pending join requests with approval/rejection workflow

### Task Management
- Subject-wise task creation (subject, chapter, lecture/topic)
- Optional task descriptions and deadlines
- Real-time task completion tracking
- Progress visualization with completion percentages

### Real-time Functionality
- WebSocket-based real-time updates using Socket.IO
- Instant sync of task completions across all group members
- Live notifications for join requests and approvals
- Real-time member status updates

### Responsive UI
- Mobile-friendly design using Tailwind CSS
- Clean, intuitive interface with clear navigation
- Modal-based forms for creating groups and tasks
- Visual progress indicators for task completion

## Technology Stack

### Backend
- **Node.js + Express**: REST API server
- **MongoDB + Mongoose**: Database and ORM
- **Socket.IO**: Real-time WebSocket communication
- **JWT**: Authentication and session management
- **bcrypt.js**: Password hashing
- **Passport.js**: Google OAuth (planned for future implementation)

### Frontend
- **React + Vite**: Modern frontend framework with fast development server
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **React Router**: Client-side routing
- **Context API**: State management
- **Axios**: HTTP client for API requests

## Project Structure

```
academic-goals-tracker/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/          # Page components (Login, Register, Dashboard, Group, etc.)
│   │   ├── context/        # React context providers (AuthContext)
│   │   ├── services/       # API and Socket.IO services
│   │   ├── utils/
│   │   ├── App.jsx         # Main app component with routing
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   └── vite.config.js
├── server/                 # Node.js + Express backend
│   ├── controllers/        # Route handlers (auth, group, task)
│   ├── models/             # Mongoose models (User, Group, Task)
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication middleware
│   ├── utils/              # Utility functions (code generation, logging)
│   ├── logs/               # Application logs
│   ├── server.js           # Main server entry point
│   ├── package.json
│   └── .env                # Environment variables
├── README.md               # Setup and usage instructions
└── SUMMARY.md              # This file
```

## Key Components

### Backend Components
1. **Models**:
   - User: Authentication and profile data
   - Group: Study group information with members and join requests
   - Task: Academic tasks with completion status tracking

2. **Controllers**:
   - AuthController: User registration, login, and profile management
   - GroupController: Group creation, joining, and management
   - TaskController: Task creation and completion tracking

3. **Middleware**:
   - Authentication middleware to protect routes
   - Error handling and logging

4. **Services**:
   - Code generation for unique group codes
   - Real-time logging system

### Frontend Components
1. **Pages**:
   - Login/Register: Authentication forms
   - Dashboard: Overview of user's study groups
   - CreateGroup/JoinGroup: Group management forms
   - Group: Main group page with tasks and members

2. **Context**:
   - AuthContext: Global authentication state management

3. **Services**:
   - API service with Axios for HTTP requests
   - Socket service for real-time communication

## API Endpoints

### Authentication
- POST `/api/auth/signup` - Register new user
- POST `/api/auth/login` - Login user
- PUT `/api/auth/displayname` - Update display name
- GET `/api/auth/profile` - Get user profile

### Groups
- POST `/api/groups/create` - Create new group
- POST `/api/groups/join` - Join group with code
- POST `/api/groups/respond-request` - Accept/reject join request
- GET `/api/groups/:id` - Get group details
- GET `/api/groups/user` - Get user's groups

### Tasks
- POST `/api/tasks/create` - Create new task (leader only)
- POST `/api/tasks/mark-complete` - Mark task as complete
- GET `/api/tasks/group/:groupId` - Get tasks for a group

## Real-time Features

The application uses Socket.IO for real-time communication with the following events:

### Client to Server
- `join-group-room`: Join a group's real-time room
- `task-completed`: Notify when task is marked complete
- `join-request`: Send join request to group leader

### Server to Client
- `task-updated`: Broadcast task completion changes
- `join-request-received`: Notify leader of new join request
- `join-request-responded`: Notify user of request response
- `member-joined`: Notify when new member joins group
- `task-created`: Notify when new task is created

## Setup Instructions

1. **Backend Setup**:
   ```bash
   cd server/academic-goals-tracker/original-server
   npm install
   # Configure .env file with MongoDB connection and other settings
   npm run dev
   ```

2. **Frontend Setup**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

3. **Environment Configuration**:
   Create a `.env` file in the server directory with required configuration variables.

## Future Enhancements

1. **Google OAuth Integration**: Complete implementation of Google login
2. **Progress Analytics**: Dashboard with completion statistics
3. **Notifications System**: In-app notifications for various events
4. **Dark Mode**: Theme toggle for better user experience
5. **Group Leaderboard**: Progress ranking within groups
6. **Task Filtering**: Sort and filter tasks by various criteria

## Conclusion

The Academic Goals Tracker provides a comprehensive solution for collaborative academic progress tracking with real-time updates, intuitive UI, and robust authentication. The application is built with modern web technologies and follows best practices for security, scalability, and maintainability.