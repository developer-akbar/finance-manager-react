const fs = require('fs');

// Configuration
const accounts = [
  "Cash",
  "Bank Account", 
  "Credit Card",
  "Savings Account",
  "Investment Account",
  "Digital Wallet"
];

const categories = {
  "Housing": {
    "type": "Expense",
    "subcategories": ["Rent", "Groceries", "Electricity", "Gas"]
  },
  "Travel": {
    "type": "Expense", 
    "subcategories": []
  },
  "Utilities": {
    "type": "Expense",
    "subcategories": ["Recharge", "DTH", "Water"]
  },
  "Shopping": {
    "type": "Expense",
    "subcategories": []
  },
  "Health": {
    "type": "Expense",
    "subcategories": ["Medicines", "Hospital"]
  },
  "Subscriptions": {
    "type": "Expense",
    "subcategories": ["Netflix", "Prime"]
  },
  "Entertainment": {
    "type": "Expense",
    "subcategories": ["Cinema", "Outing"]
  },
  "Groceries": {
    "type": "Expense",
    "subcategories": []
  },
  "Dining": {
    "type": "Expense",
    "subcategories": []
  },
  "Salary": {
    "type": "Income",
    "subcategories": []
  },
  "Bonus": {
    "type": "Income",
    "subcategories": []
  },
  "Petty Cash": {
    "type": "Income",
    "subcategories": []
  }
};

// Helper functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

// Generate valid MongoDB ObjectId (24 hex characters)
const generateObjectId = () => {
  const hexChars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += hexChars[Math.floor(Math.random() * hexChars.length)];
  }
  return result;
};

