// backend/controllers/userController.js
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const path = require("path");
const fs = require("fs");
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d"
  });
};

// Register User
const register = async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists"
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      username,
      email,
      password,
      name,
      verificationToken
    });

    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      await sendEmail({
        email: user.email,
        subject: "Verify your NexusHub account",
        html: `Please click this link to verify your email: <a href="${verificationUrl}">${verificationUrl}</a>`
      });
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      // Continue with registration even if email fails
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in user registration",
      error: error.message
    });
  }
};

// Login User
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    user.lastActive = Date.now();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in login",
      error: error.message
    });
  }
};

// Get User Profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message
    });
  }
};

// Update User Profile
const updateProfile = async (req, res) => {
  try {
    const {
      username,
      email,
      currentPassword,
      newPassword,
      name,
      bio,
      location,
      website,
      socialLinks,
      skills
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (newPassword && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect"
        });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // Handle profile picture if it's in the request
    if (req.file) {
      // If user already has a profile picture that's not the default and is a Cloudinary URL, optionally delete it from Cloudinary (not required for now)
      // Upload new profile picture to Cloudinary
      const uploadToCloudinary = (buffer, folder) => {
        return new Promise((resolve, reject) => {
          let cld_upload_stream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(buffer).pipe(cld_upload_stream);
        });
      };
      const result = await uploadToCloudinary(req.file.buffer, 'profile-images');
      user.profilePicture = result.secure_url;
    }

    // Update user fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (location) user.location = location;
    if (website) user.website = website;
    if (socialLinks) user.socialLinks = socialLinks;
    
    // Update skills if provided
    if (skills) {
      try {
        // If skills is a JSON string (from FormData), parse it
        if (typeof skills === 'string' && skills.startsWith('[')) {
          user.skills = JSON.parse(skills);
        } 
        // If skills is a comma-separated string
        else if (typeof skills === 'string') {
          // Split by comma, trim each skill to remove leading/trailing whitespace
          // This preserves spaces within each skill name
          user.skills = skills.split(',')
            .map(skill => skill.trim())
            .filter(skill => skill !== ''); // Remove empty skills
        } 
        // If skills is already an array
        else if (Array.isArray(skills)) {
          // Make sure to trim each skill and filter out empty ones
          user.skills = skills
            .map(skill => typeof skill === 'string' ? skill.trim() : skill)
            .filter(skill => skill !== '');
        }
      } catch (error) {
        console.error('Error parsing skills:', error);
        // If parsing fails, try to use it as a comma-separated string
        if (typeof skills === 'string') {
          user.skills = skills.split(',')
            .map(skill => skill.trim())
            .filter(skill => skill !== '');
        }
      }
    }

    const updatedUser = await user.save();
    
    // Prepare user object for response
    const userResponse = {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      name: updatedUser.name,
      bio: updatedUser.bio,
      location: updatedUser.location,
      website: updatedUser.website,
      profilePicture: updatedUser.profilePicture,
      socialLinks: updatedUser.socialLinks,
      skills: updatedUser.skills
    };

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message
    });
  }
};

// Delete User Account
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Password is incorrect"
      });
    }

    await User.findByIdAndDelete(req.user.id);
    res.json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting account",
      error: error.message
    });
  }
};

// Verify Email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token"
      });
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in email verification",
      error: error.message
    });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      html: `Please click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a>`
    });

    res.json({
      success: true,
      message: "Password reset email sent"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in forgot password",
      error: error.message
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in password reset",
      error: error.message
    });
  }
};

// --- User Search ---
const searchUsers = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }
    const regex = new RegExp(query, 'i');
    const skip = (parseInt(page) - 1) * parseInt(limit);
    // Find users who are public, or are friends with the requester
    const requester = await User.findById(req.user.id);
    const friendIds = requester.friends.map(id => id.toString());
    const users = await User.find({
      $and: [
        {
          $or: [
            { username: regex },
            { name: regex },
            { bio: regex },
            { skills: regex }
          ]
        },
        {
          $or: [
            { isPrivate: false },
            { _id: { $in: friendIds } },
            { _id: req.user.id }
          ]
        }
      ]
    })
      .select('-password -verificationToken -resetPasswordToken -resetPasswordExpires')
      .skip(skip)
      .limit(parseInt(limit));
    const total = await User.countDocuments({
      $and: [
        {
          $or: [
            { username: regex },
            { name: regex },
            { bio: regex },
            { skills: regex }
          ]
        },
        {
          $or: [
            { isPrivate: false },
            { _id: { $in: friendIds } },
            { _id: req.user.id }
          ]
        }
      ]
    });
    res.json({
      success: true,
      users,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error searching users', error: error.message });
  }
};

