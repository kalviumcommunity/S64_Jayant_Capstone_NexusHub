const Task = require("../models/taskModel");

// Get all tasks
const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find().populate('project assignedTo');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error });
  }
};

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project assignedTo');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task', error });
  }
};

module.exports = { getAllTasks, getTaskById };
