const express = require("express");
const router = express.Router();
const { createProject } = require("../controllers/projectController");
router.post("/projects", createProject);
module.exports = router;
