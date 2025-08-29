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
  Time: {
    type: String,
    default: ''
  },
  Account: {
    type: String,
    required: function() {
      return this['Income/Expense'] !== 'Transfer' && this['Income/Expense'] !== 'Transfer-Out';
    }
  },
  FromAccount: {
    type: String,
    required: function() {
      return this['Income/Expense'] === 'Transfer' || this['Income/Expense'] === 'Transfer-Out';
    }
  },
  ToAccount: {
    type: String,
    required: function() {
      return this['Income/Expense'] === 'Transfer' || this['Income/Expense'] === 'Transfer-Out';
    }
  },
  Category: {
    type: String,
    required: function() {
      return this['Income/Expense'] !== 'Transfer' && this['Income/Expense'] !== 'Transfer-Out';
    }
  },
  Subcategory: {
    type: String,
    default: ''
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
    enum: ['Income', 'Expense', 'Transfer', 'Transfer-Out'],
    required: [true, 'Transaction type is required']
  },
  Description: {
    type: String,
    default: ''
  },
  Amount: {
    type: Number,
    required: [true, 'Amount is required']
  },
  Currency: {
    type: String,
    default: 'INR'
  },
  ID: {
    type: String,
    default: function() {
      return this.user + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    }
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
transactionSchema.index({ user: 1, Date: -1 });
transactionSchema.index({ user: 1, Category: 1 });
transactionSchema.index({ user: 1, Account: 1 });
transactionSchema.index({ user: 1, 'Income/Expense': 1 });
transactionSchema.index({ user: 1, ID: 1 }, { unique: true }); // Ensure ID uniqueness per user

module.exports = mongoose.model('Transaction', transactionSchema); 