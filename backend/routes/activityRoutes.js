const express = require('express');
const router = express.Router();
const { createActivity, getProjectActivities } = require('../controllers/activityController');
const protect = require('../middleware/protectMiddleware');

// All routes are protected
router.use(protect);

// Create a new activity
router.post('/', createActivity);

// Get activities for a project
router.get('/project/:projectId', getProjectActivities);

module.exports = router;
