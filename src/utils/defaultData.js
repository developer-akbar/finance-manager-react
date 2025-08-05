export const initializeDefaultData = () => {
  // Only initialize if data doesn't already exist
  if (!localStorage.getItem('accountGroups')) {
    localStorage.setItem("accountGroups", JSON.stringify([
      { id: 1, name: "Cash" },
      { id: 2, name: "Bank Accounts" },
      { id: 3, name: "Credit Cards" },
      { id: 4, name: "EMIs" },
      { id: 5, name: "Investments" }
    ]));
  }

  if (!localStorage.getItem('accountMapping')) {
    localStorage.setItem("accountMapping", JSON.stringify({
      "Cash": ["Cash"],
      "Bank Accounts": ["SBI", "HDFC", "ICICI"],
      "Credit Cards": ["SBI Card", "HDFC Card"],
      "EMIs": ["Home Loan", "Car Loan"],
      "Investments": ["Mutual Funds", "Stocks"]
    }));
  }

  if (!localStorage.getItem('accounts')) {
    localStorage.setItem("accounts", JSON.stringify([
      "Cash", "SBI", "HDFC", "ICICI", "SBI Card", "HDFC Card", 
      "Home Loan", "Car Loan", "Mutual Funds", "Stocks", "EMIs"
    ]));
  }

  if (!localStorage.getItem('categories')) {
    localStorage.setItem("categories", JSON.stringify({
      "Housing": { 
        type: "Expense", 
        subcategories: ["Rent", "Groceries", "Electricity", "Gas", "Water", "Internet"] 
      },
      "Transportation": { 
        type: "Expense", 
        subcategories: ["Fuel", "Public Transport", "Maintenance", "Insurance"] 
      },
      "Food & Dining": { 
        type: "Expense", 
        subcategories: ["Restaurants", "Coffee", "Groceries"] 
      },
      "Entertainment": { 
        type: "Expense", 
        subcategories: ["Movies", "Games", "Subscriptions"] 
      },
      "Shopping": { 
        type: "Expense", 
        subcategories: ["Clothing", "Electronics", "For Myself", "online shopping"] 
      },
      "Healthcare": { 
        type: "Expense", 
        subcategories: ["Doctor", "Pharmacy", "Insurance"] 
      },
      "Salary": { 
        type: "Income", 
        subcategories: ["Primary Job", "Freelance"] 
      },
      "Investment Returns": { 
        type: "Income", 
        subcategories: ["Dividends", "Interest", "Capital Gains"] 
      },
      "Bonus": { 
        type: "Income", 
        subcategories: ["Performance Bonus", "Festival Bonus"] 
      },
      "Other Income": { 
        type: "Income", 
        subcategories: ["Gift", "Refund"] 
      }
    }));
  }

  if (!localStorage.getItem('csvConversionDetails')) {
    localStorage.setItem("csvConversionDetails", JSON.stringify({
      dateFormat: "DD/MM/YYYY",
      currency: "INR",
      delimiter: ","
    }));
  }

  if (!localStorage.getItem('masterExpenses')) {
    const sampleTransactions = [
      {
        "Date": new Date().toLocaleDateString(),
        "Account": "Cash",
        "Category": "Food & Dining",
        "Subcategory": "Restaurants",
        "Note": "Lunch with friends",
        "INR": 850,
        "Income/Expense": "Expense",
        "Description": "Pizza and drinks at local restaurant",
        "Amount": "850",
        "Currency": "INR",
        "ID": "1001"
      },
      {
        "Date": new Date().toLocaleDateString(),
        "Account": "SBI",
        "Category": "Salary",
        "Subcategory": "Primary Job",
        "Note": "Monthly salary",
        "INR": 50000,
        "Income/Expense": "Income",
        "Description": "Software Developer salary",
        "Amount": "50000",
        "Currency": "INR",
        "ID": "1002"
      },
      {
        "Date": new Date(Date.now() - 86400000).toLocaleDateString(),
        "Account": "HDFC Card",
        "Category": "Shopping",
        "Subcategory": "online shopping",
        "Note": "New headphones",
        "INR": 2500,
        "Income/Expense": "Expense",
        "Description": "Wireless noise-cancelling headphones",
        "Amount": "2500",
        "Currency": "INR",
        "ID": "1003"
      }
    ];
    localStorage.setItem("masterExpenses", JSON.stringify(sampleTransactions));
  }

  if (!localStorage.getItem('isAuthenticated')) {
    localStorage.setItem('isAuthenticated', 'false');
  }
};