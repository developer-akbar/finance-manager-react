import React from 'react';
import { useApp } from '../../contexts/AppContext';
import TransactionList from '../Common/TransactionList';
import './RecentTransactions.css';

const RecentTransactions = ({ transactions }) => {
  const { state, dispatch } = useApp();

  const handleViewAll = () => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'transactions' });
  };

  const handleEditTransaction = async (transactionId, updatedData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        dispatch({ type: 'UPDATE_TRANSACTION', payload: { id: transactionId, data: updatedData } });
      } else {
        console.error('Failed to update transaction');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        dispatch({ type: 'DELETE_TRANSACTION', payload: transactionId });
      } else {
        console.error('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  return (
    <div className="recent-transactions">
      <div className="section-header">
        <h2>Recent Transactions</h2>
        <button className="view-all-btn" onClick={handleViewAll}>
          View All
        </button>
      </div>

      <div className="transactions-container">
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
          <TransactionList
            transactions={transactions}
            accounts={state.accounts}
            categories={state.categories}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            showPagination={false}
            maxHeight="400px"
          />
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;