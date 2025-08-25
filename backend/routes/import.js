const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const Transaction = require('../models/Transaction');
const UserSettings = require('../models/UserSettings');
const { protect } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/json' // .json
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel, CSV, and JSON files are allowed.'), false);
    }
  }
});

// Import data from file
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { mode = 'override' } = req.body; // 'override' or 'merge'
    const userId = req.user.id;

    let transactions = [];
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

    // Parse file based on type
    if (fileExtension === 'json') {
      transactions = JSON.parse(req.file.buffer.toString());
    } else if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      transactions = await parseExcelFile(req.file.buffer, fileExtension);
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported file type' });
    }

    // Validate and transform transactions
    const transformedTransactions = await transformTransactions(transactions, userId);

    // Handle import mode
    if (mode === 'override') {
      // Delete existing transactions and import new ones
      await Transaction.deleteMany({ user: userId });
      if (transformedTransactions.length > 0) {
        await Transaction.insertMany(transformedTransactions);
      }
    } else if (mode === 'merge') {
      // Find and handle duplicates
      const existingTransactions = await Transaction.find({ user: userId });
      const { newTransactions, duplicates } = findDuplicates(existingTransactions, transformedTransactions);
      
      if (newTransactions.length > 0) {
        await Transaction.insertMany(newTransactions);
      }

      // Update accounts and categories
      await updateAccountsAndCategories(transformedTransactions, userId, mode);
      
      return res.json({
        success: true,
        message: `Import completed successfully. ${newTransactions.length} new transactions imported.`,
        stats: {
          total: transformedTransactions.length,
          new: newTransactions.length,
          duplicates: duplicates.length
        }
      });
    }

    // Update accounts and categories
    await updateAccountsAndCategories(transformedTransactions, userId, mode);

    res.json({
      success: true,
      message: `Import completed successfully. ${transformedTransactions.length} transactions imported.`,
      stats: {
        total: transformedTransactions.length
      }
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing import: ' + error.message 
    });
  }
});

// Parse Excel/CSV file
async function parseExcelFile(buffer, fileExtension) {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      raw: false
    });

    if (jsonData.length < 2) {
      throw new Error('File must contain at least a header row and one data row');
    }

    // Extract headers and data
    const headers = jsonData[0];
    const dataRows = jsonData.slice(1);

    // Map data to objects
    const transactions = dataRows.map(row => {
      const transaction = {};
      headers.forEach((header, index) => {
        if (header && row[index] !== undefined) {
          transaction[header.trim()] = row[index];
        }
      });
      return transaction;
    });

    return transactions.filter(t => Object.keys(t).length > 0);

  } catch (error) {
    throw new Error(`Error parsing file: ${error.message}`);
  }
}