const getRandomAmount = (category, type) => {
  let min, max;
  
  switch (category) {
    case 'Salary':
      min = 25000; max = 150000; break;
    case 'Bonus':
      min = 5000; max = 50000; break;
    case 'Petty Cash':
      min = 100; max = 2000; break;
    case 'Rent':
      min = 8000; max = 25000; break;
    case 'Groceries':
      min = 500; max = 3000; break;
    case 'Electricity':
      min = 800; max = 2500; break;
    case 'Gas':
      min = 300; max = 800; break;
    case 'Recharge':
      min = 100; max = 500; break;
    case 'DTH':
      min = 200; max = 800; break;
    case 'Water':
      min = 150; max = 400; break;
    case 'Medicines':
      min = 200; max = 1500; break;
    case 'Hospital':
      min = 1000; max = 15000; break;
    case 'Netflix':
      min = 199; max = 799; break;
    case 'Prime':
      min = 149; max = 1499; break;
    case 'Cinema':
      min = 200; max = 800; break;
    case 'Outing':
      min = 500; max = 3000; break;
    case 'Dining':
      min = 300; max = 2000; break;
    case 'Shopping':
      min = 500; max = 5000; break;
    case 'Travel':
      min = 1000; max = 10000; break;
    default:
      min = 100; max = 1000; break;
  }
  
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateNote = (category, subcategory, type) => {
  const notes = {
    'Salary': ['Monthly salary', 'Salary credit', 'Payroll', 'Monthly income'],
    'Bonus': ['Performance bonus', 'Festival bonus', 'Year-end bonus', 'Incentive'],
    'Petty Cash': ['Cash withdrawal', 'ATM withdrawal', 'Petty cash', 'Cash received'],
    'Rent': ['House rent', 'Apartment rent', 'Monthly rent', 'Rent payment'],
    'Groceries': ['Weekly groceries', 'Monthly groceries', 'Food items', 'Household items'],
    'Electricity': ['Electricity bill', 'Power bill', 'Monthly electricity', 'EB bill'],
    'Gas': ['Gas cylinder', 'LPG refill', 'Cooking gas', 'Gas bill'],
    'Recharge': ['Mobile recharge', 'Phone recharge', 'Data pack', 'Talktime'],
    'DTH': ['DTH recharge', 'TV recharge', 'Cable bill', 'Satellite TV'],
    'Water': ['Water bill', 'Municipal water', 'Water supply', 'Water charges'],
    'Medicines': ['Pharmacy', 'Medical supplies', 'Prescription', 'Health products'],
    'Hospital': ['Medical consultation', 'Hospital visit', 'Health checkup', 'Treatment'],
    'Netflix': ['Netflix subscription', 'Streaming service', 'Monthly Netflix', 'Entertainment'],
    'Prime': ['Amazon Prime', 'Prime subscription', 'Monthly Prime', 'Streaming'],
    'Cinema': ['Movie tickets', 'Cinema visit', 'Film show', 'Entertainment'],
    'Outing': ['Weekend outing', 'Family outing', 'Recreation', 'Leisure'],
    'Dining': ['Restaurant', 'Food delivery', 'Dining out', 'Meal'],
    'Shopping': ['Online shopping', 'Retail shopping', 'Clothing', 'Electronics'],
    'Travel': ['Business travel', 'Vacation', 'Trip', 'Journey']
  };
  
  const categoryNotes = notes[subcategory] || notes[category] || ['Transaction'];
  return getRandomElement(categoryNotes);
};

const generateDescription = (category, subcategory, amount, type) => {
  const descriptions = {
    'Salary': [
      `Monthly salary credited to account for ${new Date().getFullYear()}`,
      `Salary payment for professional services rendered`,
      `Monthly compensation for employment period`
    ],
    'Bonus': [
      `Performance bonus for exceptional work`,
      `Festival bonus for ${new Date().getFullYear()}`,
      `Year-end incentive bonus`
    ],
    'Rent': [
      `Monthly rent payment for residential accommodation`,
      `House rent for ${new Date().getFullYear()}`,
      `Rental payment for living space`
    ],
    'Groceries': [
      `Weekly grocery shopping for household needs`,
      `Monthly grocery purchase including food items`,
      `Household grocery shopping`
    ],
    'Electricity': [
      `Electricity bill payment for current month`,
      `Power consumption charges for residential use`,
      `Monthly electricity bill`
    ],
    'Dining': [
      `Dining out at restaurant with family`,
      `Food delivery order from online platform`,
      `Restaurant meal with friends`
    ],
    'Shopping': [
      `Online shopping for personal items`,
      `Retail shopping for clothing and accessories`,
      `Electronics purchase from store`
    ],
    'Travel': [
      `Business travel expenses for work trip`,
      `Vacation travel to tourist destination`,
      `Family trip to holiday location`
    ]
  };
  
  const categoryDescriptions = descriptions[category] || [
    `${category} transaction for ${amount} INR`,
    `Payment for ${category.toLowerCase()} services`,
    `${category} related expense/income`
  ];
  
  return getRandomElement(categoryDescriptions);
};

const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const generateTransactions = () => {
  const transactions = [];
  const user = generateObjectId(); // Generate valid ObjectId for user
  let transactionId = 1;
  
  // Generate transactions from 2015 to 2026
  for (let year = 2015; year <= 2026; year++) {
    for (let month = 0; month < 12; month++) {
      // Determine number of transactions for this month (more realistic distribution)
      let transactionsThisMonth;
      
      // More transactions in recent years
      if (year >= 2020) {
        transactionsThisMonth = Math.floor(Math.random() * 200) + 150; // 150-350
      } else if (year >= 2018) {
        transactionsThisMonth = Math.floor(Math.random() * 150) + 100; // 100-250
      } else {
        transactionsThisMonth = Math.floor(Math.random() * 100) + 50; // 50-150
      }
      
      // More transactions in certain months (salary months, festival months)
      if (month === 0 || month === 11) { // January and December
        transactionsThisMonth += 50;
      }
      
      for (let i = 0; i < transactionsThisMonth; i++) {
        const day = Math.floor(Math.random() * 28) + 1; // Avoid 29-31 for simplicity
        const date = new Date(year, month, day);
        const dateStr = formatDate(date);
        
        // Determine transaction type with realistic distribution
        let type, category, subcategory;
        const typeRoll = Math.random();
        
        if (typeRoll < 0.15) { // 15% Income
          type = 'Income';
          const incomeCategories = ['Salary', 'Bonus', 'Petty Cash'];
          category = getRandomElement(incomeCategories);
          subcategory = categories[category].subcategories.length > 0 
            ? getRandomElement(categories[category].subcategories) 
            : '';
        } else if (typeRoll < 0.95) { // 80% Expense
          type = 'Expense';
          const expenseCategories = Object.keys(categories).filter(cat => categories[cat].type === 'Expense');
          category = getRandomElement(expenseCategories);
          subcategory = categories[category].subcategories.length > 0 
            ? getRandomElement(categories[category].subcategories) 
            : '';
        } else { // 5% Transfer
          type = 'Transfer-Out';
          category = '';
          subcategory = '';
        }
        
        const amount = getRandomAmount(subcategory || category, type);
        const account = getRandomElement(accounts);
        const fromAccount = type === 'Transfer-Out' ? getRandomElement(accounts) : account;
        const toAccount = type === 'Transfer-Out' ? getRandomElement(accounts.filter(acc => acc !== fromAccount)) : '';
        
        const note = generateNote(category, subcategory, type);
        const description = generateDescription(category, subcategory, amount, type);
        
        const transaction = {
          _id: {
            "$oid": generateObjectId()
          },
          user: {
            "$oid": user
          },
          Date: dateStr,
          Account: type === 'Transfer-Out' ? fromAccount : account,
          FromAccount: type === 'Transfer-Out' ? fromAccount : '',
          ToAccount: type === 'Transfer-Out' ? toAccount : '',
          Category: category,
          Subcategory: subcategory || 'Default',
          Note: note,
          INR: amount,
          'Income/Expense': type,
          Description: description,
          Amount: amount.toString(),
          Currency: 'INR',
          ID: `${Date.now()}_${transactionId}`,
          createdAt: {
            "$date": date.toISOString()
          },
          updatedAt: {
            "$date": date.toISOString()
          },
          __v: 0
        };
        
        transactions.push(transaction);
        transactionId++;
      }
    }
  }
  
  return transactions;
};

// Generate the data
console.log('Generating test transactions...');
const transactions = generateTransactions();
console.log(`Generated ${transactions.length} transactions`);

// Save as JSON
fs.writeFileSync('test_transactions_corrected.json', JSON.stringify(transactions, null, 2));
console.log('Saved to test_transactions_corrected.json');

// Save as CSV
const csvHeader = '_id,user,Date,Account,FromAccount,ToAccount,Category,Subcategory,Note,INR,Income/Expense,Description,Amount,Currency,ID,createdAt,updatedAt,__v\n';
const csvRows = transactions.map(t => 
  `"${t._id['$oid']}","${t.user['$oid']}","${t.Date}","${t.Account}","${t.FromAccount}","${t.ToAccount}","${t.Category}","${t.Subcategory}","${t.Note}","${t.INR}","${t['Income/Expense']}","${t.Description}","${t.Amount}","${t.Currency}","${t.ID}","${t.createdAt['$date']}","${t.updatedAt['$date']}","${t.__v}"`
).join('\n');

fs.writeFileSync('test_transactions_corrected.csv', csvHeader + csvRows);
console.log('Saved to test_transactions_corrected.csv');

// Print summary
const summary = {
  totalTransactions: transactions.length,
  years: [...new Set(transactions.map(t => new Date(t.createdAt['$date']).getFullYear()))].sort(),
  types: [...new Set(transactions.map(t => t['Income/Expense']))],
  categories: [...new Set(transactions.map(t => t.Category).filter(Boolean))],
  accounts: [...new Set(transactions.map(t => t.Account))],
  totalIncome: transactions.filter(t => t['Income/Expense'] === 'Income').reduce((sum, t) => sum + t.INR, 0),
  totalExpense: transactions.filter(t => t['Income/Expense'] === 'Expense').reduce((sum, t) => sum + t.INR, 0),
  totalTransfer: transactions.filter(t => t['Income/Expense'] === 'Transfer-Out').reduce((sum, t) => sum + t.INR, 0)
};

console.log('\n=== SUMMARY ===');
console.log(`Total Transactions: ${summary.totalTransactions}`);
console.log(`Years: ${summary.years.join(', ')}`);
console.log(`Types: ${summary.types.join(', ')}`);
console.log(`Categories: ${summary.categories.join(', ')}`);
console.log(`Accounts: ${summary.accounts.join(', ')}`);
console.log(`Total Income: ₹${summary.totalIncome.toLocaleString()}`);
console.log(`Total Expense: ₹${summary.totalExpense.toLocaleString()}`);
console.log(`Total Transfer: ₹${summary.totalTransfer.toLocaleString()}`);
console.log(`Net Balance: ₹${(summary.totalIncome - summary.totalExpense).toLocaleString()}`); 