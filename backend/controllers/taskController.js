const Task = require("../models/taskModel");
const Project = require("../models/projectModel");
const { logActivity } = require('./activityController');

// Utility function to update project progress based on tasks
const updateProjectProgress = async (projectId) => {
  try {
    // Get all tasks for the project
    const tasks = await Task.find({ project: projectId });
    
    // Calculate progress
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    
    // Calculate progress percentage
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Update the project
    await Project.findByIdAndUpdate(projectId, {
      progress,
      totalTasks,
      completedTasks
    });
    
    return { progress, totalTasks, completedTasks };
  } catch (error) {
    console.error('Error updating project progress:', error);
    throw error;
  }
};

// Get all tasks
const getAllTasks = async (req, res) => {
  try {
    // For admin users, return all tasks
    if (req.user.role === 'admin') {
      const tasks = await Task.find()
        .populate('project', 'title description')
        .populate('assignedTo', 'name email profilePicture')
        .populate('createdBy', 'name email profilePicture');
      
      return res.status(200).json({
        success: true,
        count: tasks.length,
        tasks
      });
    }
    
    // For regular users, return only tasks they have access to
    
    // 1. Find all projects where the user is a team member
    const projects = await Project.find({
      'team.user': req.user._id
    });
    
    // 2. Get all tasks from these projects
    const projectIds = projects.map(project => project._id);
    
    // 3. Find tasks where user is either assigned, created the task, or is part of the project team
    const tasks = await Task.find({
      $or: [
        { project: { $in: projectIds } },
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ]
    })
      .populate('project', 'title description')
      .populate('assignedTo', 'name email profilePicture')
      .populate('createdBy', 'name email profilePicture')
      .sort({ updatedAt: -1 });
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching tasks', 
      error: error.message 
    });
  }
};

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project assignedTo');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task', error });
  }
};

// Create new task
const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access to project
    const userTeamMember = project.team.find(
      member => member.user.toString() === req.user._id.toString()
    );
    
    if (!userTeamMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you are not a member of this project'
      });
    }
    
    // Check if task has assignedTo field and user is trying to assign to others
    const isAssigningToOthers = req.body.assignedTo && 
      Array.isArray(req.body.assignedTo) && 
      req.body.assignedTo.some(userId => userId.toString() !== req.user._id.toString());
    
    // If assigning to others, check if user is owner or admin
    if (isAssigningToOthers && !['owner', 'admin'].includes(userTeamMember.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only team owners and admins can assign tasks to other members'
      });
    }

    const task = await Task.create({
      ...req.body,
      project: projectId,
      createdBy: req.user._id
    });

    await task.populate('assignedTo', 'name email profilePicture');
    await task.populate('createdBy', 'name email profilePicture');

    // Update project progress
    const progressData = await updateProjectProgress(projectId);
    
    // Log activity
    await logActivity(
      req.user._id,
      projectId,
      'created',
      'task',
      task._id,
      `${req.user.name} created a new task: ${task.title}`
    );

    res.status(201).json({
      success: true,
      task,
      projectProgress: progressData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: error.message
    });
  }
};

