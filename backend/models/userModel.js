const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxLength: 500
  },
  location: String,
  website: String,
  profilePicture: {
    type: String,
    default: 'https://res.cloudinary.com/dyzfbhol5/image/upload/v1781064676/default-avatar_bbvlmt.avif'
  },
  skills: {
    type: [String],
    default: []
  },
  socialLinks: {
    twitter: String,
    linkedin: String,
    github: String,
    instagram: String
  },
  // OAuth fields
  googleId: String,
  githubId: String,
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastActive: {
    type: Date,
    default: Date.now
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  friendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: []
  }],
  notifications: [{
    type: {
      type: String, // 'story_like', 'story_comment', 'post_like', 'post_comment', 'friend_request'
      required: true
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      required: false // story or post id
    },
    message: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }]
}, { 
  timestamps: true 
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.verificationToken;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  return userObject;
};

module.exports = mongoose.model("User", userSchema);
