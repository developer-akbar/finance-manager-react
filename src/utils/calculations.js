export const calculateTotals = (transactions) => {
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(transaction => {
    const amount = parseFloat(transaction.INR) || parseFloat(transaction.Amount) || 0;
    if (transaction['Income/Expense'] === 'Income') {
      totalIncome += amount;
    } else if (transaction['Income/Expense'] === 'Expense') {
      totalExpense += amount;
    }
    // Transfer-Out transactions don't affect income/expense totals
  });

  return {
    income: totalIncome,
    expense: totalExpense,
    balance: totalIncome - totalExpense
  };
};

export const getMonthlyData = (transactions) => {
  const monthlyData = {};
  
  transactions.forEach(transaction => {
    // Parse date - handle DD/MM/YYYY format directly
    let date;
    const dateStr = transaction.Date;
    
    // If in DD/MM/YYYY format, parse directly
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      // Try other formats
      date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) return; // Skip invalid dates
    
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expense: 0 };
    }
    
    const amount = parseFloat(transaction.INR) || parseFloat(transaction.Amount) || 0;
    if (transaction['Income/Expense'] === 'Income') {
      monthlyData[monthKey].income += amount;
    } else if (transaction['Income/Expense'] === 'Expense') {
      monthlyData[monthKey].expense += amount;
    }
    // Transfer-Out transactions don't affect monthly totals
  });

  return monthlyData;
};

export const getCategoryWiseData = (transactions, type = 'Expense') => {
  const categoryData = {};
  
  transactions
    .filter(t => t['Income/Expense'] === type)
    .forEach(transaction => {
      const category = transaction.Category;
      const amount = parseFloat(transaction.INR) || parseFloat(transaction.Amount) || 0;
      
      if (!categoryData[category]) {
        categoryData[category] = 0;
      }
      categoryData[category] += amount;
    });

  return categoryData;
};

export const formatCurrency = (amount, currency = 'INR') => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return formatter.format(amount);
};

// Based on user's proven date handling approach
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // If already in DD/MM/YYYY format, return as is
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
    return dateString;
  }
  
  // If already in DD-MM-YYYY format, return as is
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateString)) {
    return dateString;
  }
  
  // If in YYYY-MM-DD format, convert to DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
  
  // If in YYYY/MM/DD format, convert to DD/MM/YYYY
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('/');
    return `${day}/${month}/${year}`;
  }
  
  // Try to parse with Date constructor as fallback
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  return dateString; // Return as is if can't parse
};

// Simple date format conversion: just replace hyphens with slashes
export const convertDateFormat = (dateString) => {
  if (!dateString) return '';
  
  // If already in DD/MM/YYYY format, return as is
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
    return dateString;
  }
  
  // If in DD-MM-YYYY format, just replace hyphens with slashes
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateString)) {
    return dateString.replace(/-/g, '/');
  }
  
  return dateString;
};