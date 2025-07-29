const express = require("express");
const dotenv = require("dotenv");
// Load environment variables first
dotenv.config();

const connectDB = require("./MongoDb");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const teamRoutes = require("./routes/teamRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const postRoutes = require("./routes/postRoutes");
const oauthRoutes = require("./routes/oauthRoutes");
const activityRoutes = require("./routes/activityRoutes");
const storyRoutes = require("./routes/storyRoutes");
const cors = require("cors");
const { initializeSocket } = require('./socket');
const passport = require('passport');
const session = require('express-session');

// Load passport configuration after environment variables
require('./config/passport');

connectDB();

const app = express();

console.log('=== server.js started ===');

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://nexushubb.netlify.app"
  ],
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'nexushub_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));
// Ensure the uploads directory exists
const fs = require('fs');
const path = require('path');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}
if (!fs.existsSync('uploads/profile-images')) {
  fs.mkdirSync('uploads/profile-images', { recursive: true });
}

// Initialize Passport
app.use(passport.initialize());

// Health check route for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy' });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use('/api/teams', teamRoutes);
console.log('=== /api/teams routes registered ===');
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/upload", require("./routes/uploadRoutes"));

// Error Handling Middleware (Optional but recommended)
app.use((err, req, res, next) => {
  console.error("Error: ", err.message || err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => 
  console.log(`Server running on port http://localhost:${PORT}`)
);

// Initialize Socket.io
initializeSocket(server);

module.exports = app;
