const Team = require('../models/teamModel');
const User = require('../models/userModel');
const Project = require('../models/projectModel');

// Create a new team
exports.createTeam = async (req, res) => {
  try {
    const { name, description, isPublic, tags, initialProject } = req.body;
    
    // Create the team
    const team = new Team({
      name,
      description,
      owner: req.user._id,
      isPublic: isPublic !== undefined ? isPublic : true,
      tags: tags || [],
      members: [{ user: req.user._id, role: 'admin' }],
      projects: [] // Initialize empty projects array
    });
    
    await team.save();
    
    // If initialProject is provided, create a default project for this team
    if (initialProject || true) { // Always create a default project
      const projectName = initialProject?.name || `${name} Project`;
      const projectDesc = initialProject?.description || `Default project for ${name} team`;
      
      try {
        // Create a project using the Project model
        const Project = require('../models/projectModel');
        const newProject = new Project({
          title: projectName,
          description: projectDesc,
          createdBy: req.user._id,
          team: [{ user: req.user._id, role: 'owner' }],
          status: 'planning',
          priority: 'medium',
          startDate: new Date(),
          tags: tags || []
        });
        
        await newProject.save();
        
        // Add the project to the team's projects array
        team.projects.push(newProject._id);
        await team.save();
      } catch (projectError) {
        console.error('Error creating default project for team:', projectError);
        // Continue even if project creation fails
      }
    }
    
    // Populate the team data before sending response
    await team.populate([
      { path: 'owner', select: 'name username profilePicture' },
      { path: 'members.user', select: 'name username profilePicture' },
      { path: 'projects' }
    ]);
    
    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create team',
      error: error.message
    });
  }
};

// Get all teams (with filtering options)
exports.getTeams = async (req, res) => {
  try {
    const { search, isPublic, tags } = req.query;
    const query = {};
    
    // Search by name or description
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filter by public/private
    if (isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    }
    
    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',');
      query.tags = { $in: tagArray };
    }
    
    const teams = await Team.find(query)
      .populate('owner', 'name username profilePicture')
      .populate('members.user', 'name username profilePicture')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams',
      error: error.message
    });
  }
};

// Get teams for current user
exports.getMyTeams = async (req, res) => {
  try {
    // Teams where user is owner
    const ownedTeams = await Team.find({ owner: req.user._id })
      .populate('owner', 'name username profilePicture')
      .populate('members.user', 'name username profilePicture')
      .sort({ createdAt: -1 });
    
    // Teams where user is a member
    const memberTeams = await Team.find({ 
      'members.user': req.user._id,
      owner: { $ne: req.user._id }
    })
      .populate('owner', 'name username profilePicture')
      .populate('members.user', 'name username profilePicture')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: {
        owned: ownedTeams,
        member: memberTeams
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams',
      error: error.message
    });
  }
};

// Get a single team by ID
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('owner', 'name username profilePicture')
      .populate('members.user', 'name username profilePicture')
      .populate('projects');
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    // Always allow access to public teams
    if (team.isPublic) {
      return res.status(200).json({
        success: true,
        data: team
      });
    }
    
    // For private teams, check if user is owner or member
    const isOwner = team.owner && 
                   team.owner._id && 
                   team.owner._id.toString() === req.user._id.toString();
    
    const isMember = team.members && team.members.some(member => 
      member.user && 
      member.user._id && 
      member.user._id.toString() === req.user._id.toString()
    );
    
    // Check if user is part of any project in the team
    let isProjectMember = false;
    if (team.projects && team.projects.length > 0) {
      try {
        // Get all projects in this team
        const projectIds = team.projects.map(p => p._id || p);
        
        // Find any project where user is a team member
        const userProjects = await Project.find({
          _id: { $in: projectIds },
          'team.user': req.user._id
        });
        
        isProjectMember = userProjects.length > 0;
      } catch (projectError) {
        console.error('Error checking project membership:', projectError);
        // Continue with other access checks
      }
    }
    
    if (!isOwner && !isMember && !isProjectMember) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this team'
      });
    }
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team',
      error: error.message
    });
  }
};

// Update a team
exports.updateTeam = async (req, res) => {
  try {
    const { name, description, isPublic, tags, avatar } = req.body;
    
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    // Check if user is the owner
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the team owner can update team details'
      });
    }
    
    // Update fields
    if (name) team.name = name;
    if (description) team.description = description;
    if (isPublic !== undefined) team.isPublic = isPublic;
    if (tags) team.tags = tags;
    if (avatar) team.avatar = avatar;
    
    await team.save();
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update team',
      error: error.message
    });
  }
};

// Delete a team
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    // Check if user is the owner
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the team owner can delete the team'
      });
    }
    
    // Remove team from projects
    await Project.updateMany(
      { team: { $elemMatch: { user: { $in: team.members.map(m => m.user) } } } },
      { $pull: { team: { user: { $in: team.members.map(m => m.user) } } } }
    );
    
    await Team.deleteOne({ _id: team._id });
    
    res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete team',
      error: error.message
    });
  }
};

