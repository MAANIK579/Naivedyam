const { Server } = require('socket.io');

/**
 * Initialise Socket.IO on the given HTTP server.
 * @param {import('http').Server} server
 * @returns {import('socket.io').Server} io instance
 */
function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    // Join an order-specific room
    socket.on('join:order', (orderId) => {
      socket.join(`order:${orderId}`);
    });

    // Leave an order-specific room
    socket.on('leave:order', (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    // Join a user-specific room for real-time order/notification updates
    socket.on('join:user', (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on('leave:user', (userId) => {
      if (userId) socket.leave(`user:${userId}`);
    });

    // Join the shared kitchen room
    socket.on('join:kitchen', () => {
      socket.join('kitchen');
    });

    socket.on('join_room', (room) => {
      if (room) socket.join(room);
    });
  });

  return io;
}

module.exports = initSocket;
