const express = require("express");
const router = express.Router();
const { createTask } = require("../controllers/taskController");
router.post("/tasks", createTask);
module.exports = router;
