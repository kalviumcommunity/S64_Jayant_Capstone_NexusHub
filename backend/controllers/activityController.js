const Activity = require('../models/activityModel');
const Project = require('../models/projectModel');

// Create a new activity
const createActivity = async (req, res) => {
  try {
    const { projectId, action, entityType, entityId, description, metadata } = req.body;

    if (!projectId || !action || !entityType || !entityId || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Create activity
    const activity = await Activity.create({
      projectId,
      userId: req.user._id,
      action,
      entityType,
      entityId,
      description,
      metadata: metadata || {}
    });

    // Populate user data
    await activity.populate('userId', 'name email profilePicture');

    res.status(201).json({
      success: true,
      activity
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get activities for a project
const getProjectActivities = async (req, res) => {
  try {
    const { projectId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access to this project
    const isTeamMember = project.team.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!isTeamMember && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view activities for this project'
      });
    }

    // Get activities
    const activities = await Activity.find({ projectId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email profilePicture');

    // Get total count for pagination
    const total = await Activity.countDocuments({ projectId });

    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching project activities:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function to log activity (can be used from other controllers)
const logActivity = async (userId, projectId, action, entityType, entityId, description, metadata = {}) => {
  try {
    const activity = await Activity.create({
      projectId,
      userId,
      action,
      entityType,
      entityId,
      description,
      metadata
    });
    
    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
};

module.exports = {
  createActivity,
  getProjectActivities,
  logActivity
};