// --- Friend Request Logic ---
const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }
    const user = await User.findById(userId);
    const requester = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.friends.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Already friends' });
    }
    if (user.friendRequests.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Request already sent' });
    }
    user.friendRequests.push(req.user.id);
    await user.save();
    res.json({ success: true, message: 'Friend request sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending friend request', error: error.message });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }
    const user = await User.findById(req.user.id);
    const requester = await User.findById(userId);
    if (!user || !requester) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.friendRequests.includes(userId)) {
      return res.status(400).json({ success: false, message: 'No such friend request' });
    }
    // Add each other as friends
    user.friends.push(userId);
    requester.friends.push(req.user.id);
    // Remove request
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== userId);
    await user.save();
    await requester.save();
    res.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error accepting friend request', error: error.message });
  }
};

const declineFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.friendRequests.includes(userId)) {
      return res.status(400).json({ success: false, message: 'No such friend request' });
    }
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== userId);
    await user.save();
    res.json({ success: true, message: 'Friend request declined' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error declining friend request', error: error.message });
  }
};

const listFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('friendRequests', 'username name profilePicture');
    res.json({ success: true, friendRequests: user.friendRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing friend requests', error: error.message });
  }
};

// --- Get User by Username (Public Profile) ---
const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Count teams and posts
    const Team = require('../models/teamModel');
    const Post = require('../models/postModel');
    const [teamCount, postCount] = await Promise.all([
      Team.countDocuments({ 'members.user': user._id }),
      Post.countDocuments({ author: user._id })
    ]);

    // Check if requester is a friend
    let isFriend = false;
    let isSelf = false;
    if (req.user) {
      isSelf = user._id.toString() === req.user.id;
      isFriend = user.friends.map(id => id.toString()).includes(req.user.id);
    }

    // If private and not friend/self, return limited info
    if (user.isPrivate && !isFriend && !isSelf) {
      return res.json({
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          name: user.name,
          profilePicture: user.profilePicture,
          bio: user.bio,
          skills: user.skills,
          isPrivate: true,
          teamCount,
          friendCount: user.friends.length,
          postCount
        },
        limited: true
      });
    }

    // Public or friend/self: return full info
    return res.json({
      success: true,
      user: {
        ...user.toObject(),
        isPrivate: !!user.isPrivate,
        teamCount,
        friendCount: user.friends.length,
        postCount
      },
      limited: false
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user profile', error: error.message });
  }
};

// Save Post
const savePost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const postId = req.params.postId;
    if (!user.savedPosts.includes(postId)) {
      user.savedPosts.push(postId);
      await user.save();
    }
    res.json({ success: true, savedPosts: user.savedPosts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving post', error: error.message });
  }
};

// Unsave Post
const unsavePost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const postId = req.params.postId;
    user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
    await user.save();
    res.json({ success: true, savedPosts: user.savedPosts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error unsaving post', error: error.message });
  }
};

// Get Saved Posts
const getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedPosts',
      populate: [
        { path: 'author', select: 'name profilePicture' },
        { path: 'comments.user', select: 'name profilePicture' },
        { path: 'likes.user', select: 'name profilePicture' },
        { path: 'project', select: 'title' }
      ]
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, savedPosts: user.savedPosts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching saved posts', error: error.message });
  }
};

// ✅ Export all controllers
module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  deleteAccount,
  verifyEmail,
  forgotPassword,
  resetPassword,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  listFriendRequests,
  getUserByUsername,
  savePost,
  unsavePost,
  getSavedPosts,
};
