const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('./db');
const { JWT_SECRET } = require('./middleware/auth');

let ioInstance = null;
// userId -> { socketCount: number, user: { id, name, role, email }, connectedAt: Date }
const onlineUsers = new Map();

// In-memory activity throttle cache: key -> timestamp
const activityThrottle = new Map();

const initSocket = (io) => {
  ioInstance = io;
  console.log('Socket.io server initialized');

  io.on('connection', (socket) => {
    // Join a private room (e.g., direct chat thread or group)
    socket.on('join_room', (roomId) => {
      if (!roomId) return;
      socket.join(roomId);
    });

    // Helper to verify admin privileges server-side
    const verifyAdmin = async (token) => {
      try {
        const authToken = token || socket.authToken;
        if (!authToken) return null;
        const decoded = jwt.verify(authToken, JWT_SECRET);
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, name: true, role: true, email: true },
        });
        if (user && user.role === 'ADMIN') {
          return user;
        }
      } catch (err) {
        console.error('Socket admin verification failed:', err.message);
      }
      return null;
    };

    // Authenticate socket user
    socket.on('authenticate', async (token) => {
      try {
        if (!token) return;
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, name: true, role: true, email: true },
        });

        if (!user) return;

        socket.userId = user.id;
        socket.user = user;
        socket.authToken = token;

        // Track presence in memory
        const existing = onlineUsers.get(user.id);
        const count = existing ? existing.socketCount : 0;
        onlineUsers.set(user.id, {
          socketCount: count + 1,
          user,
          connectedAt: existing?.connectedAt || new Date(),
        });

        // If this is the first active connection for this user, broadcast online status
        if (count === 0) {
          io.to('admin_telemetry').emit('presence_update', {
            userId: user.id,
            name: user.name,
            role: user.role,
            status: 'online',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Socket authentication failed:', err.message);
      }
    });

    // Securely join admin telemetry room with server-side role validation
    socket.on('admin_join', async (token) => {
      const adminUser = await verifyAdmin(token);
      if (!adminUser) {
        socket.emit('admin_error', { message: 'Unauthorized: Admin role required for telemetry room' });
        return;
      }

      socket.join('admin_telemetry');

      // Send initial presence snapshot to the freshly connected admin
      const snapshot = Array.from(onlineUsers.values()).map((entry) => ({
        userId: entry.user.id,
        name: entry.user.name,
        role: entry.user.role,
        email: entry.user.email,
        status: 'online',
        connectedAt: entry.connectedAt,
      }));

      socket.emit('presence_snapshot', snapshot);
      // Legacy backwards-compatible event with user IDs
      socket.emit('presence_sync', Array.from(onlineUsers.keys()));
    });

    // Request presence snapshot manually
    socket.on('presence_snapshot_request', async () => {
      const adminUser = await verifyAdmin();
      if (!adminUser) return;

      const snapshot = Array.from(onlineUsers.values()).map((entry) => ({
        userId: entry.user.id,
        name: entry.user.name,
        role: entry.user.role,
        email: entry.user.email,
        status: 'online',
        connectedAt: entry.connectedAt,
      }));
      socket.emit('presence_snapshot', snapshot);
    });

    // Handle chat messaging
    socket.on('send_message', async (data) => {
      const { threadId, text, roomId } = data;
      let savedMessage;
      try {
        if (threadId && socket.userId && text) {
          savedMessage = await prisma.chatMessage.create({
            data: { threadId, senderId: socket.userId, text },
            include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
          });
          await prisma.chatThread.update({
            where: { id: threadId },
            data: { updatedAt: new Date() },
          });
        }
      } catch (err) {
        console.error('Socket message save failed:', err);
      }
      const payload = savedMessage || data;
      if (roomId) socket.to(roomId).emit('receive_message', payload);
      else socket.broadcast.emit('receive_message', payload);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.userId && socket.user) {
        const existing = onlineUsers.get(socket.userId);
        if (existing) {
          if (existing.socketCount > 1) {
            onlineUsers.set(socket.userId, {
              ...existing,
              socketCount: existing.socketCount - 1,
            });
          } else {
            onlineUsers.delete(socket.userId);
            io.to('admin_telemetry').emit('presence_update', {
              userId: socket.userId,
              name: socket.user.name,
              role: socket.user.role,
              status: 'offline',
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    });
  });
};

/**
 * Broadcast sanitized activity events to the admin telemetry room
 * Safely throttles duplicate rapid events
 */
const broadcastAdminActivity = (activity) => {
  if (!ioInstance) return;

  const {
    id = crypto.randomUUID(),
    userId,
    userName = 'Alumni Member',
    userRole = 'STUDENT',
    actionType = 'GENERAL_ACTIVITY',
    summary,
    message,
    pointsEarned,
  } = activity;

  // Rate-limit identical actionType per user within 3 seconds
  const throttleKey = `${userId}:${actionType}`;
  const now = Date.now();
  const lastTime = activityThrottle.get(throttleKey);
  if (lastTime && now - lastTime < 3000) {
    return;
  }
  activityThrottle.set(throttleKey, now);

  // Clean old throttle keys periodically
  if (activityThrottle.size > 500) {
    for (const [k, time] of activityThrottle.entries()) {
      if (now - time > 10000) activityThrottle.delete(k);
    }
  }

  ioInstance.to('admin_telemetry').emit('activity_stream', {
    id,
    userId,
    userName,
    userRole,
    actionType,
    summary: summary || message || `${userName} performed ${actionType}`,
    message: message || summary || `${userName} performed ${actionType}`,
    pointsEarned: pointsEarned || 0,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { initSocket, broadcastAdminActivity, onlineUsers };

