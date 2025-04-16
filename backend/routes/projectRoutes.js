const express = require("express");
const router = express.Router();
const { getAllProjects, getProjectById } = require("../controllers/projectController");

// Get all projects
router.get("/projects", getAllProjects);

// Get a project by ID
router.get("/projects/:id", getProjectById);

module.exports = router;