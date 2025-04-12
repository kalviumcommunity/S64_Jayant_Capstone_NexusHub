const Task = require("../models/taskModel");

const createTask = async (req, res) => {
  try {
    const { title, projectId, userId } = req.body;
    const task = await Task.create({ title, project: projectId, assignedTo: userId });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createTask };