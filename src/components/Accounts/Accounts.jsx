import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { transactionsAPI } from '../../services/api';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import DateNavigation from '../Common/DateNavigation';

import TransactionList from '../Common/TransactionList';
import './Accounts.css';

const Accounts = () => {
  const { state, dispatch } = useApp();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [accountBalances, setAccountBalances] = useState({});
  const [accountTransactions, setAccountTransactions] = useState([]);

  // Calculate account balances from transactions
  useEffect(() => {
    if (state.transactions.length === 0) return;

    const balances = {};
    let totalAssets = 0;
    let totalLiabilities = 0;

    // Calculate balance for each account
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
        // Add to target account
        const targetAccount = transaction.Category;
        if (!balances[targetAccount]) {
          balances[targetAccount] = 0;
        }
        balances[targetAccount] += amount;
      }
    });

    // Calculate totals
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
      const transactionDate = new Date(transaction.Date.split('/').reverse().join('-'));
      const matchesDate = transactionDate.getMonth() === currentDate.getMonth() && 
                         transactionDate.getFullYear() === currentDate.getFullYear();
      const matchesAccount = transaction.Account === selectedAccount || 
                           (transaction['Income/Expense'] === 'Transfer-Out' && transaction.Category === selectedAccount);
      
      return matchesDate && matchesAccount;
    });

    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => {
      const dateA = new Date(a.Date.split('/').reverse().join('-'));
      const dateB = new Date(b.Date.split('/').reverse().join('-'));
      return dateB - dateA;
    });

    setAccountTransactions(filteredTransactions);
  }, [selectedAccount, currentDate, state.transactions]);

  const handleAccountClick = (account) => {
    setSelectedAccount(account);
  };

  const handleBackClick = () => {
    setSelectedAccount(null);
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

  const calculateMonthEndBalance = () => {
    if (!selectedAccount) return 0;

    const allTransactions = state.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.Date.split('/').reverse().join('-'));
      return transactionDate <= currentDate && 
             (transaction.Account === selectedAccount || 
              (transaction['Income/Expense'] === 'Transfer-Out' && transaction.Category === selectedAccount));
    });

    return allTransactions.reduce((balance, transaction) => {
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
  };

  // Group transactions by day
  const groupTransactionsByDay = () => {
    const grouped = {};
    
    accountTransactions.forEach(transaction => {
      const date = new Date(transaction.Date.split('/').reverse().join('-')).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });

    return grouped;
  };

  if (selectedAccount) {
    const monthlyTotals = calculateMonthlyTotals();
    const monthEndBalance = calculateMonthEndBalance();
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
            <span>Balance</span>
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
        {Object.entries(accountBalances.accounts || {}).map(([account, balance]) => (
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
        ))}
        
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