// Transform transactions to match database model
async function transformTransactions(transactions, userId) {
  const transformed = [];
  
  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    
    try {
      // Parse and validate date
      const parsedDate = parseDate(transaction.Date);
      if (!parsedDate) {
        console.warn(`Skipping transaction ${i + 1}: Invalid date format - ${transaction.Date}`);
        continue;
      }

      // Handle Transfer type mapping
      let account, fromAccount, toAccount, category, subcategory;
      
      if (transaction['Income/Expense'] === 'Transfer' || transaction['Income/Expense'] === 'Transfer-Out') {
        // For transfers: Account = FromAccount, Category = ToAccount
        fromAccount = transaction.Account || '';
        toAccount = transaction.Category || '';
        account = fromAccount; // For display purposes
        category = transaction.Category;
        subcategory = '';
      } else {
        // For Income/Expense: normal mapping
        account = transaction.Account || '';
        fromAccount = '';
        toAccount = '';
        category = transaction.Category || '';
        subcategory = transaction.Subcategory || '';
      }

      // Generate unique ID if not present
      const transactionId = transaction.ID || generateTransactionId(userId, i);

      const transformedTransaction = {
        user: userId,
        Date: parsedDate,
        Account: account,
        FromAccount: fromAccount,
        ToAccount: toAccount,
        Category: category,
        Subcategory: subcategory,
        Note: transaction.Note || '',
        INR: parseFloat(transaction.INR) || 0,
        'Income/Expense': transaction['Income/Expense'] || 'Expense',
        Description: transaction.Description || '',
        Amount: transaction.Amount || transaction.INR || '0',
        Currency: transaction.Currency || 'INR',
        ID: transactionId
      };

      // Validate required fields
      if (!transformedTransaction['Income/Expense']) {
        console.warn(`Skipping transaction ${i + 1}: Missing transaction type`);
        continue;
      }

      if (transformedTransaction['Income/Expense'] === 'Transfer' || transformedTransaction['Income/Expense'] === 'Transfer-Out') {
        if (!transformedTransaction.FromAccount || !transformedTransaction.ToAccount) {
          console.warn(`Skipping transaction ${i + 1}: Transfer missing FromAccount or ToAccount`);
          continue;
        }
      } else {
        if (!transformedTransaction.Account || !transformedTransaction.Category) {
          console.warn(`Skipping transaction ${i + 1}: Missing Account or Category`);
          continue;
        }
      }

      transformed.push(transformedTransaction);

    } catch (error) {
      console.warn(`Skipping transaction ${i + 1}: ${error.message}`);
    }
  }

  return transformed;
}

// Parse date with multiple format support
function parseDate(dateString) {
  if (!dateString) return null;

  try {
    // Handle DD-MM-YYYY HH:MM:SS AM/PM format
    if (typeof dateString === 'string') {
      // Remove extra spaces and normalize
      dateString = dateString.trim();
      
      // Handle DD-MM-YYYY HH:MM:SS AM/PM format
      const dateTimeRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i;
      const match = dateString.match(dateTimeRegex);
      
      if (match) {
        const [, day, month, year, hour, minute, second, ampm] = match;
        let hour24 = parseInt(hour);
        
        // Convert 12-hour to 24-hour format
        if (ampm.toUpperCase() === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (ampm.toUpperCase() === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        
        // IMPORTANT: Use day, month, year in correct order (DD-MM-YYYY)
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minute), parseInt(second));
        return formatDateForDB(date);
      }
      
      // Handle DD-MM-YYYY format
      const dateRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
      const dateMatch = dateString.match(dateRegex);
      
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        // IMPORTANT: Use day, month, year in correct order (DD-MM-YYYY)
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return formatDateForDB(date);
      }
      
      // Handle DD/MM/YYYY format (already correct)
      const slashDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const slashDateMatch = dateString.match(slashDateRegex);
      
      if (slashDateMatch) {
        const [, day, month, year] = slashDateMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return formatDateForDB(date);
      }
      
      // Handle MM/DD/YYYY format (American format - convert to DD/MM/YYYY)
      const americanDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const americanDateMatch = dateString.match(americanDateRegex);
      
      if (americanDateMatch) {
        const [, month, day, year] = americanDateMatch;
        // Check if this looks like American format (month > 12 would be invalid for DD-MM)
        if (parseInt(month) > 12 && parseInt(day) <= 12) {
          // This is likely MM/DD/YYYY, convert to DD/MM/YYYY
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return formatDateForDB(date);
        }
      }
      
      // Handle other common formats
      const parsedDate = new Date(dateString);
      if (!isNaN(parsedDate.getTime())) {
        return formatDateForDB(parsedDate);
      }
    }
    
    // If it's already a Date object
    if (dateString instanceof Date) {
      return formatDateForDB(dateString);
    }
    
    return null;
  } catch (error) {
    console.error('Date parsing error:', error);
    return null;
  }
}

