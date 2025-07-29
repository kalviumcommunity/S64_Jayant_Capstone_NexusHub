const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
  console.log("🚨 protect middleware called 🚨");  // Debugging log

  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    if (req.path === '/suggested') {
      return res.status(200).json({ debug: 'from protectMiddleware' });
    }
    next();
  } catch (error) {
    console.error('ProtectMiddleware error:', error);
    if (typeof error === 'object' && error.stack) {
      console.error('ProtectMiddleware stack:', error.stack);
    }
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed',
      error: error.message,
      stack: error.stack
    });
  }
};

module.exports = protect;
