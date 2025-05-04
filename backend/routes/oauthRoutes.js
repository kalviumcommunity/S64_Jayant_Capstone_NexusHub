const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d"
  });
};

// Check if Google OAuth is configured
const isGoogleConfigured = () => {
  return passport._strategies && passport._strategies.google;
};

// Check if GitHub OAuth is configured
const isGithubConfigured = () => {
  return passport._strategies && passport._strategies.github;
};

// Google OAuth Routes
router.get('/google', (req, res, next) => {
  if (!isGoogleConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please set up Google OAuth credentials in the .env file.'
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!isGoogleConfigured()) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth-not-configured`);
  }
  
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login` })(req, res, next);
}, (req, res) => {
  // Generate JWT token
  const token = generateToken(req.user._id);
  
  // Redirect to frontend with token
  res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${token}&userId=${req.user._id}`);
});

// GitHub OAuth Routes
router.get('/github', (req, res, next) => {
  if (!isGithubConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'GitHub OAuth is not configured. Please set up GitHub OAuth credentials in the .env file.'
    });
  }
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
  if (!isGithubConfigured()) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth-not-configured`);
  }
  
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login` })(req, res, next);
}, (req, res) => {
  // Generate JWT token
  const token = generateToken(req.user._id);
  
  // Redirect to frontend with token
  res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${token}&userId=${req.user._id}`);
});

// Status endpoint to check if OAuth providers are configured
router.get('/status', (req, res) => {
  res.json({
    google: isGoogleConfigured(),
    github: isGithubConfigured()
  });
});

module.exports = router;