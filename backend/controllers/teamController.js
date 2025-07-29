const Team = require('../models/teamModel');
const User = require('../models/userModel');
const Project = require('../models/projectModel');
const cloudinary = require('../config/cloudinary');

// Create a new team
exports.createTeam = async (req, res) => {
  try {
    const { name, description, isPublic, tags, initialProject } = req.body;
    
    let bannerUrl = null;
    
    // Handle banner upload if file is provided
    if (req.file) {
      try {
        // Convert buffer to base64
        const base64Image = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;
        
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'team-banners',
          resource_type: 'auto'
        });
        bannerUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Error uploading banner:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload banner image'
        });
      }
    }
    
    // Create team with banner field
    const teamData = {
      name,
      description,
      owner: req.user._id,
      isPublic: isPublic !== undefined ? isPublic : true,
      tags: tags || [],
      banner: bannerUrl
    };
    
    const team = new Team(teamData);
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
    console.log('=== updateTeam called ===');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    console.log('req.params.id:', req.params.id);
    
    const { name, description, isPublic, tags } = req.body;
    
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      console.error('Team not found for ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    console.log('Found team:', team.name);
    
    // Check if user is the owner or admin
    const isOwner = team.owner.toString() === req.user._id.toString();
    const isAdmin = team.members.some(member => 
      member.user.toString() === req.user._id.toString() && member.role === 'admin'
    );
    
    console.log('isOwner:', isOwner, 'isAdmin:', isAdmin);
    
    if (!isOwner && !isAdmin) {
      console.error('User not authorized to update team');
      return res.status(403).json({
        success: false,
        message: 'Only the team owner or admins can update team details'
      });
    }
    
    let bannerUrl = team.banner; // Keep existing banner by default
    
    // Handle banner upload if file is provided
    if (req.file) {
      console.log('Processing banner upload...');
      try {
        // Convert buffer to base64
        const base64Image = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;
        
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'team-banners',
          resource_type: 'auto'
        });
        bannerUrl = result.secure_url;
        console.log('Banner uploaded successfully:', bannerUrl);
      } catch (uploadError) {
        console.error('Error uploading banner:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload banner image'
        });
      }
    } else {
      console.log('No banner file provided, keeping existing banner');
    }
    
    // Update fields
    const updateData = {
      name: name || team.name,
      description: description || team.description,
      isPublic: isPublic !== undefined ? isPublic : team.isPublic,
      tags: tags || team.tags,
      banner: bannerUrl
    };
    
    console.log('Update data:', updateData);
    
    // Update team with new data
    Object.assign(team, updateData);
    await team.save();
    
    console.log('Team updated successfully');
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Error in updateTeam:', error);
    console.error('Error stack:', error.stack);
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
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (team.isPublic) return res.status(400).json({ success: false, message: 'Team is public, you can join directly' });
    if (team.members.some(m => m.user.toString() === req.user.id)) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }
    if (team.joinRequests.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Already requested' });
    }
    team.joinRequests.push(req.user.id);
    await team.save();
    res.json({ success: true, message: 'Join request sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending join request', error: error.message });
  }
};

exports.acceptJoinRequest = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    const { userId } = req.body;
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (team.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the team owner can accept requests' });
    }
    if (!team.joinRequests.includes(userId)) {
      return res.status(400).json({ success: false, message: 'No such join request' });
    }
    // Add as member
    team.members.push({ user: userId, role: 'member' });
    team.joinRequests = team.joinRequests.filter(id => id.toString() !== userId);
    await team.save();
    res.json({ success: true, message: 'Join request accepted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error accepting join request', error: error.message });
  }
};

exports.declineJoinRequest = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    const { userId } = req.body;
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (team.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the team owner can decline requests' });
    }
    if (!team.joinRequests.includes(userId)) {
      return res.status(400).json({ success: false, message: 'No such join request' });
    }
    team.joinRequests = team.joinRequests.filter(id => id.toString() !== userId);
    await team.save();
    res.json({ success: true, message: 'Join request declined' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error declining join request', error: error.message });
  }
};

