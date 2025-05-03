const express = require('express');
const router = express.Router();
const protect = require('../middleware/protectMiddleware');
const { createProject, getProjects, getProject, updateProject, deleteProject } = require('../controllers/projectController');

// Create a project / Get all projects
router.post('/', protect, createProject);  // Changed /create to /
router.get('/', protect, getProjects);

// Get one / Update / Delete specific project by ID
router.get('/:id', protect, getProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

module.exports = router;