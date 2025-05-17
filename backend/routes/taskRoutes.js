const express = require("express");
const router = express.Router();
const  protect  = require('../middleware/protectMiddleware.js');
const {
  getAllTasks,
  getTaskById,
  createTask,
  getProjectTasks,
  updateTask,
  addTaskComment,
  deleteTask
} = require("../controllers/taskController");

// Get all tasks
router.get("/", protect, getAllTasks);

// Get all tasks (alternative route)
router.get("/tasks", protect, getAllTasks);

// Get task by ID
router.get("/tasks/:id", protect, getTaskById);

// Create & Get tasks for a specific project
router.route('/project/:projectId')
  .post(protect, createTask)
  .get(protect, getProjectTasks);

// Update & delete a task by ID
router.route('/:taskId')
  .put(protect, updateTask)
  .delete(protect, deleteTask);

// Add comment to a task
router.post('/:taskId/comments', protect, addTaskComment);

module.exports = router;
