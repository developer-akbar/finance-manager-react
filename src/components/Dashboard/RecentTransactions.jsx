import React from 'react';
import api from '../../services/api';
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
      await api.transactions.update(transactionId, updatedData);
      dispatch({ type: 'UPDATE_TRANSACTION', payload: { id: transactionId, data: updatedData } });
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      await api.transactions.delete(transactionId);
      dispatch({ type: 'DELETE_TRANSACTION', payload: transactionId });
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