exports.listJoinRequests = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('joinRequests', 'username name profilePicture');
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (team.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the team owner can view join requests' });
    }
    res.json({ success: true, joinRequests: team.joinRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing join requests', error: error.message });
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

// Suggested Teams (by tags/skills, friends, or random public teams)
exports.suggestedTeams = async (req, res) => {
  console.log('==== suggestedTeams called ====');
  try {
    console.log('req.user:', req.user);
    if (!req.user || !req.user._id) {
      console.error('No user or user._id in req.user:', req.user);
      return res.status(401).json({ success: false, message: 'Unauthorized: User not found in request.' });
    }
    const currentUser = await User.findById(req.user._id).populate(['followers', 'following']);
    if (!currentUser) {
      console.error('User not found in DB for _id:', req.user._id);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get all teams where user is already a member or owner
    const myTeamIds = new Set();
    const myTeams = await Team.find({
      $or: [
        { owner: currentUser._id },
        { 'members.user': currentUser._id }
      ]
    });
    myTeams.forEach(t => myTeamIds.add(t._id.toString()));

    let suggestions = [];

    // 1. If user has skills, suggest teams matching those skills
    if (currentUser.skills && Array.isArray(currentUser.skills) && currentUser.skills.length > 0) {
      const skillTeams = await Team.find({
        _id: { $nin: Array.from(myTeamIds) },
        tags: { $in: currentUser.skills }
      })
        .populate('owner', 'name username profilePicture')
        .populate('members.user', 'name username profilePicture')
        .sort({ createdAt: -1 });
      suggestions = skillTeams;
    }

    // 2. If no skills or not enough suggestions, suggest teams joined by friends (followers/following)
    if (suggestions.length < 10 && (currentUser.followers.length > 0 || currentUser.following.length > 0)) {
      const friendIds = [
        ...currentUser.followers.map(f => f._id ? f._id : f),
        ...currentUser.following.map(f => f._id ? f._id : f)
      ];
      // Remove duplicates and self
      const uniqueFriendIds = [...new Set(friendIds.filter(id => id.toString() !== currentUser._id.toString()))];
      if (uniqueFriendIds.length > 0) {
        const friendTeams = await Team.find({
          _id: { $nin: Array.from(myTeamIds) },
          'members.user': { $in: uniqueFriendIds }
        })
          .populate('owner', 'name username profilePicture')
          .populate('members.user', 'name username profilePicture')
          .sort({ createdAt: -1 });
        // Add only new teams not already in suggestions
        const friendTeamIds = new Set(suggestions.map(t => t._id.toString()));
        friendTeams.forEach(t => {
          if (!friendTeamIds.has(t._id.toString())) suggestions.push(t);
        });
      }
    }

    // 3. If still not enough, suggest random public teams (not already joined)
    if (suggestions.length < 10) {
      // Pick a random real user (not current user) with skills
      const randomUser = await User.findOne({ _id: { $ne: currentUser._id }, skills: { $exists: true, $not: { $size: 0 } } });
      let randomSkillTeams = [];
      if (randomUser && randomUser.skills && randomUser.skills.length > 0) {
        randomSkillTeams = await Team.find({
          _id: { $nin: Array.from(myTeamIds) },
          tags: { $in: randomUser.skills }
        })
          .populate('owner', 'name username profilePicture')
          .populate('members.user', 'name username profilePicture')
          .sort({ createdAt: -1 });
      }
      // Add only new teams
      const suggestionIds = new Set(suggestions.map(t => t._id.toString()));
      randomSkillTeams.forEach(t => {
        if (!suggestionIds.has(t._id.toString())) suggestions.push(t);
      });
      // If still not enough, just add random public teams
      if (suggestions.length < 10) {
        const publicTeams = await Team.find({
          _id: { $nin: Array.from(myTeamIds) },
          isPublic: true
        })
          .populate('owner', 'name username profilePicture')
          .populate('members.user', 'name username profilePicture')
          .sort({ createdAt: -1 })
          .limit(20); // get more to filter out duplicates
        publicTeams.forEach(t => {
          if (!suggestions.some(s => s._id.toString() === t._id.toString())) suggestions.push(t);
        });
      }
    }

    // Limit to 10 suggestions
    suggestions = suggestions.slice(0, 10);
    return res.json({ success: true, teams: suggestions });
  } catch (error) {
    console.error('Error in suggestedTeams:', error);
    if (typeof error === 'object' && error.stack) {
      console.error('Stack:', error.stack);
    }
    try {
      console.error('req.user in catch:', req.user);
    } catch (e) {}
    // Never return 500 for empty suggestions, only for real server errors
    return res.json({ success: true, teams: [] });
  }
};