import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:5000' : 'https://tracker-h319.onrender.com';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.connected = false;
    this.userId = null;
    this.joinedRooms = new Set();
  }

  setUserId(userId) {
    this.userId = userId;
  }

  connect() {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      this.rejoinRooms();
      return;
    }
    
    console.log('Connecting to socket server...');
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.connected = true;
      this.rejoinRooms();
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });
    
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      this.rejoinRooms();
    });
    
    this.socket.on('task-created', (data) => {
      console.log('📝 Task created:', data.subject);
    });
    
    this.socket.on('task-updated', (data) => {
      console.log('📝 Task updated:', data);
    });
  }

  rejoinRooms() {
    this.joinedRooms.forEach(room => {
      this.socket?.emit('join-group-room', room);
      console.log('🔗 Rejoined room:', room);
    });
  }

  joinGroupRoom(groupId) {
    if (this.socket?.connected) {
      this.socket.emit('join-group-room', groupId);
      this.joinedRooms.add(groupId);
      console.log('🔗 Joined group room:', groupId);
    } else {
      console.log('⚠️ Cannot join room - socket not connected, will retry on connect');
      this.joinedRooms.add(groupId);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  joinGroupRoom(groupId) {
    if (this.socket?.connected) {
      this.socket.emit('join-group-room', groupId);
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  markTaskComplete(taskId, completed, groupId) {
    if (this.socket?.connected && this.userId) {
      this.socket.emit('task-completed', { taskId, userId: this.userId, completed, groupId });
    }
  }

  respondToJoinRequest(groupId, userId, approved) {
    this.socket?.emit('join-request-response', { groupId, userId, approved });
  }
}

const socketService = new SocketService();
socketService.connect();

export default socketService;