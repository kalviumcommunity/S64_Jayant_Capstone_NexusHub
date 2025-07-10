const express = require("express");
const router = express.Router();
const { 
  register,
  login,
  getProfile,
  updateProfile,
  deleteAccount,
  verifyEmail,
  forgotPassword,
  resetPassword,
  savePost,
  unsavePost,
  getSavedPosts
} = require("../controllers/userController");
const protect = require("../middleware/protectMiddleware");
const { upload, profileUpload } = require("../utils/fileUpload");
const userController = require("../controllers/userController");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/verify-email/:token", verifyEmail);

// Protected routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, profileUpload.single('profilePicture'), updateProfile);
router.delete("/account", protect, deleteAccount);
router.get("/search", protect, userController.searchUsers);
router.post("/friend-request", protect, userController.sendFriendRequest);
router.post("/friend-request/accept", protect, userController.acceptFriendRequest);
router.post("/friend-request/decline", protect, userController.declineFriendRequest);
router.get("/friend-requests", protect, userController.listFriendRequests);
router.post('/save/:postId', protect, savePost);
router.post('/unsave/:postId', protect, unsavePost);
router.get('/saved-posts', protect, getSavedPosts);

// Follow/Unfollow public profiles
router.post('/follow', protect, userController.followUser);
router.post('/unfollow', protect, userController.unfollowUser);

// Notifications
router.get('/notifications', protect, userController.getNotifications);

// Suggested users
router.get('/suggested', protect, userController.suggestedUsers);

// Public profile by username (should be last)
router.get('/:username', userController.getUserByUsername);

module.exports = router;
