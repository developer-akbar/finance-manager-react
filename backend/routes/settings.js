const express = require('express');
const { body, validationResult } = require('express-validator');
const UserSettings = require('../models/UserSettings');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
router.get('/', async (req, res) => {
  try {
    let userSettings = await UserSettings.findOne({ user: req.user.id });

    if (!userSettings) {
      // Create default settings if none exist
      userSettings = await UserSettings.create({
        user: req.user.id,
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
        ]),
        csvConversionDetails: {
          dateFormat: "DD/MM/YYYY",
          currency: "INR",
          delimiter: ","
        }
      });
    }

    res.json({
      success: true,
      data: {
        accounts: userSettings.accounts,
        categories: Object.fromEntries(userSettings.categories),
        accountGroups: userSettings.accountGroups,
        accountMapping: Object.fromEntries(userSettings.accountMapping),
        csvConversionDetails: userSettings.csvConversionDetails
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching settings'
    });
  }
});

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
router.put('/', async (req, res) => {
  try {
    const { accounts, categories, accountGroups, accountMapping, csvConversionDetails } = req.body;

    let userSettings = await UserSettings.findOne({ user: req.user.id });

    if (!userSettings) {
      userSettings = new UserSettings({ user: req.user.id });
    }

    // Update fields if provided
    if (accounts) userSettings.accounts = accounts;
    if (categories) userSettings.categories = new Map(Object.entries(categories));
    if (accountGroups) userSettings.accountGroups = accountGroups;
    if (accountMapping) userSettings.accountMapping = new Map(Object.entries(accountMapping));
    if (csvConversionDetails) userSettings.csvConversionDetails = csvConversionDetails;

    await userSettings.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        accounts: userSettings.accounts,
        categories: Object.fromEntries(userSettings.categories),
        accountGroups: userSettings.accountGroups,
        accountMapping: Object.fromEntries(userSettings.accountMapping),
        csvConversionDetails: userSettings.csvConversionDetails
      }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating settings'
    });
  }
});

// @desc    Update accounts
// @route   PUT /api/settings/accounts
// @access  Private
router.put('/accounts', [
  body('accounts').isArray().withMessage('Accounts must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let userSettings = await UserSettings.findOne({ user: req.user.id });

    if (!userSettings) {
      userSettings = new UserSettings({ user: req.user.id });
    }

    userSettings.accounts = req.body.accounts;
    await userSettings.save();

    res.json({
      success: true,
      message: 'Accounts updated successfully',
      data: userSettings.accounts
    });
  } catch (error) {
    console.error('Update accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating accounts'
    });
  }
});

// @desc    Update categories
// @route   PUT /api/settings/categories
// @access  Private
router.put('/categories', [
  body('categories').isObject().withMessage('Categories must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let userSettings = await UserSettings.findOne({ user: req.user.id });

    if (!userSettings) {
      userSettings = new UserSettings({ user: req.user.id });
    }

    userSettings.categories = new Map(Object.entries(req.body.categories));
    await userSettings.save();

    res.json({
      success: true,
      message: 'Categories updated successfully',
      data: Object.fromEntries(userSettings.categories)
    });
  } catch (error) {
    console.error('Update categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating categories'
    });
  }
});

// @desc    Update account groups
// @route   PUT /api/settings/account-groups
// @access  Private
router.put('/account-groups', [
  body('accountGroups').isArray().withMessage('Account groups must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let userSettings = await UserSettings.findOne({ user: req.user.id });

    if (!userSettings) {
      userSettings = new UserSettings({ user: req.user.id });
    }

    userSettings.accountGroups = req.body.accountGroups;
    await userSettings.save();

    res.json({
      success: true,
      message: 'Account groups updated successfully',
      data: userSettings.accountGroups
    });
  } catch (error) {
    console.error('Update account groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating account groups'
    });
  }
});

// @desc    Update account mapping
// @route   PUT /api/settings/account-mapping
// @access  Private
router.put('/account-mapping', [
  body('accountMapping').isObject().withMessage('Account mapping must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let userSettings = await UserSettings.findOne({ user: req.user.id });

    if (!userSettings) {
      userSettings = new UserSettings({ user: req.user.id });
    }

    userSettings.accountMapping = new Map(Object.entries(req.body.accountMapping));
    await userSettings.save();

    res.json({
      success: true,
      message: 'Account mapping updated successfully',
      data: Object.fromEntries(userSettings.accountMapping)
    });
  } catch (error) {
    console.error('Update account mapping error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating account mapping'
    });
  }
});

module.exports = router; 