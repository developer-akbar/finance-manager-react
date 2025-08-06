const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  Date: {
    type: String,
    required: [true, 'Date is required']
  },
  Account: {
    type: String,
    required: function() {
      return this['Income/Expense'] !== 'Transfer';
    }
  },
  FromAccount: {
    type: String,
    required: function() {
      return this['Income/Expense'] === 'Transfer';
    }
  },
  ToAccount: {
    type: String,
    required: function() {
      return this['Income/Expense'] === 'Transfer';
    }
  },
  Category: {
    type: String,
    required: function() {
      return this['Income/Expense'] !== 'Transfer';
    }
  },
  Subcategory: {
    type: String,
    required: function() {
      return this['Income/Expense'] !== 'Transfer';
    }
  },
  Note: {
    type: String,
    default: ''
  },
  INR: {
    type: Number,
    required: [true, 'Amount is required']
  },
  'Income/Expense': {
    type: String,
    enum: ['Income', 'Expense', 'Transfer'],
    required: [true, 'Transaction type is required']
  },
  Description: {
    type: String,
    default: ''
  },
  Amount: {
    type: String,
    required: [true, 'Amount string is required']
  },
  Currency: {
    type: String,
    default: 'INR'
  },
  ID: {
    type: String,
    required: [true, 'Transaction ID is required'],
    unique: true
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
transactionSchema.index({ user: 1, Date: -1 });
transactionSchema.index({ user: 1, Category: 1 });
transactionSchema.index({ user: 1, Account: 1 });
transactionSchema.index({ user: 1, 'Income/Expense': 1 });

module.exports = mongoose.model('Transaction', transactionSchema); 