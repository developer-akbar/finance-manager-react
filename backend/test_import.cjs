// Test script for import functionality
const fs = require('fs');
const XLSX = require('xlsx');

// Sample data that matches the expected format
const sampleData = [
  {
    Date: '01-01-2024 10:30:00 AM',
    Account: 'Cash',
    Category: 'Food',
    Subcategory: 'Groceries',
    Note: 'Weekly groceries',
    INR: 1500.00,
    'Income/Expense': 'Expense',
    Description: 'Purchased groceries from supermarket',
    Amount: '1500.00',
    Currency: 'INR',
    ID: 'test_1'
  },
  {
    Date: '01-01-2024 02:15:00 PM',
    Account: 'Bank',
    Category: 'Salary',
    Subcategory: 'Monthly',
    Note: 'Monthly salary',
    INR: 50000.00,
    'Income/Expense': 'Income',
    Description: 'Salary credited to bank account',
    Amount: '50000.00',
    Currency: 'INR',
    ID: 'test_2'
  },
  {
    Date: '02-01-2024 09:00:00 AM',
    Account: 'Cash',
    Category: 'Bank',
    Subcategory: 'Transfer',
    Note: 'Cash withdrawal',
    INR: 5000.00,
    'Income/Expense': 'Transfer',
    Description: 'Withdrew cash from ATM',
    Amount: '5000.00',
    Currency: 'INR',
    ID: 'test_3'
  },
  {
    Date: '02-01-2024 11:45:00 AM',
    Account: 'Credit Card',
    Category: 'Shopping',
    Subcategory: 'Clothing',
    Note: 'New clothes',
    INR: 2500.00,
    'Income/Expense': 'Expense',
    Description: 'Purchased new clothes from mall',
    Amount: '2500.00',
    Currency: 'INR',
    ID: 'test_4'
  },
  {
    Date: '03-01-2024 08:30:00 AM',
    Account: 'Savings',
    Category: 'Investment',
    Subcategory: 'Mutual Fund',
    Note: 'Monthly investment',
    INR: 10000.00,
    'Income/Expense': 'Expense',
    Description: 'Monthly mutual fund investment',
    Amount: '10000.00',
    Currency: 'INR',
    ID: 'test_5'
  }
];

// Create Excel file
function createTestExcelFile() {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  
  // Set column widths
  const columnWidths = [
    { wch: 20 }, // Date
    { wch: 15 }, // Account
    { wch: 15 }, // Category
    { wch: 15 }, // Subcategory
    { wch: 20 }, // Note
    { wch: 12 }, // INR
    { wch: 15 }, // Income/Expense
    { wch: 30 }, // Description
    { wch: 12 }, // Amount
    { wch: 10 }, // Currency
    { wch: 15 }  // ID
  ];
  worksheet['!cols'] = columnWidths;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  
  // Write to file
  const filename = 'test_import_data.xlsx';
  XLSX.writeFile(workbook, filename);
  console.log(`✅ Test Excel file created: ${filename}`);
  return filename;
}

// Create CSV file
function createTestCSVFile() {
  const headers = ['Date', 'Account', 'Category', 'Subcategory', 'Note', 'INR', 'Income/Expense', 'Description', 'Amount', 'Currency', 'ID'];
  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => [
      row.Date,
      row.Account,
      row.Category,
      row.Subcategory,
      row.Note,
      row.INR,
      row['Income/Expense'],
      row.Description,
      row.Amount,
      row.Currency,
      row.ID
    ].join(','))
  ].join('\n');
  
  const filename = 'test_import_data.csv';
  fs.writeFileSync(filename, csvContent);
  console.log(`✅ Test CSV file created: ${filename}`);
  return filename;
}

// Create JSON file
function createTestJSONFile() {
  const filename = 'test_import_data.json';
  fs.writeFileSync(filename, JSON.stringify(sampleData, null, 2));
  console.log(`✅ Test JSON file created: ${filename}`);
  return filename;
}

// Test date parsing function
function testDateParsing() {
  console.log('\n🧪 Testing Date Parsing:');
  
  const testDates = [
    '01-01-2024 10:30:00 AM',
    '02-01-2024',
    '03-01-2024 02:15:00 PM',
    '04-01-2024 09:00:00 AM',
    '05-01-2024 11:45:00 AM'
  ];
  
  testDates.forEach(dateStr => {
    console.log(`Input: ${dateStr}`);
    // This would be the actual parsing logic from the backend
    const parsed = parseDate(dateStr);
    console.log(`Output: ${parsed}`);
    console.log('---');
  });
}

// Mock date parsing function (same as backend)
function parseDate(dateString) {
  if (!dateString) return null;

  try {
    if (typeof dateString === 'string') {
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
        
        const date = new Date(year, month - 1, day, hour24, minute, second);
        return formatDateForDB(date);
      }
      
      // Handle DD-MM-YYYY format
      const dateRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
      const dateMatch = dateString.match(dateRegex);
      
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const date = new Date(year, month - 1, day);
        return formatDateForDB(date);
      }
      
      // Handle other common formats
      const parsedDate = new Date(dateString);
      if (!isNaN(parsedDate.getTime())) {
        return formatDateForDB(parsedDate);
      }
    }
    
    if (dateString instanceof Date) {
      return formatDateForDB(dateString);
    }
    
    return null;
  } catch (error) {
    console.error('Date parsing error:', error);
    return null;
  }
}

function formatDateForDB(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Main execution
console.log('🚀 Creating test files for import functionality...\n');

try {
  createTestExcelFile();
  createTestCSVFile();
  createTestJSONFile();
  
  console.log('\n📋 Sample data structure:');
  console.log(JSON.stringify(sampleData[0], null, 2));
  
  testDateParsing();
  
  console.log('\n✅ Test files created successfully!');
  console.log('📝 You can now use these files to test the import functionality:');
  console.log('   - test_import_data.xlsx (Excel format)');
  console.log('   - test_import_data.csv (CSV format)');
  console.log('   - test_import_data.json (JSON format)');
  console.log('\n🔧 To test the import:');
  console.log('   1. Start the backend server: cd backend && npm start');
  console.log('   2. Start the frontend: npm run dev');
  console.log('   3. Go to Settings > Data Management');
  console.log('   4. Upload one of the test files');
  
} catch (error) {
  console.error('❌ Error creating test files:', error);
}
