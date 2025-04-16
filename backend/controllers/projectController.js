// projectController.js
const Project = require("../models/projectModel");

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate('createdBy');
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error });
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('createdBy');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project', error });
  }
};

module.exports = { getAllProjects, getProjectById };