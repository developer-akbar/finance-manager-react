const express = require('express');
const { body, validationResult } = require('express-validator');
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

    const { username, email, password } = req.body;

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

module.exports = router; 