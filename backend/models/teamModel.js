const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  joinRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    message: {
      type: String,
      default: ''
    }
  }],
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project"
  }],
  avatar: {
    type: String,
    default: 'default-team.png'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [String]
}, {
  timestamps: true
});

teamSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model("Team", teamSchema);