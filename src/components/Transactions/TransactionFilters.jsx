import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { X } from 'lucide-react';
import './TransactionFilters.css';

const TransactionFilters = () => {
  const { state, dispatch } = useApp();
  const { filters, accounts, categories } = state;

  const updateFilter = (key, value) => {
    dispatch({ type: 'SET_FILTERS', payload: { [key]: value } });
  };

  const clearFilters = () => {
    dispatch({
      type: 'SET_FILTERS',
      payload: {
        dateRange: 'all',
        account: 'all',
        category: 'all',
        type: 'all'
      }
    });
    dispatch({ type: 'SET_SEARCH_TERM', payload: '' });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== 'all') || state.searchTerm;

  return (
    <div className="transaction-filters">
      <div className="filters-header">
        <h3>Filters</h3>
        {hasActiveFilters && (
          <button className="clear-filters" onClick={clearFilters}>
            <X size={16} />
            Clear All
          </button>
        )}
      </div>

      <div className="filters-grid">
        <div className="filter-group">
          <label>Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => updateFilter('dateRange', e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Type</label>
          <select
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Account</label>
          <select
            value={filters.account}
            onChange={(e) => updateFilter('account', e.target.value)}
          >
            <option value="all">All Accounts</option>
            {accounts.map(account => (
              <option key={account} value={account}>{account}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Category</label>
          <select
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
          >
            <option value="all">All Categories</option>
            {Object.keys(categories).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;