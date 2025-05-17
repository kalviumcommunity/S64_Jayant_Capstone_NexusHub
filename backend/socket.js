const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/userModel');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.user.name}`);
    
    // Join personal room
    socket.join(socket.user._id.toString());

    // Join feed room for real-time updates
    socket.join('feed');

    // Online status
    socket.broadcast.emit('user_online', socket.user._id);

    // Join chat room
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.user.name} joined chat: ${chatId}`);
    });

    // Leave chat room
    socket.on('leave_chat', (chatId) => {
      socket.leave(chatId);
      console.log(`User ${socket.user.name} left chat: ${chatId}`);
    });

    // New message
    socket.on('new_message', (message) => {
      socket.to(message.chat).emit('message_received', message);
    });

    // Typing indicator
    socket.on('typing', (chatId) => {
      socket.to(chatId).emit('typing', {
        chatId,
        userId: socket.user._id
      });
    });

    // Stop typing
    socket.on('stop_typing', (chatId) => {
      socket.to(chatId).emit('stop_typing', {
        chatId,
        userId: socket.user._id
      });
    });

    // Post interactions
    socket.on('like_post', (postId) => {
      // This will be handled by the controller, but we can use this for additional logic
      console.log(`User ${socket.user.name} liked post: ${postId}`);
    });

    socket.on('comment_post', (postId) => {
      // This will be handled by the controller, but we can use this for additional logic
      console.log(`User ${socket.user.name} commented on post: ${postId}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User Disconnected: ${socket.user.name}`);
      socket.broadcast.emit('user_offline', socket.user._id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO }; 