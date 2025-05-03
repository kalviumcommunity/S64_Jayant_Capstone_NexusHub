const Chat = require('../models/chatModel');
const User = require('../models/userModel');

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

    let chat = await Chat.findOne({
      isGroupChat: false,
      users: {
        $all: [req.user._id, userId]
      }
    })
    .populate("users", "-password")
    .populate("latestMessage");

    if (chat) {
      await chat.populate("latestMessage.sender", "name email profilePicture");
    } else {
      // Create new chat
      chat = await Chat.create({
        chatName: "sender",
        isGroupChat: false,
        users: [req.user._id, userId]
      });

      chat = await chat.populate("users", "-password");
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

// Create group chat
exports.createGroupChat = async (req, res) => {
  try {
    const { name, users, description } = req.body;

    if (!name || !users) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields"
      });
    }

    let userIds = JSON.parse(users);
    if (userIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: "More than 2 users are required to form a group chat"
      });
    }

    userIds.push(req.user._id);

    const groupChat = await Chat.create({
      chatName: name,
      users: userIds,
      isGroupChat: true,
      groupAdmin: req.user._id,
      description
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

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