const Project = require("../models/projectModel");

const createProject = async (req, res) => {
  try {
    const { title, userId } = req.body;
    const project = await Project.create({ title, createdBy: userId });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createProject };