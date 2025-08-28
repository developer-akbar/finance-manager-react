const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const { generateToken, protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.username === username 
          ? 'Username already exists' 
          : 'Email already exists'
      });
    }

    // Create user
    const user = await User.create({
      name: name || '',
      username,
      email,
      password
    });

    // Create default user settings with accounts, categories, and subcategories
    const defaultSettings = {
      user: user._id,
      accounts: [
        'Cash',
        'Bank Account',
        'Credit Card',
        'Savings Account',
        'Investment Account',
        'Digital Wallet'
      ],
             categories: new Map([
         ['Housing', {
           type: 'Expense',
           subcategories: ['Rent', 'Groceries', 'Electricity', 'Gas']
         }],
         ['Travel', {
           type: 'Expense',
           subcategories: []
         }],
         ['Utilities', {
           type: 'Expense',
           subcategories: ['Recharge', 'DTH', 'Water']
         }],
         ['Shopping', {
           type: 'Expense',
           subcategories: []
         }],
         ['Health', {
           type: 'Expense',
           subcategories: ['Medicines', 'Hospital']
         }],
         ['Subscriptions', {
           type: 'Expense',
           subcategories: ['Netflix', 'Prime']
         }],
         ['Entertainment', {
           type: 'Expense',
           subcategories: ['Cinema', 'Outing']
         }],
         ['Groceries', {
           type: 'Expense',
           subcategories: []
         }],
         ['Dining', {
           type: 'Expense',
           subcategories: []
         }],
         ['Salary', {
           type: 'Income',
           subcategories: []
         }],
         ['Bonus', {
           type: 'Income',
           subcategories: []
         }],
         ['Petty Cash', {
           type: 'Income',
           subcategories: []
         }]
       ]),
      accountGroups: [
        { id: 1, name: 'Cash & Bank' },
        { id: 2, name: 'Credit Cards' },
        { id: 3, name: 'Investments' }
      ],
      accountMapping: new Map([
        ['Cash', ['Cash']],
        ['Bank Account', ['Bank Account']],
        ['Savings Account', ['Savings Account']],
        ['Credit Card', ['Credit Card']],
        ['Investment Account', ['Investment Account']],
        ['Digital Wallet', ['Digital Wallet']]
      ])
    };

    await UserSettings.create(defaultSettings);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        name: user.name,
        id: user._id,
        username: user.username,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username },
        { email: username }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      data: {
        name: user.name,
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Change password (authenticated)
// @route   POST /api/auth/change-password
// @access  Private
router.post('/change-password', [
  protect,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error during password change' });
  }
});

// @desc    Update profile (name, email)
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', [
  protect,
  body('name').optional().isLength({ min: 1 }).withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const updates = {};
    if (typeof req.body.name === 'string') updates.name = req.body.name;
    if (typeof req.body.email === 'string') updates.email = req.body.email;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error during profile update' });
  }
});

module.exports = router; 