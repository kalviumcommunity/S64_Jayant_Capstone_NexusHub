const express = require("express");
const router = express.Router();
const { getAllTasks, getTaskById } = require("../controllers/taskController");

// Get all tasks
router.get("/tasks", getAllTasks);

// Get task by ID
router.get("/tasks/:id", getTaskById);

module.exports = router;