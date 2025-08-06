const express = require('express');
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Helper function to convert various date formats to DD/MM/YYYY for database storage
const convertDateForStorage = (dateStr) => {
  if (!dateStr) return null;
  
  // If already in DD/MM/YYYY format, return as is
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  
  // If already in DD-MM-YYYY format, convert to DD/MM/YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  
  // If in YYYY-MM-DD format, convert to DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  
  // If in YYYY/MM/DD format, convert to DD/MM/YYYY
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('/');
    return `${day}/${month}/${year}`;
  }
  
  // Try to parse and convert other formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  return dateStr; // Return as is if can't parse
};

// @desc    Get all transactions for user
// @route   GET /api/transactions
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10000, sort = '-Date', filter } = req.query;
    
    let query = { user: req.user.id };
    
    // Apply filters
    if (filter) {
      const filterObj = JSON.parse(filter);
      if (filterObj.dateRange && filterObj.dateRange !== 'all') {
        // Add date filtering logic here
      }
      if (filterObj.account && filterObj.account !== 'all') {
        query.Account = filterObj.account;
      }
      if (filterObj.category && filterObj.category !== 'all') {
        query.Category = filterObj.category;
      }
      if (filterObj.type && filterObj.type !== 'all') {
        query['Income/Expense'] = filterObj.type;
      }
    }

    const transactions = await Transaction.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
});

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      ID: req.params.id,
      user: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction'
    });
  }
});

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
router.post('/', [
  body('Date').notEmpty().withMessage('Date is required'),
  body('INR').isNumeric().withMessage('Amount must be a number'),
  body('Income/Expense').isIn(['Income', 'Expense', 'Transfer-Out']).withMessage('Type must be Income, Expense, or Transfer-Out'),
  body('Amount').notEmpty().withMessage('Amount string is required'),
  body('ID').notEmpty().withMessage('Transaction ID is required')
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

    // Check if transaction ID already exists for this user
    const existingTransaction = await Transaction.findOne({
      ID: req.body.ID,
      user: req.user.id
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Transaction with this ID already exists'
      });
    }

    const transaction = await Transaction.create({
      ...req.body,
      Date: convertDateForStorage(req.body.Date),
      user: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating transaction'
    });
  }
});

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
router.put('/:id', [
  body('Date').notEmpty().withMessage('Date is required'),
  body('INR').isNumeric().withMessage('Amount must be a number'),
  body('Income/Expense').isIn(['Income', 'Expense', 'Transfer-Out']).withMessage('Type must be Income, Expense, or Transfer-Out'),
  body('Amount').notEmpty().withMessage('Amount string is required')
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

    let transaction = await Transaction.findOne({
      ID: req.params.id,
      user: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    transaction = await Transaction.findOneAndUpdate(
      { ID: req.params.id, user: req.user.id },
      { ...req.body, Date: convertDateForStorage(req.body.Date) },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating transaction'
    });
  }
});

// @desc    Clear all transactions for user
// @route   DELETE /api/transactions/clear
// @access  Private
router.delete('/clear', async (req, res) => {
  try {
    const result = await Transaction.deleteMany({ user: req.user.id });

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} transactions`
    });
  } catch (error) {
    console.error('Clear transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing transactions'
    });
  }
});

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      ID: req.params.id,
      user: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await Transaction.findOneAndDelete({
      ID: req.params.id,
      user: req.user.id
    });

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting transaction'
    });
  }
});

// @desc    Bulk import transactions
// @route   POST /api/transactions/bulk
// @access  Private
router.post('/bulk', async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Transactions array is required'
      });
    }

    // Add user ID to each transaction
    const transactionsWithUser = transactions.map(transaction => ({
      ...transaction,
      user: req.user.id
    }));

    // Insert all transactions
    const result = await Transaction.insertMany(transactionsWithUser);

    res.status(201).json({
      success: true,
      message: `${result.length} transactions imported successfully`,
      data: result
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while importing transactions'
    });
  }
});

module.exports = router; 