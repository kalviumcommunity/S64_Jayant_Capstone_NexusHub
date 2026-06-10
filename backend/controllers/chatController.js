const Chat = require('../models/chatModel');
const User = require('../models/userModel');
const Team = require('../models/teamModel');
const Project = require('../models/projectModel');

const normalizeIds = (values = []) => {
  const ids = new Set();

  values.forEach((value) => {
    if (!value) {
      return;
    }

    const id = typeof value === 'object'
      ? (value._id || value.id || value.user?._id || value.user)
      : value;

    if (id) {
      ids.add(id.toString());
    }
  });

  return [...ids];
};

const populateChat = async (chat) => {
  if (!chat) {
    return chat;
  }

  const populatedChat = await chat.populate([
    { path: 'users', select: 'name email username profilePicture' },
    { path: 'groupAdmin', select: 'name email username profilePicture' },
    { path: 'latestMessage' },
    { path: 'teamId', select: 'name description owner members projects' },
    { path: 'projectId', select: 'title description createdBy team teamId' }
  ]);

  if (populatedChat.latestMessage) {
    await populatedChat.populate('latestMessage.sender', 'name email username profilePicture');
  }

  return populatedChat;
};

const buildTeamParticipants = async (teamId) => {
  const team = await Team.findById(teamId)
    .populate('owner', 'name email username profilePicture')
    .populate('members.user', 'name email username profilePicture');

  if (!team) {
    return null;
  }

  const participants = [team.owner, ...(team.members || []).map(member => member.user)];
  return { team, participants: normalizeIds(participants) };
};

const buildProjectParticipants = async (projectId) => {
  const project = await Project.findById(projectId)
    .populate('createdBy', 'name email username profilePicture')
    .populate('team.user', 'name email username profilePicture');

  if (!project) {
    return null;
  }

  let participants = [project.createdBy, ...(project.team || []).map(member => member.user)];

  if (project.teamId) {
    const teamBundle = await buildTeamParticipants(project.teamId);
    if (teamBundle?.participants) {
      participants = [...participants, ...teamBundle.participants];
    }
  }

  return { project, participants: normalizeIds(participants) };
};

// Access chat or create new one (1-on-1)
exports.accessChat = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "UserId param not sent with request"
      });
    }

    const otherUser = await User.findById(userId).select('name email username profilePicture');

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let chat = await Chat.findOne({
      isGroupChat: false,
      users: {
        $all: [req.user._id, userId]
      }
    })
    .populate("users", "-password")
    .populate("latestMessage");

    if (chat) {
      chat = await populateChat(chat);
    } else {
      // Create new chat
      chat = await Chat.create({
        chatName: otherUser.name || otherUser.username || 'Direct Chat',
        isGroupChat: false,
        users: [req.user._id, userId]
      });

      chat = await populateChat(chat);
    }

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error accessing chat",
      error: error.message
    });
  }
};

// Get all chats for a user
exports.fetchChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } }
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("teamId")
      .populate("projectId")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    await User.populate(chats, {
      path: "latestMessage.sender",
      select: "name email profilePicture"
    });

    res.json({
      success: true,
      chats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching chats",
      error: error.message
    });
  }
};

const createContextChat = async ({ req, res, contextType, contextId }) => {
  try {
    let contextBundle = null;
    let existingChatQuery = { isGroupChat: true };
    let chatPayload = {};

    if (contextType === 'team') {
      contextBundle = await buildTeamParticipants(contextId);

      if (!contextBundle) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      existingChatQuery.teamId = contextId;
      chatPayload = {
        chatName: contextBundle.team.name,
        users: contextBundle.participants,
        groupAdmin: contextBundle.team.owner,
        teamId: contextId
      };
    } else if (contextType === 'project') {
      contextBundle = await buildProjectParticipants(contextId);

      if (!contextBundle) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      existingChatQuery.projectId = contextId;
      chatPayload = {
        chatName: contextBundle.project.title,
        users: contextBundle.participants,
        groupAdmin: contextBundle.project.createdBy,
        projectId: contextId
      };
    }

    if (!contextBundle) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported chat context'
      });
    }

    let chat = await Chat.findOne(existingChatQuery);

    if (!chat) {
      chat = await Chat.create(chatPayload);
    }

    chat = await populateChat(chat);

    res.status(200).json({
      success: true,
      chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error creating ${contextType} chat`,
      error: error.message
    });
  }
};

// Create group chat
exports.createGroupChat = async (req, res) => {
  try {
    const { name, users, description, teamId, projectId } = req.body;

    if (!name || !users) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields"
      });
    }

    let userIds = Array.isArray(users) ? users : JSON.parse(users);
    if (userIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: "More than 2 users are required to form a group chat"
      });
    }

    userIds = normalizeIds([...userIds, req.user._id]);

    const duplicateQuery = { isGroupChat: true, users: { $all: userIds, $size: userIds.length } };

    if (teamId) {
      duplicateQuery.teamId = teamId;
    }

    if (projectId) {
      duplicateQuery.projectId = projectId;
    }

    let groupChat = await Chat.findOne(duplicateQuery);

    if (groupChat) {
      groupChat = await populateChat(groupChat);
      return res.status(200).json({
        success: true,
        chat: groupChat
      });
    }

    const createdChat = await Chat.create({
      chatName: name,
      users: userIds,
      isGroupChat: true,
      groupAdmin: req.user._id,
      description,
      teamId,
      projectId
    });

    const fullGroupChat = await populateChat(createdChat);

    res.status(201).json({
      success: true,
      chat: fullGroupChat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating group chat",
      error: error.message
    });
  }
};

exports.createTeamChat = async (req, res) => {
  return createContextChat({
    req,
    res,
    contextType: 'team',
    contextId: req.params.teamId
  });
};

exports.createProjectChat = async (req, res) => {
  return createContextChat({
    req,
    res,
    contextType: 'project',
    contextId: req.params.projectId
  });
};

// Update group chat
exports.updateGroupChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { name, description } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        chatName: name,
        description
      },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    res.json({
      success: true,
      chat: updatedChat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating group chat",
      error: error.message
    });
  }
};

// Add user to group
exports.addToGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    const added = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { users: userId }
      },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!added) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    res.json({
      success: true,
      chat: added
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding user to group",
      error: error.message
    });
  }
};

// Remove user from group
exports.removeFromGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    const removed = await Chat.findByIdAndUpdate(
      chatId,
      {
        $pull: { users: userId }
      },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    res.json({
      success: true,
      chat: removed
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error removing user from group",
      error: error.message
    });
  }
}; 