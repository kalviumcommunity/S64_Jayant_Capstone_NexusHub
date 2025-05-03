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

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/verify-email/:token", verifyEmail);

// Protected routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.delete("/account", protect, deleteAccount);

module.exports = router;
