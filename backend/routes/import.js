const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept Excel and CSV files
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'text/csv' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls') ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'), false);
    }
  }
});

// @desc    Import transactions from Excel/CSV file
// @route   POST /api/import/excel
// @access  Private
router.post('/excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file'
      });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (rawData.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Excel file must contain at least a header row and one data row'
      });
    }

    // Extract headers (first row)
    const headers = rawData[0];
    
    // Find required column indices based on expected format
    // Expected columns: Date, Account, Category, Subcategory, Note, INR, Income/Expense, Description, Currency, ID
    const dateIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('date')
    );
    const accountIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('account')
    );
    const categoryIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('category')
    );
    const subcategoryIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('subcategory')
    );
    const noteIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('note')
    );
    const inrIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('inr')
    );
    const typeIndex = headers.findIndex(h => 
      h && (h.toString().toLowerCase().includes('income/expense') || 
           h.toString().toLowerCase().includes('type'))
    );
    const descriptionIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('description')
    );
    const currencyIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('currency')
    );
    const idIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('id')
    );

    if (dateIndex === -1 || inrIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Excel file must contain Date and INR columns'
      });
    }

    // Process data rows
    const transactions = [];
    const errors = [];
    
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      
      try {
        // Skip empty rows
        if (!row[dateIndex] || !row[inrIndex]) {
          continue;
        }

        // Parse date
        let date;
        if (row[dateIndex] instanceof Date) {
          date = row[dateIndex].toLocaleDateString();
        } else {
          // Try to parse date string
          const dateStr = row[dateIndex].toString();
          const parsedDate = new Date(dateStr);
          if (isNaN(parsedDate.getTime())) {
            errors.push(`Row ${i + 1}: Invalid date format - ${dateStr}`);
            continue;
          }
          date = parsedDate.toLocaleDateString();
        }

        // Parse INR amount
        let amount;
        if (typeof row[inrIndex] === 'number') {
          amount = row[inrIndex];
        } else {
          const amountStr = row[inrIndex].toString().replace(/[^\d.-]/g, '');
          amount = parseFloat(amountStr);
          if (isNaN(amount)) {
            errors.push(`Row ${i + 1}: Invalid INR amount - ${row[inrIndex]}`);
            continue;
          }
        }

        // Determine transaction type
        let transactionType = 'Expense'; // Default
        if (typeIndex !== -1 && row[typeIndex]) {
          const typeStr = row[typeIndex].toString().toLowerCase();
          if (typeStr.includes('income')) {
            transactionType = 'Income';
          } else if (typeStr.includes('expense')) {
            transactionType = 'Expense';
          } else if (typeStr.includes('transfer')) {
            transactionType = 'Transfer-Out';
          }
        } else {
          // Fallback: determine by amount sign
          transactionType = amount >= 0 ? 'Income' : 'Expense';
        }

        const absAmount = Math.abs(amount);

        // Create transaction object based on type
        let transaction = {
          Date: date,
          Note: row[noteIndex] || '',
          INR: absAmount,
          'Income/Expense': transactionType,
          Description: row[descriptionIndex] || 'Imported transaction',
          Amount: absAmount.toString(),
          Currency: row[currencyIndex] || 'INR',
          ID: row[idIndex] || `import_${Date.now()}_${i}`,
          user: req.user.id
        };

        // Handle different transaction types
        if (transactionType === 'Transfer-Out') {
          // For Transfer-Out: Account = FromAccount, Category = ToAccount
          transaction.FromAccount = row[accountIndex] || 'Cash';
          transaction.ToAccount = row[categoryIndex] || 'Other';
          transaction.Account = row[accountIndex] || 'Cash'; // For display purposes
        } else {
          // For Income/Expense: regular fields
          transaction.Account = row[accountIndex] || 'Cash';
          transaction.Category = row[categoryIndex] || 'Other';
          transaction.Subcategory = row[subcategoryIndex] || 'Imported';
        }

        transactions.push(transaction);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    if (transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid transactions found in the Excel file',
        errors
      });
    }

    // Insert transactions into database
    const result = await Transaction.insertMany(transactions);

    res.json({
      success: true,
      message: `Successfully imported ${result.length} transactions`,
      data: {
        imported: result.length,
        errors: errors.length > 0 ? errors : null
      }
    });

  } catch (error) {
    console.error('Excel import error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while importing Excel file'
    });
  }
});

// @desc    Import transactions from JSON data
// @route   POST /api/import/json
// @access  Private
router.post('/json', async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Transactions array is required'
      });
    }

    // Process and validate transactions
    const processedTransactions = [];
    const errors = [];

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      
      try {
        // Validate required fields
        if (!transaction.Date || !transaction.Amount) {
          errors.push(`Transaction ${i + 1}: Missing required fields (Date, Amount)`);
          continue;
        }

        // Ensure transaction has required structure
        const processedTransaction = {
          Date: transaction.Date,
          Account: transaction.Account || 'Cash',
          Category: transaction.Category || 'Other',
          Subcategory: transaction.Subcategory || 'Imported',
          Note: transaction.Note || '',
          INR: parseFloat(transaction.Amount) || parseFloat(transaction.INR) || 0,
          'Income/Expense': transaction['Income/Expense'] || 
                          (parseFloat(transaction.Amount) >= 0 ? 'Income' : 'Expense'),
          Description: transaction.Description || 'Imported transaction',
          Amount: (parseFloat(transaction.Amount) || parseFloat(transaction.INR) || 0).toString(),
          Currency: transaction.Currency || 'INR',
          ID: transaction.ID || `import_${Date.now()}_${i}`,
          user: req.user.id
        };

        processedTransactions.push(processedTransaction);
      } catch (error) {
        errors.push(`Transaction ${i + 1}: ${error.message}`);
      }
    }

    if (processedTransactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid transactions found in the data',
        errors
      });
    }

    // Insert transactions into database
    const result = await Transaction.insertMany(processedTransactions);

    res.json({
      success: true,
      message: `Successfully imported ${result.length} transactions`,
      data: {
        imported: result.length,
        errors: errors.length > 0 ? errors : null
      }
    });

  } catch (error) {
    console.error('JSON import error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while importing JSON data'
    });
  }
});

module.exports = router; 