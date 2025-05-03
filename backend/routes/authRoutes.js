const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const protect  = require('../middleware/authMiddleware');

// Auth routes
router.post('/register', protect, register);
router.post('/login', protect, login);
router.get('/verify-email/:token', protect, verifyEmail);
router.post('/forgot-password', protect, forgotPassword);
router.post('/reset-password/:token', protect, resetPassword);

module.exports = router; 