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
  resetPassword
} = require("../controllers/userController");
const protect = require("../middleware/protectMiddleware");
const { upload } = require("../utils/fileUpload");
const userController = require("../controllers/userController");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/verify-email/:token", verifyEmail);

// Protected routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, upload.single('profilePicture'), updateProfile);
router.delete("/account", protect, deleteAccount);
router.get("/search", protect, userController.searchUsers);
router.post("/friend-request", protect, userController.sendFriendRequest);
router.post("/friend-request/accept", protect, userController.acceptFriendRequest);
router.post("/friend-request/decline", protect, userController.declineFriendRequest);
router.get("/friend-requests", protect, userController.listFriendRequests);

module.exports = router;
