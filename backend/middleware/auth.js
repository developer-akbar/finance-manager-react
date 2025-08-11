const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only';
      const decoded = jwt.verify(token, jwtSecret);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Generate JWT Token
const generateToken = (id) => {
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only';
  const jwtExpire = process.env.JWT_EXPIRE || '7d';
  
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️ JWT_SECRET not found in environment variables, using fallback');
  }
  
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: jwtExpire
  });
};

module.exports = { protect, generateToken }; 