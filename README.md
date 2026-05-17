# Academic Goals Tracker

A collaborative academic progress tracking platform where users can create or join study groups, assign subject-wise academic tasks, and track completion status across all group members in real time.

## Features

- User authentication (username/password and Google OAuth)
- Create or join study groups
- Assign subject-wise academic tasks
- Real-time task completion tracking
- Responsive UI for mobile and desktop

## Tech Stack

### Backend
- Node.js + Express
- MongoDB with Mongoose ORM
- Socket.IO for real-time updates
- JWT for authentication
- Passport.js for Google OAuth

### Frontend
- React with Vite
- Tailwind CSS for styling
- React Router for navigation
- Context API for state management

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd academic-goals-tracker
   ```

2. **Backend Setup:**
   ```bash
   cd server/academic-goals-tracker/original-server
   npm install
   ```

3. **Frontend Setup:**
   ```bash
   cd ../../../client
   npm install
   ```

4. **Environment Configuration:**

   Create a `.env` file in the server directory with the following variables:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/academicgoals

   # Client URL
   CLIENT_URL=http://localhost:5173

   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Google OAuth Credentials
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Logging Configuration
   LOGGING_LEVEL=info
   ```

5. **Start the development servers:**

   Backend:
   ```bash
   cd server/academic-goals-tracker/original-server
   npm run dev
   ```

   Frontend:
   ```bash
   cd ../../../client
   npm run dev
   ```

6. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Project Structure

```
academic-goals-tracker/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── server/                 # Node.js + Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── utils/
│   └── server.js
├── .env                    # Environment variables
└── README.md
```

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

## Real-time Events (Socket.IO)

### Client to Server
- `join-group-room` - Join a group's real-time room
- `task-completed` - Notify when task is marked complete
- `join-request` - Send join request to group leader

### Server to Client
- `task-updated` - Broadcast task completion changes
- `join-request-received` - Notify leader of new join request
- `join-request-responded` - Notify user of request response
- `member-joined` - Notify when new member joins group
- `task-created` - Notify when new task is created

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- React and Vite for the frontend framework
- Node.js and Express for the backend
- MongoDB for the database
- Socket.IO for real-time communication
- Tailwind CSS for styling