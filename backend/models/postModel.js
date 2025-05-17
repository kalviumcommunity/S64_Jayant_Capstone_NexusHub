const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'document'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnail: String,
    name: String,
    size: Number
  }],
  tags: [String],
  visibility: {
    type: String,
    enum: ['public', 'connections', 'private'],
    default: 'public'
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project"
  },
  location: {
    type: String
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  sharedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
postSchema.index({ content: 'text', tags: 'text' });
postSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema); 