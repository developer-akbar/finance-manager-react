import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency, formatDate } from '../../utils/calculations';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import './RecentTransactions.css';

const RecentTransactions = ({ transactions }) => {
  const { dispatch } = useApp();

  const handleViewAll = () => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'transactions' });
  };

  return (
    <div className="recent-transactions">
      <div className="section-header">
        <h2>Recent Transactions</h2>
        <button className="view-all-btn" onClick={handleViewAll}>
          View All
        </button>
      </div>

      <div className="transactions-list">
        {transactions.length === 0 ? (
          <div className="no-transactions">
            <p>No transactions yet</p>
            <button 
              className="add-transaction-btn"
              onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: 'add-transaction' })}
            >
              Add Your First Transaction
            </button>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.ID} className="transaction-item">
              <div className="transaction-icon">
                {transaction['Income/Expense'] === 'Income' ? (
                  <ArrowUpRight className="income-icon" size={20} />
                ) : (
                  <ArrowDownLeft className="expense-icon" size={20} />
                )}
              </div>
              
              <div className="transaction-details">
                <div className="transaction-main">
                  <span className="category">{transaction.Category}</span>
                  <span className="subcategory">{transaction.Subcategory}</span>
                </div>
                <div className="transaction-meta">
                  <span className="account">{transaction.Account}</span>
                  <span className="date">{formatDate(transaction.Date)}</span>
                </div>
                {transaction.Note && (
                  <div className="transaction-note">{transaction.Note}</div>
                )}
              </div>
              
              <div className={`transaction-amount ${transaction['Income/Expense'].toLowerCase()}`}>
                {transaction['Income/Expense'] === 'Income' ? '+' : '-'}
                {formatCurrency(transaction.Amount)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;