// Format date for database storage (DD/MM/YYYY format)
function formatDateForDB(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Generate unique transaction ID
function generateTransactionId(userId, index) {
  const timestamp = Date.now();
  return `${userId}_${timestamp}_${index}`;
}

// Find duplicates between existing and new transactions
function findDuplicates(existingTransactions, newTransactions) {
  const duplicates = [];
  const newTransactionsFiltered = [];

  newTransactions.forEach(newTransaction => {
    const isDuplicate = existingTransactions.some(existingTransaction =>
      isDuplicateTransaction(existingTransaction, newTransaction)
    );

    if (isDuplicate) {
      duplicates.push(newTransaction);
    } else {
      newTransactionsFiltered.push(newTransaction);
    }
  });

  return {
    newTransactions: newTransactionsFiltered,
    duplicates
  };
}

// Check if two transactions are duplicates
function isDuplicateTransaction(txn1, txn2) {
  return txn1.Date === txn2.Date &&
         txn1.Account === txn2.Account &&
         txn1.Category === txn2.Category &&
         txn1.Subcategory === txn2.Subcategory &&
         txn1.Note === txn2.Note &&
         txn1.INR === txn2.INR &&
         txn1['Income/Expense'] === txn2['Income/Expense'];
}

// Update accounts and categories in user settings
async function updateAccountsAndCategories(transactions, userId, mode) {
  try {
    // Extract unique accounts
    const newAccounts = new Set();
    transactions.forEach(transaction => {
      if (transaction.Account) newAccounts.add(transaction.Account);
      if (transaction.FromAccount) newAccounts.add(transaction.FromAccount);
      if (transaction.ToAccount) newAccounts.add(transaction.ToAccount);
    });

    // Extract unique categories
    const newCategories = new Map();
    transactions.forEach(transaction => {
      if (transaction['Income/Expense'] !== 'Transfer' && transaction['Income/Expense'] !== 'Transfer-Out') {
        if (transaction.Category) {
          if (!newCategories.has(transaction.Category)) {
            newCategories.set(transaction.Category, {
              type: transaction['Income/Expense'],
              subcategories: new Set()
            });
          }
          if (transaction.Subcategory) {
            newCategories.get(transaction.Category).subcategories.add(transaction.Subcategory);
          }
        }
      }
    });

    // Get current user settings
    let userSettings = await UserSettings.findOne({ user: userId });
    if (!userSettings) {
      userSettings = new UserSettings({ user: userId });
    }

    // Update accounts
    if (mode === 'override') {
      userSettings.accounts = Array.from(newAccounts);
    } else {
      // Merge mode
      const existingAccounts = userSettings.accounts || [];
      userSettings.accounts = [...new Set([...existingAccounts, ...Array.from(newAccounts)])];
    }

    // Update categories
    if (mode === 'override') {
      const categoriesMap = new Map();
      newCategories.forEach((value, key) => {
        categoriesMap.set(key, {
          type: value.type,
          subcategories: Array.from(value.subcategories)
        });
      });
      userSettings.categories = Object.fromEntries(categoriesMap);
    } else {
      // Merge mode
      const existingCategories = userSettings.categories || {};
      newCategories.forEach((value, key) => {
        if (existingCategories[key]) {
          const existingSubcategories = existingCategories[key].subcategories || [];
          const newSubcategories = Array.from(value.subcategories);
          existingCategories[key].subcategories = [...new Set([...existingSubcategories, ...newSubcategories])];
        } else {
          existingCategories[key] = {
            type: value.type,
            subcategories: Array.from(value.subcategories)
          };
        }
      });
      userSettings.categories = existingCategories;
    }

    await userSettings.save();

  } catch (error) {
    console.error('Error updating accounts and categories:', error);
    throw error;
  }
}

// Get import status and statistics
router.get('/status', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const totalTransactions = await Transaction.countDocuments({ user: userId });
    
    res.json({
      success: true,
      stats: {
        totalTransactions
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error getting import status: ' + error.message 
    });
  }
});

module.exports = router; 