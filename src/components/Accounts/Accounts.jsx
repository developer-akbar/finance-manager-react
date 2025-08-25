import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { transactionsAPI } from '../../services/api';
import { ArrowLeft, Edit2, Trash2, Calendar, BarChart3, TrendingUp } from 'lucide-react';
import DateNavigation from '../Common/DateNavigation';
import TransactionList from '../Common/TransactionList';
import './Accounts.css';

const Accounts = () => {
  const { state, dispatch } = useApp();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [accountBalances, setAccountBalances] = useState({});
  const [accountTransactions, setAccountTransactions] = useState([]);
  const [currentView, setCurrentView] = useState('accounts'); // 'accounts' or 'transactions'

  // Get accounts from transactions - following legacy accounts.js logic exactly
  const getAccounts = () => {
    if (state.transactions.length === 0) return [];
    
    const accountBalances = state.transactions.reduce((acc, transaction) => {
      const account = transaction.Account;
      if (!acc.includes(account)) {
        acc.push(account);
      }
      if (transaction['Income/Expense'] === 'Transfer-Out') {
        const targetAccount = transaction.Category;
        if (!acc.includes(targetAccount)) {
          acc.push(targetAccount);
        }
      }
      return acc;
    }, []);

    return accountBalances;
  };

  // Calculate account balances from transactions - following legacy accounts.js logic
  useEffect(() => {
    if (state.transactions.length === 0) return;

    // Following legacy accounts.js logic exactly
    const balances = {};
    let totalAssets = 0;
    let totalLiabilities = 0;

    // Calculate balance for each account - EXACTLY as in legacy code
    state.transactions.forEach(transaction => {
      const account = transaction.Account;
      const amount = parseFloat(transaction.INR);

      if (!balances[account]) {
        balances[account] = 0;
      }

      if (transaction['Income/Expense'] === 'Income') {
        balances[account] += amount;
      } else if (transaction['Income/Expense'] === 'Expense') {
        balances[account] -= amount;
      } else if (transaction['Income/Expense'] === 'Transfer-Out') {
        balances[account] -= amount;
        // Add to target account (Category field)
        const targetAccount = transaction.Category;
        if (!balances[targetAccount]) {
          balances[targetAccount] = 0;
        }
        balances[targetAccount] += amount;
      }
    });

    // Calculate totals - EXACTLY as in legacy code
    Object.values(balances).forEach(balance => {
      if (balance >= 0) {
        totalAssets += balance;
      } else {
        totalLiabilities += Math.abs(balance);
      }
    });

    setAccountBalances({
      accounts: balances,
      assets: totalAssets,
      liabilities: totalLiabilities,
      balance: totalAssets - totalLiabilities
    });
  }, [state.transactions]);

  // Filter transactions for selected account and current month
  useEffect(() => {
    if (!selectedAccount || state.transactions.length === 0) return;

    const filteredTransactions = state.transactions.filter(transaction => {
      const transactionDate = parseTransactionDate(transaction.Date);
      const matchesDate = transactionDate.getMonth() === currentDate.getMonth() && 
                         transactionDate.getFullYear() === currentDate.getFullYear();
      const matchesAccount = transaction.Account === selectedAccount || 
                           (transaction['Income/Expense'] === 'Transfer-Out' && transaction.Category === selectedAccount);
      
      return matchesDate && matchesAccount;
    });

    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => {
      const dateA = parseTransactionDate(a.Date);
      const dateB = parseTransactionDate(b.Date);
      return dateB - dateA;
    });

    setAccountTransactions(filteredTransactions);
  }, [selectedAccount, currentDate, state.transactions]);

  const handleAccountClick = (account) => {
    setSelectedAccount(account);
    setCurrentView('transactions');
  };

  const handleBackClick = () => {
    setSelectedAccount(null);
    setCurrentView('accounts');
    setCurrentDate(new Date());
  };

  const handleEditTransaction = async (updatedTransaction) => {
    try {
      const response = await transactionsAPI.update(updatedTransaction._id, updatedTransaction);
      
      if (response.success) {
        // Update the transaction in local state
        dispatch({ type: 'UPDATE_TRANSACTION', payload: updatedTransaction });
      } else {
        alert('Failed to update transaction: ' + response.message);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Error updating transaction');
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    try {
      const response = await transactionsAPI.delete(transaction._id);
      
      if (response.success) {
        // Remove from local state
        dispatch({ type: 'DELETE_TRANSACTION', payload: transaction._id });
      } else {
        alert('Failed to delete transaction: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Error deleting transaction');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'positive';
    if (balance < 0) return 'negative';
    return 'neutral';
  };

  const calculateMonthlyTotals = () => {
    let deposits = 0;
    let withdrawals = 0;

    // Following legacy accounts.js logic exactly
    accountTransactions.forEach(transaction => {
      const amount = parseFloat(transaction.INR);
      
      if (transaction['Income/Expense'] === 'Income') {
        deposits += amount;
      } else if (transaction['Income/Expense'] === 'Expense') {
        withdrawals += amount;
      } else if (transaction['Income/Expense'] === 'Transfer-Out') {
        if (transaction.Account === selectedAccount) {
          withdrawals += amount;
        }
        if (transaction.Category === selectedAccount) {
          deposits += amount;
        }
      }
    });

    return { deposits, withdrawals, total: deposits - withdrawals };
  };

  // Helper function to parse transaction dates correctly
  const parseTransactionDate = (dateString) => {
    // Handle DD/MM/YYYY format
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in Date constructor
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    
    // Fallback to original logic for other formats
    return new Date(dateString.split('/').reverse().join('-'));
  };

  // Calculate month-end balance for any specific month
  const calculateMonthEndBalanceForMonth = (targetMonth, targetYear) => {
    if (!selectedAccount) return 0;

    // Get the first and last day of the target month
    const firstDayOfMonth = new Date(targetYear, targetMonth, 1);
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0);
    
    // Get all transactions up to the end of the target month
    const transactionsUpToMonthEnd = state.transactions.filter(transaction => {
      const transactionDate = parseTransactionDate(transaction.Date);
      const isIncluded = transactionDate <= lastDayOfMonth && 
             (transaction.Account === selectedAccount || 
              (transaction['Income/Expense'] === 'Transfer-Out' && transaction.Category === selectedAccount));
      
      return isIncluded;
    });

    // Calculate the cumulative balance up to the end of the target month
    const balance = transactionsUpToMonthEnd.reduce((balance, transaction) => {
      const amount = parseFloat(transaction.INR);
      
      if (transaction.Account === selectedAccount) {
        if (transaction['Income/Expense'] === 'Income') {
          return balance + amount;
        } else if (transaction['Income/Expense'] === 'Expense') {
          return balance - amount;
        } else if (transaction['Income/Expense'] === 'Transfer-Out') {
          return balance - amount;
        }
      }
      
      if (transaction.Category === selectedAccount && transaction['Income/Expense'] === 'Transfer-Out') {
        return balance + amount;
      }
      
      return balance;
    }, 0);

    return balance;
  };

  const calculateMonthOpeningBalance = () => {
    if (!selectedAccount) return 0;

    // Get the previous month's end balance directly
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    let previousMonth, previousYear;
    
    if (currentMonth === 0) {
      // January - previous month is December of previous year
      previousMonth = 11;
      previousYear = currentYear - 1;
    } else {
      previousMonth = currentMonth - 1;
      previousYear = currentYear;
    }
    
    // Get the previous month's end balance
    const previousMonthEndBalance = calculateMonthEndBalanceForMonth(previousMonth, previousYear);
    
    return previousMonthEndBalance;
  };

  const calculateMonthEndBalance = () => {
    if (!selectedAccount) return 0;

    // Month End Balance should be: Opening Balance + (Deposits - Withdrawals)
    const openingBalance = calculateMonthOpeningBalance();
    const monthlyTotals = calculateMonthlyTotals();
    
    return openingBalance + monthlyTotals.deposits - monthlyTotals.withdrawals;
  };

  // Group transactions by day
  const groupTransactionsByDay = () => {
    const grouped = {};
    
    accountTransactions.forEach(transaction => {
      const date = parseTransactionDate(transaction.Date).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });

    return grouped;
  };

  // Render account groups with balances - following legacy accounts.js logic
  const renderAccountGroups = () => {
    const { accounts } = accountBalances;
    if (!accounts) return null;

    // Get accounts from transactions using legacy logic
    const transactionAccounts = getAccounts();

    // Group accounts by account groups
    const groupedAccounts = {};
    
    // Initialize groups from state
    state.accountGroups.forEach(group => {
      groupedAccounts[group.name] = [];
    });

    // Add unmapped accounts to a special group
    const mappedAccounts = Object.values(state.accountMapping || {}).flat();
    const unmappedAccounts = transactionAccounts.filter(account => !mappedAccounts.includes(account));
    
    if (unmappedAccounts.length > 0) {
      groupedAccounts['Other Accounts'] = unmappedAccounts;
    }

    // Map accounts to their groups
    Object.entries(state.accountMapping || {}).forEach(([groupName, accountList]) => {
      accountList.forEach(account => {
        if (transactionAccounts.includes(account)) {
          if (!groupedAccounts[groupName]) {
            groupedAccounts[groupName] = [];
          }
          groupedAccounts[groupName].push(account);
        }
      });
    });

    return Object.entries(groupedAccounts).map(([groupName, accountList]) => {
      if (accountList.length === 0) return null;

      return (
        <div key={groupName} className="account-group">
          <h3 className="group-title">{groupName}</h3>
          <div className="group-accounts">
            {accountList.map(account => {
              const balance = accounts[account] || 0;
              return (
                <div 
                  key={account} 
                  className="account-item"
                  onClick={() => handleAccountClick(account)}
                >
                  <div className="account-info">
                    <span className="account-name">{account}</span>
                    <span className={`account-balance ${getBalanceColor(balance)}`}>
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  if (currentView === 'transactions' && selectedAccount) {
    const monthlyTotals = calculateMonthlyTotals();
    const monthEndBalance = calculateMonthEndBalance();
    const monthOpeningBalance = calculateMonthOpeningBalance();
    const transactionsByDay = groupTransactionsByDay();

    return (
      <div className="accounts-page">
        <div className="accounts-header">
          <button className="back-button" onClick={handleBackClick}>
            <ArrowLeft size={20} />
            Back to Accounts
          </button>
          <h2>{selectedAccount}</h2>
        </div>

        <DateNavigation 
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        />

        <div className="account-summary">
          <div className="summary-item positive">
            <span>Opening Balance</span>
            <span>{formatCurrency(monthOpeningBalance)}</span>
          </div>
          <div className="summary-item positive">
            <span>Deposits</span>
            <span>{formatCurrency(monthlyTotals.deposits)}</span>
          </div>
          <div className="summary-item negative">
            <span>Withdrawals</span>
            <span>{formatCurrency(monthlyTotals.withdrawals)}</span>
          </div>
          <div className="summary-item">
            <span>Total</span>
            <span className={getBalanceColor(monthlyTotals.total)}>
              {formatCurrency(monthlyTotals.total)}
            </span>
          </div>
          <div className="summary-item positive">
            <span>Month End Balance</span>
            <span>{formatCurrency(monthEndBalance)}</span>
          </div>
        </div>

        <TransactionList
          transactions={accountTransactions}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          showAccount={true}
          showSubcategory={true}
          dayHeaderFormat="accounts"
          accountName={selectedAccount}
          accounts={state.accounts}
          categories={state.categories}
        />
      </div>
    );
  }

  return (
    <div className="accounts-page">
      <div className="accounts-header">
        <h2>Accounts</h2>
      </div>

      <div className="accounts-summary">
        <div className="summary-item positive">
          <span>Assets</span>
          <span>{formatCurrency(accountBalances.assets || 0)}</span>
        </div>
        <div className="summary-item negative">
          <span>Liabilities</span>
          <span>{formatCurrency(accountBalances.liabilities || 0)}</span>
        </div>
        <div className="summary-item">
          <span>Balance</span>
          <span className={getBalanceColor(accountBalances.balance || 0)}>
            {formatCurrency(accountBalances.balance || 0)}
          </span>
        </div>
      </div>

      <div className="accounts-list">
        {renderAccountGroups()}
        
        {/* Show ungrouped accounts from transactions */}
        {(() => {
          if (state.transactions.length === 0) return null;
          
          const transactionAccounts = getAccounts();
          const mappedAccounts = Object.values(state.accountMapping || {}).flat();
          const ungroupedAccounts = transactionAccounts.filter(account => !mappedAccounts.includes(account));
          
          if (ungroupedAccounts.length === 0) return null;
          
          return (
            <div className="account-group">
              <h3 className="group-title">Ungrouped Accounts (from transactions)</h3>
              <div className="group-accounts">
                {ungroupedAccounts.map(account => {
                  const balance = accountBalances.accounts?.[account] || 0;
                  return (
                    <div 
                      key={account} 
                      className="account-item"
                      onClick={() => handleAccountClick(account)}
                    >
                      <div className="account-info">
                        <span className="account-name">{account}</span>
                        <span className={`account-balance ${getBalanceColor(balance)}`}>
                          {formatCurrency(balance)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
        
        {Object.keys(accountBalances.accounts || {}).length === 0 && (
          <div className="no-accounts">
            <p>No accounts found. Add some transactions to see account balances.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Accounts;
