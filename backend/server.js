const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./MongoDb");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const postRoutes = require("./routes/postRoutes");
const cors = require("cors");
const { initializeSocket } = require('./socket');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/posts", postRoutes);

// Error Handling Middleware (Optional but recommended)
app.use((err, req, res, next) => {
  console.error("Error: ", err.message || err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => 
  console.log(`Server running on port http://localhost:${PORT}`)
);

// Initialize Socket.io
initializeSocket(server);

module.exports = app;
