const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  chatName: {
    type: String,
    trim: true,
    required: true
  },
  isGroupChat: {
    type: Boolean,
    default: false
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  latestMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team"
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project"
  },
  groupImage: {
    type: String,
    default: "default-group.png"
  },
  description: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

chatSchema.index({ teamId: 1 }, { sparse: true });
chatSchema.index({ projectId: 1 }, { sparse: true });

module.exports = mongoose.model("Chat", chatSchema); 