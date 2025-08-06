import React, { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency, formatDate } from '../../utils/calculations';
import { Search, Filter, Edit2, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import TransactionFilters from './TransactionFilters';
import EditTransactionModal from './EditTransactionModal';
import './TransactionsList.css';

const TransactionsList = () => {
  const { state, deleteTransaction, dispatch } = useApp();
  const { transactions, searchTerm, filters } = state;
  
  const [showFilters, setShowFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          transaction.Category.toLowerCase().includes(searchLower) ||
          transaction.Subcategory.toLowerCase().includes(searchLower) ||
          transaction.Account.toLowerCase().includes(searchLower) ||
          transaction.Note.toLowerCase().includes(searchLower) ||
          transaction.Description.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });

    // Apply filters
    if (filters.account !== 'all') {
      filtered = filtered.filter(t => t.Account === filters.account);
    }
    
    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.Category === filters.category);
    }
    
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t['Income/Expense'] === filters.type);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          filterDate = null;
      }
      
      if (filterDate) {
        filtered = filtered.filter(t => new Date(t.Date) >= filterDate);
      }
    }

    // Sort transactions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.Date) - new Date(a.Date);
        case 'date-asc':
          return new Date(a.Date) - new Date(b.Date);
        case 'amount-desc':
          return parseFloat(b.Amount) - parseFloat(a.Amount);
        case 'amount-asc':
          return parseFloat(a.Amount) - parseFloat(b.Amount);
        case 'category':
          return a.Category.localeCompare(b.Category);
        default:
          return 0;
      }
    });

    return filtered;
  }, [transactions, searchTerm, filters, sortBy]);

  const handleDelete = (transaction) => {
    if (window.confirm(`Are you sure you want to delete this ${transaction['Income/Expense'].toLowerCase()}?`)) {
      deleteTransaction(transaction.ID);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const totalAmount = filteredTransactions.reduce((sum, t) => {
    return sum + (t['Income/Expense'] === 'Income' ? parseFloat(t.Amount) : -parseFloat(t.Amount));
  }, 0);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortBy]);

  return (
    <div className="transactions-list">
      <div className="page-header">
        <h1>Transactions</h1>
        <div className="header-actions">
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
          </button>
        </div>
      </div>

      {showFilters && <TransactionFilters />}

      <div className="transactions-controls">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })}
          />
        </div>

        <div className="sort-controls">
          <label htmlFor="sort">Sort by:</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="amount-desc">Amount (High to Low)</option>
            <option value="amount-asc">Amount (Low to High)</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>

      <div className="transactions-summary">
        <p>
          Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
          {filteredTransactions.length > 0 && (
            <span className={`total-amount ${totalAmount >= 0 ? 'positive' : 'negative'}`}>
              Total: {formatCurrency(Math.abs(totalAmount))} 
              {totalAmount >= 0 ? ' (Net Income)' : ' (Net Expense)'}
            </span>
          )}
        </p>
      </div>

      <div className="transactions-grid">
        {filteredTransactions.length === 0 ? (
          <div className="no-transactions">
            <p>{searchTerm || Object.values(filters).some(f => f !== 'all') 
              ? 'No transactions match your search criteria' 
              : 'No transactions found'}</p>
          </div>
        ) : (
          paginatedTransactions.map((transaction) => (
            <div key={transaction.ID} className="transaction-card">
              <div className="transaction-header">
                <div className="transaction-type">
                  {transaction['Income/Expense'] === 'Income' ? (
                    <ArrowUpRight className="income-icon" size={20} />
                  ) : (
                    <ArrowDownLeft className="expense-icon" size={20} />
                  )}
                  <span className={`type-badge ${transaction['Income/Expense'].toLowerCase()}`}>
                    {transaction['Income/Expense']}
                  </span>
                </div>
                
                <div className="transaction-actions">
                  <button
                    className="edit-btn"
                    onClick={() => setEditingTransaction(transaction)}
                    title="Edit transaction"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(transaction)}
                    title="Delete transaction"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="transaction-details">
                <div className="main-info">
                  <h3>{transaction.Category}</h3>
                  {transaction.Subcategory && (
                    <p className="subcategory">{transaction.Subcategory}</p>
                  )}
                  <div className={`amount ${transaction['Income/Expense'].toLowerCase()}`}>
                    {formatCurrency(transaction.Amount)}
                  </div>
                </div>

                <div className="meta-info">
                  <div className="info-row">
                    <span className="label">Account:</span>
                    <span className="value">{transaction.Account}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Date:</span>
                    <span className="value">{formatDate(transaction.Date)}</span>
                  </div>
                  {transaction.Note && (
                    <div className="info-row">
                      <span className="label">Note:</span>
                      <span className="value">{transaction.Note}</span>
                    </div>
                  )}
                  {transaction.Description && (
                    <div className="info-row description">
                      <span className="label">Description:</span>
                      <span className="value">{transaction.Description}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </div>
  );
};

export default TransactionsList;