const initSocket = (io) => {
  console.log('Socket.io server initialized');

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Join a private room (e.g., user's own room or a specific chat room)
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Handle sending messages
    socket.on('send_message', (data) => {
      console.log('Message received:', data);
      
      // If a roomId is provided, broadcast to that room, otherwise broadcast to all
      if (data.roomId) {
        // Broadcast to everyone in the room EXCEPT the sender
        socket.to(data.roomId).emit('receive_message', data);
      } else {
        // Broadcast to everyone EXCEPT the sender
        socket.broadcast.emit('receive_message', data);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = { initSocket };