// Get project tasks
const getProjectTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo, search } = req.query;
    const projectId = req.params.projectId;
    
    // First check if the project exists
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check if user is part of the project team
    const isDirectTeamMember = project.team.some(
      member => member.user && member.user.toString && member.user.toString() === req.user._id.toString()
    );
    
    // Check if user is the creator of the project
    const isCreator = project.createdBy && 
                     project.createdBy.toString && 
                     project.createdBy.toString() === req.user._id.toString();
    
    // Check if project belongs to a team and user is part of that team
    let isTeamMember = false;
    if (project.teamId) {
      try {
        const Team = require('../models/teamModel');
        const team = await Team.findById(project.teamId);
        
        if (team) {
          // Check if user is team owner
          const isTeamOwner = team.owner && team.owner.toString() === req.user._id.toString();
          
          // Check if user is team member
          const isTeamMemberCheck = team.members && team.members.some(
            member => member.user && member.user.toString() === req.user._id.toString()
          );
          
          isTeamMember = isTeamOwner || isTeamMemberCheck;
        }
      } catch (teamError) {
        console.error('Error checking team membership:', teamError);
        // Continue with other access checks
      }
    }
    
    // Check if user is assigned to any task in this project
    let isTaskAssignee = false;
    try {
      const assignedTasks = await Task.countDocuments({
        project: projectId,
        assignedTo: req.user._id
      });
      
      isTaskAssignee = assignedTasks > 0;
    } catch (taskError) {
      console.error('Error checking task assignments:', taskError);
      // Continue with other access checks
    }
    
    // If user has no connection to this project at all, return 403
    if (!isDirectTeamMember && !isCreator && !isTeamMember && !isTaskAssignee) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access tasks for this project'
      });
    }
    
    // Build the query
    const query = { project: projectId };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email profilePicture')
      .populate('createdBy', 'name email profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message
    });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to project
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Find user's role in the project team
    const userTeamMember = project.team.find(
      member => member.user.toString() === req.user._id.toString()
    );
    
    if (!userTeamMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you are not a member of this project'
      });
    }
    
    // Check if user is trying to update assignedTo field
    const isChangingAssignees = req.body.assignedTo !== undefined;
    
    // If changing assignees, check if user is owner or admin
    if (isChangingAssignees && !['owner', 'admin'].includes(userTeamMember.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only team owners and admins can change task assignments'
      });
    }
    
    // Allow status updates by assigned users or team members with appropriate roles
    const isAssignedToTask = task.assignedTo.some(
      userId => userId.toString() === req.user._id.toString()
    );
    
    const isOnlyUpdatingStatus = 
      Object.keys(req.body).length === 1 && 
      req.body.status !== undefined;
    
    // If user is not owner/admin and not assigned to the task,
    // they can only update status if they're only changing status
    if (!['owner', 'admin'].includes(userTeamMember.role) && 
        !isAssignedToTask && 
        !isOnlyUpdatingStatus) {
      return res.status(403).json({
        success: false,
        message: 'You can only update the status of this task'
      });
    }

    // If status is being updated to completed, set completedAt
    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedAt = Date.now();
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.taskId,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email profilePicture')
      .populate('createdBy', 'name email profilePicture');
    
    // Update project progress
    const progressData = await updateProjectProgress(task.project);
    
    // Log activity based on what was updated
    let action = 'updated';
    let description = `${req.user.name} updated task: ${updatedTask.title}`;
    
    if (req.body.status === 'completed' && task.status !== 'completed') {
      action = 'completed';
      description = `${req.user.name} marked task as completed: ${updatedTask.title}`;
    } else if (req.body.assignedTo && !task.assignedTo.includes(req.body.assignedTo)) {
      action = 'assigned';
      description = `${req.user.name} assigned task to team members: ${updatedTask.title}`;
    }
    
    await logActivity(
      req.user._id,
      task.project,
      action,
      'task',
      task._id,
      description
    );

    res.json({
      success: true,
      task: updatedTask,
      projectProgress: progressData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message
    });
  }
};

// Add comment to task
const addTaskComment = async (req, res) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.comments.push({
      text,
      user: req.user._id
    });

    await task.save();
    await task.populate('comments.user', 'name email profilePicture');
    
    // Log activity
    await logActivity(
      req.user._id,
      task.project,
      'commented',
      'task',
      task._id,
      `${req.user.name} commented on task: ${task.title}`
    );

    res.json({
      success: true,
      comments: task.comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to project
    const project = await Project.findById(task.project);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Find user's role in the project
    const userTeamMember = project.team.find(
      member => member.user.toString() === req.user._id.toString()
    );
    
    // Check if user is the creator of the task
    const isTaskCreator = task.createdBy && task.createdBy.toString() === req.user._id.toString();
    
    // Check if user is assigned to the task
    const isAssignedToTask = task.assignedTo && task.assignedTo.some(
      userId => userId.toString() === req.user._id.toString()
    );
    
    // Allow deletion if user is owner/admin of the project OR created the task
    if ((!userTeamMember || !['owner', 'admin'].includes(userTeamMember.role)) && !isTaskCreator) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this task. Only project owners, admins, or the task creator can delete tasks.'
      });
    }

    await Task.deleteOne({ _id: task._id });

    // Update project progress after task deletion
    await updateProjectProgress(project._id);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: error.message
    });
  }
};

module.exports = { getAllTasks, getTaskById, createTask, getProjectTasks, updateTask, addTaskComment, deleteTask };
