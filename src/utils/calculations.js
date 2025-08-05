export const calculateTotals = (transactions) => {
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(transaction => {
    const amount = parseFloat(transaction.Amount) || 0;
    if (transaction['Income/Expense'] === 'Income') {
      totalIncome += amount;
    } else {
      totalExpense += amount;
    }
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
    const date = new Date(transaction.Date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expense: 0 };
    }
    
    const amount = parseFloat(transaction.Amount) || 0;
    if (transaction['Income/Expense'] === 'Income') {
      monthlyData[monthKey].income += amount;
    } else {
      monthlyData[monthKey].expense += amount;
    }
  });

  return monthlyData;
};

export const getCategoryWiseData = (transactions, type = 'Expense') => {
  const categoryData = {};
  
  transactions
    .filter(t => t['Income/Expense'] === type)
    .forEach(transaction => {
      const category = transaction.Category;
      const amount = parseFloat(transaction.Amount) || 0;
      
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

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};