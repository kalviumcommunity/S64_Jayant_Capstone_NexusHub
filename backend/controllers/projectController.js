const Project = require('../models/projectModel');
const Task = require('../models/taskModel');

// Create new project
const createProject = async (req, res) => {
  try {
    const { title, description, team = [], startDate, dueDate, tags } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    const project = await Project.create({
      title,
      description,
      createdBy: req.user._id,
      team: [{ user: req.user._id, role: 'owner' }, ...team],
      startDate,
      dueDate,
      tags
    });

    await project.populate([
      { path: 'team.user', select: 'name email profilePicture' },
      { path: 'createdBy', select: 'name email profilePicture' }
    ]);

    res.status(201).json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message
    });
  }
};

// Get all projects
const getProjects = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    const query = { 'team.user': req.user._id };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .populate('team.user', 'name email profilePicture')
      .populate('createdBy', 'name email profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: error.message
    });
  }
};

// Get single project by ID
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('team.user', 'name email profilePicture')
      .populate('createdBy', 'name email profilePicture');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const hasAccess = project.team.some(member => 
      member.user._id.toString() === req.user._id.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email profilePicture')
      .populate('createdBy', 'name email profilePicture');

    res.json({
      success: true,
      project,
      tasks
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message
    });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const userRole = project.team.find(
      member => member.user.toString() === req.user._id.toString()
    )?.role;

    if (!userRole || !['owner', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('team.user', 'name email profilePicture');

    res.json({
      success: true,
      project: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: error.message
    });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const isOwner = project.team.some(
      member => member.user.toString() === req.user._id.toString() && member.role === 'owner'
    );

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can delete the project'
      });
    }

    await Task.deleteMany({ project: project._id });
    await Project.deleteOne({ _id: project._id });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error.message
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject
};
