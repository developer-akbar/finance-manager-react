const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  accounts: {
    type: [String],
    default: []
  },
  categories: {
    type: Map,
    of: {
      type: {
        type: String,
        enum: ['Income', 'Expense'],
        required: true
      },
      subcategories: [String]
    },
    default: new Map()
  },
  accountGroups: {
    type: [{
      id: Number,
      name: String
    }],
    default: []
  },
  accountMapping: {
    type: Map,
    of: [String],
    default: new Map()
  },
  csvConversionDetails: {
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    },
    currency: {
      type: String,
      default: 'INR'
    },
    delimiter: {
      type: String,
      default: ','
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
userSettingsSchema.index({ user: 1 });

module.exports = mongoose.model('UserSettings', userSettingsSchema); 