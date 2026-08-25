const jwt = require('jsonwebtoken');
const prisma = require('./db');
const { JWT_SECRET } = require('./middleware/auth');

let ioInstance = null;
const onlineUsers = new Map(); // userId -> count

const initSocket = (io) => {
  ioInstance = io;
  console.log('Socket.io server initialized');

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Join a private room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });
    
    // Join admin telemetry room
    socket.on('admin_join', () => {
      socket.join('admin_telemetry');
      console.log(`Socket ${socket.id} joined admin_telemetry`);
      // Emit current online users immediately
      socket.emit('presence_sync', Array.from(onlineUsers.keys()));
    });

    socket.on('authenticate', (token) => {
      try {
        if (!token) return;
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.userId = decoded.id;
        
        // Track presence
        const count = onlineUsers.get(socket.userId) || 0;
        onlineUsers.set(socket.userId, count + 1);
        
        if (count === 0) {
          io.to('admin_telemetry').emit('presence_update', { userId: socket.userId, status: 'online' });
        }
        console.log(`Socket ${socket.id} authenticated as user ${socket.userId}`);
      } catch (err) {
        console.error('Socket authentication failed:', err.message);
      }
    });

    socket.on('send_message', async (data) => {
      const { threadId, text, roomId } = data;
      let savedMessage;
      try {
        if (threadId && socket.userId && text) {
          savedMessage = await prisma.chatMessage.create({
            data: { threadId, senderId: socket.userId, text },
            include: { sender: { select: { id: true, name: true, avatarUrl: true } } }
          });
          await prisma.chatThread.update({
            where: { id: threadId },
            data: { updatedAt: new Date() }
          });
        }
      } catch (err) {
        console.error('Socket message save failed:', err);
      }
      const payload = savedMessage || data;
      if (roomId) socket.to(roomId).emit('receive_message', payload);
      else socket.broadcast.emit('receive_message', payload);
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        const count = onlineUsers.get(socket.userId) || 0;
        if (count > 1) {
          onlineUsers.set(socket.userId, count - 1);
        } else {
          onlineUsers.delete(socket.userId);
          io.to('admin_telemetry').emit('presence_update', { userId: socket.userId, status: 'offline' });
        }
      }
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

const broadcastAdminActivity = (activity) => {
  if (ioInstance) {
    ioInstance.to('admin_telemetry').emit('activity_stream', {
      ...activity,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = { initSocket, broadcastAdminActivity, onlineUsers };