// Add a member to team
exports.addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    // Check if user is the owner or admin
    const isOwner = team.owner.toString() === req.user._id.toString();
    const isAdmin = team.members.some(member => 
      member.user.toString() === req.user._id.toString() && member.role === 'admin'
    );
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the team owner or admins can add members'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user is already a member
    const isMember = team.members.some(member => member.user.toString() === userId);
    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this team'
      });
    }
    
    // Add member
    team.members.push({
      user: userId,
      role: role || 'member'
    });
    
    // If the user had a pending join request, remove it
    team.joinRequests = team.joinRequests.filter(
      request => request.user.toString() !== userId
    );
    
    await team.save();
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add member',
      error: error.message
    });
  }
};

// Request to join a team
exports.requestToJoin = async (req, res) => {
  try {
    const { message } = req.body;
    const teamId = req.params.id;
    
    const team = await Team.findById(teamId);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    // If team is public, add user directly
    if (team.isPublic) {
      // Check if user is already a member
      const isMember = team.members.some(member => 
        member.user.toString() === req.user._id.toString()
      );
      
      if (isMember) {
        return res.status(400).json({
          success: false,
          message: 'You are already a member of this team'
        });
      }
      
      // Add user as a member
      team.members.push({
        user: req.user._id,
        role: 'member'
      });
      
      await team.save();
      
      return res.status(200).json({
        success: true,
        message: 'You have joined the team successfully',
        data: team
      });
    }
    
    // For private teams, create a join request
    
    // Check if user already has a pending request
    const hasPendingRequest = team.joinRequests.some(request => 
      request.user.toString() === req.user._id.toString()
    );
    
    if (hasPendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request to join this team'
      });
    }
    
    // Add join request
    team.joinRequests.push({
      user: req.user._id,
      message: message || ''
    });
    
    await team.save();
    
    res.status(200).json({
      success: true,
      message: 'Join request sent successfully',
      data: {
        teamId: team._id,
        teamName: team.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to request team join',
      error: error.message
    });
  }
};

// Get all join requests for a team
exports.getJoinRequests = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('joinRequests.user', 'name username profilePicture');
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    // Check if user is the owner or admin
    const isOwner = team.owner.toString() === req.user._id.toString();
    const isAdmin = team.members.some(member => 
      member.user.toString() === req.user._id.toString() && member.role === 'admin'
    );
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the team owner or admins can view join requests'
      });
    }
    
    res.status(200).json({
      success: true,
      count: team.joinRequests.length,
      data: team.joinRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch join requests',
      error: error.message
    });
  }
};

// Handle a join request (accept or reject)
exports.handleJoinRequest = async (req, res) => {
  try {
    const { userId, action } = req.body;
    
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be either "accept" or "reject"'
      });
    }
    
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    // Check if user is the owner or admin
    const isOwner = team.owner.toString() === req.user._id.toString();
    const isAdmin = team.members.some(member => 
      member.user.toString() === req.user._id.toString() && member.role === 'admin'
    );
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the team owner or admins can handle join requests'
      });
    }
    
    // Check if request exists
    const requestIndex = team.joinRequests.findIndex(request => 
      request.user.toString() === userId
    );
    
    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }
    
    if (action === 'accept') {
      // Add user as a member
      team.members.push({
        user: userId,
        role: 'member'
      });
    }
    
    // Remove the request regardless of action
    team.joinRequests.splice(requestIndex, 1);
    
    await team.save();
    
    res.status(200).json({
      success: true,
      message: `Join request ${action}ed successfully`,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to handle join request',
      error: error.message
    });
  }
};

// Remove a member from team
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    // Check if user is the owner or admin
    const isOwner = team.owner.toString() === req.user._id.toString();
    const isAdmin = team.members.some(member => 
      member.user.toString() === req.user._id.toString() && member.role === 'admin'
    );
    
    // Allow users to remove themselves
    const isSelf = userId === req.user._id.toString();
    
    if (!isOwner && !isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove members'
      });
    }
    
    // Cannot remove the owner
    if (userId === team.owner.toString() && !isSelf) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the team owner'
      });
    }
    
    // Remove member
    team.members = team.members.filter(member => member.user.toString() !== userId);
    
    await team.save();
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove member',
      error: error.message
    });
  }
};

// Update member role
exports.updateMemberRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    // Only owner can change roles
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the team owner can update member roles'
      });
    }
    
    // Cannot update owner's role
    if (userId === team.owner.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update the owner\'s role'
      });
    }
    
    // Update role
    const memberIndex = team.members.findIndex(member => member.user.toString() === userId);
    
    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in team'
      });
    }
    
    team.members[memberIndex].role = role;
    
    await team.save();
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update member role',
      error: error.message
    });
  }
};