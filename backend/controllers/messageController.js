const Message = require('../models/messageModel');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const { getIO } = require('../socket');

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { content, chatId, attachments } = req.body;

    if ((!content && !attachments) || !chatId) {
      return res.status(400).json({
        success: false,
        message: "Invalid data passed into request"
      });
    }

    let newMessage = {
      sender: req.user._id,
      content: content || "",
      chat: chatId,
      attachments: attachments || []
    };

    let message = await Message.create(newMessage);

    message = await message.populate("sender", "name email profilePicture");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name email profilePicture"
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    // Emit socket event
    getIO().to(chatId).emit('new_message', message);

    res.json({
      success: true,
      message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message
    });
  }
};

// Get all messages for a chat
exports.allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name email profilePicture")
      .populate("chat");

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching messages",
      error: error.message
    });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      {
        chat: req.params.chatId,
        readBy: { $ne: req.user._id }
      },
      {
        $addToSet: { readBy: req.user._id }
      }
    );

    res.json({
      success: true,
      message: "Messages marked as read"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking messages as read",
      error: error.message
    });
  }
}; 