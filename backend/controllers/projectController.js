const Project = require('../models/projectModel');
const Task = require('../models/taskModel');
const { logActivity } = require('./activityController');

// Create new project
const createProject = async (req, res) => {
  try {
    const { title, description, team = [], startDate, dueDate, tags, teamId, isPersonal } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }
    
    // If teamId is provided and it's not a personal project, verify user has permission to create projects for this team
    if (teamId && !isPersonal) {
      const Team = require('../models/teamModel');
      const team = await Team.findById(teamId);
      
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }
      
      // Check if user is owner of the team
      const isOwner = team.owner.toString() === req.user._id.toString();
      const isAdmin = team.members.some(member => 
        member.user.toString() === req.user._id.toString() && member.role === 'admin'
      );
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only team owners and admins can create projects for this team'
        });
      }
      
      // Get team members to add to project
      const teamMembers = team.members.map(member => ({
        user: member.user,
        role: member.role === 'owner' ? 'owner' : 
              member.role === 'admin' ? 'admin' : 'member'
      }));
      
      // Create the project with team members
      const project = await Project.create({
        title,
        description,
        createdBy: req.user._id,
        team: teamMembers,
        startDate,
        dueDate,
        tags,
        teamId, // Store reference to the team
        isPersonal: false,
        progress: 0,
        totalTasks: 0,
        completedTasks: 0
      });
      
      await project.populate([
        { path: 'team.user', select: 'name email profilePicture' },
        { path: 'createdBy', select: 'name email profilePicture' }
      ]);
      
      // Add this project to the team's projects array
      team.projects.push(project._id);
      await team.save();
      
      // Log activity
      await logActivity(
        req.user._id,
        project._id,
        'created',
        'project',
        project._id,
        `${req.user.name} created a new team project: ${project.title}`
      );
      
      res.status(201).json({
        success: true,
        project
      });
    } else {
      // Create a personal project (not associated with a team)
      const project = await Project.create({
        title,
        description,
        createdBy: req.user._id,
        team: [{ user: req.user._id, role: 'owner' }, ...team],
        startDate,
        dueDate,
        tags,
        isPersonal: true,
        progress: 0,
        totalTasks: 0,
        completedTasks: 0
      });
      
      await project.populate([
        { path: 'team.user', select: 'name email profilePicture' },
        { path: 'createdBy', select: 'name email profilePicture' }
      ]);
      
      // Log activity
      await logActivity(
        req.user._id,
        project._id,
        'created',
        'project',
        project._id,
        `${req.user.name} created a new personal project: ${project.title}`
      );
      
      res.status(201).json({
        success: true,
        project
      });
    }
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

    // Check if user is part of the project team
    const hasDirectAccess = project.team.some(member => 
      member.user._id && member.user._id.toString() === req.user._id.toString()
    );

    // Check if user is the creator of the project
    const isCreator = project.createdBy && 
                     project.createdBy._id && 
                     project.createdBy._id.toString() === req.user._id.toString();

    // Check if project belongs to a team and user is part of that team
    let hasTeamAccess = false;
    if (project.teamId) {
      try {
        const Team = require('../models/teamModel');
        const team = await Team.findById(project.teamId);
        
        if (team) {
          // Check if user is team owner
          const isTeamOwner = team.owner && team.owner.toString() === req.user._id.toString();
          
          // Check if user is team member
          const isTeamMember = team.members && team.members.some(
            member => member.user && member.user.toString() === req.user._id.toString()
          );
          
          hasTeamAccess = isTeamOwner || isTeamMember;
        }
      } catch (teamError) {
        console.error('Error checking team access:', teamError);
        // Continue with other access checks
      }
    }

    // Grant access if user has direct access, is creator, or has team access
    if (!hasDirectAccess && !isCreator && !hasTeamAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this project.'
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
