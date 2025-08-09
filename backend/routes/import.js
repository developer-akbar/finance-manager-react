const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const Transaction = require('../models/Transaction');
const UserSettings = require('../models/UserSettings');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Date parsing for CSV approach (like legacy)
const parseDate = (dateValue) => {
  if (!dateValue) return null;
  
  const dateStr = dateValue.toString().trim();
  
  // Remove time portion if present
  const dateOnly = dateStr.split(' ')[0];
  
  // If it's DD-MM-YYYY format, just replace hyphens with slashes (like legacy)
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateOnly)) {
    return dateOnly.replace(/-/g, '/');
  }
  
  // If already in DD/MM/YYYY format, return as is
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateOnly)) {
    return dateOnly;
  }
  
  // Handle Excel serial numbers if they come through as strings
  if (/^\d+\.\d+$/.test(dateOnly)) {
    const serialNumber = parseFloat(dateOnly);
    if (!isNaN(serialNumber)) {
      // Excel serial number conversion
      const excelEpoch = new Date(1900, 0, 1);
      const daysSinceEpoch = serialNumber - 1;
      const resultDate = new Date(excelEpoch);
      resultDate.setDate(resultDate.getDate() + daysSinceEpoch);
      
      if (!isNaN(resultDate.getTime())) {
        const day = String(resultDate.getDate()).padStart(2, '0');
        const month = String(resultDate.getMonth() + 1).padStart(2, '0');
        const year = resultDate.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }
  }
  
  // Try standard Date parsing as fallback
  const parsedDate = new Date(dateStr);
  if (!isNaN(parsedDate.getTime())) {
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  return null; // Could not parse
};

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

    // Get import mode from request body (merge or override)
    const { mode = 'override' } = req.body;

    // Parse Excel file and convert to CSV first (like legacy approach)
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert worksheet to CSV data first (like legacy approach)
    let csvData = XLSX.utils.sheet_to_csv(worksheet, { FS: ',', RS: '\n', strip: false });
    
    // Handle line breaks within cells (like legacy approach)
    csvData = csvData.replace(/"([^"]*)"/g, function (match, p1) {
      return p1.replace(/\n/g, '|new-line|').replace(/,/g, '|comma|');
    });
    
    // Split CSV into rows
    const csvRows = csvData.split('\n').filter(row => row.trim().length > 0);
    
    if (csvRows.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Excel file must contain at least a header row and one data row'
      });
    }
    
    // Parse CSV rows manually
    const rawData = csvRows.map(row => {
      // Split by comma, but handle quoted fields
      const fields = [];
      let currentField = '';
      let inQuotes = false;
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(currentField.trim());
          currentField = '';
        } else {
          currentField += char;
        }
      }
      fields.push(currentField.trim()); // Add the last field
      
      return fields;
    });
    
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
    
         // Log sample data for debugging
     console.log('Sample headers:', headers);
     console.log('Sample first row:', rawData[1]);
     console.log('Date column index:', dateIndex);
     console.log('Sample date value:', rawData[1] ? rawData[1][dateIndex] : 'No data');
     console.log('Total rows to process:', rawData.length - 1);
    
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      
      try {
        // Skip only truly empty rows (missing date or completely empty INR field)
        if (!row[dateIndex] || row[inrIndex] === undefined || row[inrIndex] === null || row[inrIndex] === '') {
          console.log(`Row ${i + 1}: Skipping empty row - Date: ${row[dateIndex]}, INR: ${row[inrIndex]}`);
          continue;
        }

                 // Parse date using helper function
         const date = parseDate(row[dateIndex]);
         if (!date) {
           errors.push(`Row ${i + 1}: Invalid date format - ${row[dateIndex]}`);
           continue;
         }

        // Parse INR amount - allow 0 values
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
        
        // Allow 0 values - don't skip them
        console.log(`Row ${i + 1}: Processing amount ${amount} (original: ${row[inrIndex]})`);

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
        
        console.log(`Row ${i + 1}: Created transaction with amount ${absAmount} (type: ${transactionType})`);

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

    // Extract unique accounts and categories from imported data
    const uniqueAccounts = new Set();
    const uniqueCategories = {};
    
    transactions.forEach(transaction => {
      if (transaction.Account) {
        uniqueAccounts.add(transaction.Account);
      }
      if (transaction.FromAccount) {
        uniqueAccounts.add(transaction.FromAccount);
      }
      if (transaction.ToAccount) {
        uniqueAccounts.add(transaction.ToAccount);
      }
      if (transaction.Category && transaction['Income/Expense'] !== 'Transfer-Out') {
        if (!uniqueCategories[transaction['Income/Expense']]) {
          uniqueCategories[transaction['Income/Expense']] = new Set();
        }
        uniqueCategories[transaction['Income/Expense']].add(transaction.Category);
      }
    });

    // Check for existing transactions if mode is merge
    let finalTransactions = transactions;
    let duplicates = [];
    
    if (mode === 'merge') {
      // Get existing transactions for this user
      const existingTransactions = await Transaction.find({ user: req.user.id });
      
      // Check for duplicates based on user's legacy logic
      const nonDuplicates = [];
      
      transactions.forEach(newTransaction => {
        const isDuplicate = existingTransactions.some(existingTransaction => {
          // Check if transactions are duplicates based on key fields
          return (
            existingTransaction.Date === newTransaction.Date &&
            existingTransaction.Account === newTransaction.Account &&
            existingTransaction.Category === newTransaction.Category &&
            existingTransaction.Subcategory === newTransaction.Subcategory &&
            existingTransaction.Note === newTransaction.Note &&
            existingTransaction.INR === newTransaction.INR &&
            existingTransaction['Income/Expense'] === newTransaction['Income/Expense']
          );
        });
        
        if (isDuplicate) {
          duplicates.push(newTransaction);
        } else {
          nonDuplicates.push(newTransaction);
        }
      });
      
      finalTransactions = nonDuplicates;
    }
    
    // Insert transactions into database
    const result = finalTransactions.length > 0 ? await Transaction.insertMany(finalTransactions) : [];

    // Update user settings with extracted accounts and categories
    const UserSettings = require('../models/UserSettings');
    let userSettings = await UserSettings.findOne({ user: req.user.id });
    
    if (!userSettings) {
      userSettings = new UserSettings({ user: req.user.id });
    }

    // Update accounts
    const existingAccounts = userSettings.accounts || [];
    const newAccounts = Array.from(uniqueAccounts).filter(account => 
      !existingAccounts.includes(account)
    );
    userSettings.accounts = [...existingAccounts, ...newAccounts];

    // Update categories
    const existingCategories = userSettings.categories || {};
    Object.keys(uniqueCategories).forEach(type => {
      if (!existingCategories[type]) {
        existingCategories[type] = [];
      }
      const newCategories = Array.from(uniqueCategories[type]).filter(category => 
        !existingCategories[type].includes(category)
      );
      existingCategories[type] = [...existingCategories[type], ...newCategories];
    });
    userSettings.categories = existingCategories;

    await userSettings.save();

    const totalRows = rawData.length - 1; // Exclude header row
    const importedCount = result.length;
    const skippedCount = totalRows - importedCount;
    
    console.log(`Import Summary:
      - Total rows processed: ${totalRows}
      - Successfully imported: ${importedCount}
      - Skipped rows: ${skippedCount}
      - Duplicates found: ${duplicates.length}
      - Errors: ${errors.length}
      - New accounts found: ${newAccounts.length}
      - New categories found: ${Object.keys(uniqueCategories).reduce((sum, type) => sum + uniqueCategories[type].size, 0)}`);
    
    res.json({
      success: true,
      message: `Successfully imported ${result.length} transactions`,
      data: {
        imported: result.length,
        totalRows: totalRows,
        skippedRows: skippedCount,
        duplicates: duplicates.length > 0 ? duplicates.length : null,
        errors: errors.length > 0 ? errors : null,
        newAccounts: newAccounts,
        newCategories: Object.fromEntries(
          Object.entries(uniqueCategories).map(([type, categories]) => [
            type, 
            Array.from(categories)
          ])
        )
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
    const { transactions, mode = 'override' } = req.body;

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

    // Handle import mode
    let result;
    if (mode === 'override') {
      // Clear existing transactions for this user
      await Transaction.deleteMany({ user: req.user.id });
      // Insert new transactions
      result = await Transaction.insertMany(processedTransactions);
    } else if (mode === 'merge') {
      // Check for duplicates based on ID or Date+Amount+Account combination
      const existingTransactions = await Transaction.find({ user: req.user.id });
      const existingIds = new Set(existingTransactions.map(t => t.ID));
      const existingKeys = new Set(existingTransactions.map(t => `${t.Date}_${t.Amount}_${t.Account}`));
      
      const newTransactions = processedTransactions.filter(transaction => {
        const key = `${transaction.Date}_${transaction.Amount}_${transaction.Account}`;
        return !existingIds.has(transaction.ID) && !existingKeys.has(key);
      });
      
      if (newTransactions.length > 0) {
        result = await Transaction.insertMany(newTransactions);
      } else {
        result = { length: 0 };
      }
    } else {
      // Default to override
      await Transaction.deleteMany({ user: req.user.id });
      result = await Transaction.insertMany(processedTransactions);
    }

    // Extract unique accounts and categories from imported data
    const uniqueAccounts = new Set();
    const uniqueCategories = new Map();

    processedTransactions.forEach(transaction => {
      // Extract accounts
      if (transaction.Account) uniqueAccounts.add(transaction.Account);
      if (transaction.FromAccount) uniqueAccounts.add(transaction.FromAccount);
      if (transaction.ToAccount) uniqueAccounts.add(transaction.ToAccount);

      // Extract categories with proper structure (flat structure)
      if (transaction.Category && transaction['Income/Expense']) {
        const categoryName = transaction.Category;
        if (!uniqueCategories.has(categoryName)) {
          uniqueCategories.set(categoryName, {
            type: transaction['Income/Expense'],
            subcategories: [transaction.Subcategory || 'Default']
          });
        } else {
          // Add subcategory if not already present
          const existingCategory = uniqueCategories.get(categoryName);
          if (transaction.Subcategory && !existingCategory.subcategories.includes(transaction.Subcategory)) {
            existingCategory.subcategories.push(transaction.Subcategory);
          }
        }
      }
    });

    // Update user settings with extracted data
    let userSettings = await UserSettings.findOne({ user: req.user.id });
    
    if (!userSettings) {
      userSettings = new UserSettings({ user: req.user.id });
    }

    // Merge new accounts with existing ones
    const existingAccounts = new Set(userSettings.accounts || []);
    uniqueAccounts.forEach(account => existingAccounts.add(account));
    userSettings.accounts = Array.from(existingAccounts);

    // Merge new categories with existing ones (flat structure)
    const existingCategories = new Map(userSettings.categories || []);
    uniqueCategories.forEach((categoryData, categoryName) => {
      if (!existingCategories.has(categoryName)) {
        existingCategories.set(categoryName, categoryData);
      } else {
        // Merge subcategories
        const existingCategory = existingCategories.get(categoryName);
        categoryData.subcategories.forEach(subcategory => {
          if (!existingCategory.subcategories.includes(subcategory)) {
            existingCategory.subcategories.push(subcategory);
          }
        });
      }
    });
    userSettings.categories = existingCategories;

    await userSettings.save();

    res.json({
      success: true,
      message: `Successfully imported ${result.length} transactions using ${mode} mode`,
      data: {
        imported: result.length,
        totalProcessed: processedTransactions.length,
        skipped: mode === 'merge' ? processedTransactions.length - result.length : 0,
        mode: mode,
        errors: errors.length > 0 ? errors : null,
        newAccounts: Array.from(uniqueAccounts),
        newCategories: Object.fromEntries(uniqueCategories)
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