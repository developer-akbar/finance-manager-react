import React, { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency, formatDate, convertDateFormat } from '../../utils/calculations';
import { Search, Filter, Edit2, Trash2, ArrowUpRight, ArrowDownLeft, ArrowLeft, ArrowRight, Calendar, BarChart3, TrendingUp } from 'lucide-react';
import TransactionFilters from './TransactionFilters';
import EditTransactionModal from './EditTransactionModal';
import './TransactionsList.css';

const TransactionsList = () => {
  const { state, deleteTransaction, dispatch } = useApp();
  const { transactions, searchTerm, filters } = state;
  
  const [showFilters, setShowFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentView, setCurrentView] = useState('daily'); // 'daily', 'monthly', 'total'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          transaction?.Category?.toLowerCase().includes(searchLower) ||
          transaction?.Subcategory?.toLowerCase().includes(searchLower) ||
          transaction?.Account?.toLowerCase().includes(searchLower) ||
          transaction?.Note?.toLowerCase().includes(searchLower) ||
          transaction?.Description?.toLowerCase().includes(searchLower)
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
        // Helper function to parse date using user's proven approach
        const parseDate = (dateStr) => {
          const convertedDate = convertDateFormat(dateStr);
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(convertedDate)) {
            const [day, month, year] = convertedDate.split('/');
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
          return new Date(dateStr);
        };
        
        filtered = filtered.filter(t => parseDate(t.Date) >= filterDate);
      }
    }

    // Sort transactions
    filtered.sort((a, b) => {
      // Helper function to parse date using user's proven approach
      const parseDate = (dateStr) => {
        const convertedDate = convertDateFormat(dateStr);
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(convertedDate)) {
          const [day, month, year] = convertedDate.split('/');
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        return new Date(dateStr);
      };
      
      switch (sortBy) {
        case 'date-desc':
          return parseDate(b.Date) - parseDate(a.Date);
        case 'date-asc':
          return parseDate(a.Date) - parseDate(b.Date);
        case 'amount-desc':
          return parseFloat(b.INR || b.Amount) - parseFloat(a.INR || a.Amount);
        case 'amount-asc':
          return parseFloat(a.INR || a.Amount) - parseFloat(b.INR || b.Amount);
        case 'category':
          return (a.Category || '').localeCompare(b.Category || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [transactions, searchTerm, filters, sortBy]);

  // Filter transactions based on current view
  const getViewTransactions = () => {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Helper function to parse date from DD/MM/YYYY format
    const parseDate = (dateStr) => {
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      return new Date(dateStr);
    };

    switch (currentView) {
      case 'daily':
        return filteredTransactions.filter(t => {
          const tDate = parseDate(t.Date);
          return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
        });
      case 'monthly':
        return filteredTransactions.filter(t => {
          const tDate = parseDate(t.Date);
          return tDate.getFullYear() === currentYear;
        });
      case 'total':
        return filteredTransactions;
      default:
        return filteredTransactions;
    }
  };

  const viewTransactions = getViewTransactions();

  // Calculate pagination
  const totalPages = Math.ceil(viewTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = viewTransactions.slice(startIndex, endIndex);

  // Calculate totals for current view
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    viewTransactions.forEach(t => {
      const amount = parseFloat(t.INR || t.Amount) || 0;
      if (t['Income/Expense'] === 'Income') {
        income += amount;
      } else if (t['Income/Expense'] === 'Expense') {
        expense += amount;
      }
    });
    
    return { income, expense, balance: income - expense };
  }, [viewTransactions]);

  // Get monthly data for current year
  const getMonthlyData = () => {
    const monthlyData = {};
    const currentYear = currentDate.getFullYear();
    
    // Helper function to parse date using user's proven approach
    const parseDate = (dateStr) => {
      const convertedDate = convertDateFormat(dateStr);
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(convertedDate)) {
        const [day, month, year] = convertedDate.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      return new Date(dateStr);
    };
    
    viewTransactions.forEach(t => {
      const tDate = parseDate(t.Date);
      if (tDate.getFullYear() === currentYear) {
        const monthKey = tDate.getMonth();
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expense: 0, count: 0 };
        }
        
        const amount = parseFloat(t.INR || t.Amount) || 0;
        if (t['Income/Expense'] === 'Income') {
          monthlyData[monthKey].income += amount;
        } else if (t['Income/Expense'] === 'Expense') {
          monthlyData[monthKey].expense += amount;
        }
        monthlyData[monthKey].count++;
      }
    });
    
    return monthlyData;
  };

  // Get yearly data
  const getYearlyData = () => {
    const yearlyData = {};
    
    // Helper function to parse date using user's proven approach
    const parseDate = (dateStr) => {
      const convertedDate = convertDateFormat(dateStr);
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(convertedDate)) {
        const [day, month, year] = convertedDate.split('/');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      return new Date(dateStr);
    };
    
    viewTransactions.forEach(t => {
      const tDate = parseDate(t.Date);
      const year = tDate.getFullYear();
      
      if (!yearlyData[year]) {
        yearlyData[year] = { income: 0, expense: 0, count: 0 };
      }
      
      const amount = parseFloat(t.INR || t.Amount) || 0;
      if (t['Income/Expense'] === 'Income') {
        yearlyData[year].income += amount;
      } else if (t['Income/Expense'] === 'Expense') {
        yearlyData[year].expense += amount;
      }
      yearlyData[year].count++;
    });
    
    return yearlyData;
  };

  const handleDelete = (transaction) => {
    if (window.confirm(`Are you sure you want to delete this ${transaction['Income/Expense'].toLowerCase()}?`)) {
      deleteTransaction(transaction.ID);
    }
  };

  const handleDateNavigation = (direction) => {
    const newDate = new Date(currentDate);
    
    switch (currentView) {
      case 'daily':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
      case 'monthly':
        newDate.setFullYear(newDate.getFullYear() + direction);
        break;
    }
    
    setCurrentDate(newDate);
    setCurrentPage(1);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    setCurrentPage(1);
  };

  const handleMonthClick = (month) => {
    setCurrentDate(new Date(currentDate.getFullYear(), month, 1));
    setCurrentView('daily');
    setCurrentPage(1);
  };

  const handleYearClick = (year) => {
    setCurrentDate(new Date(year, 0, 1));
    setCurrentView('monthly');
    setCurrentPage(1);
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'daily':
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'monthly':
        return currentDate.getFullYear().toString();
      case 'total':
        return 'All Time';
      default:
        return 'Transactions';
    }
  };

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortBy, currentView, currentDate]);

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

      {/* View Ribbons */}
      <div className="view-ribbons">
        <button
          className={`ribbon-btn ${currentView === 'daily' ? 'active' : ''}`}
          onClick={() => handleViewChange('daily')}
        >
          <Calendar size={16} />
          Daily
        </button>
        <button
          className={`ribbon-btn ${currentView === 'monthly' ? 'active' : ''}`}
          onClick={() => handleViewChange('monthly')}
        >
          <BarChart3 size={16} />
          Monthly
        </button>
        <button
          className={`ribbon-btn ${currentView === 'total' ? 'active' : ''}`}
          onClick={() => handleViewChange('total')}
        >
          <TrendingUp size={16} />
          Total
        </button>
      </div>

      {/* View Navigation */}
      <div className="view-navigation">
        <div className="view-title">
          <h2>{getViewTitle()}</h2>
          <div className="view-totals">
            <div className="total-item income">
              <span className="total-label">Income</span>
              <span className="total-value">{formatCurrency(totals.income)}</span>
            </div>
            <div className="total-item expense">
              <span className="total-label">Expense</span>
              <span className="total-value">{formatCurrency(totals.expense)}</span>
            </div>
            <div className={`total-item balance ${totals.balance >= 0 ? 'positive' : 'negative'}`}>
              <span className="total-label">Net Balance</span>
              <span className="total-value">
                {totals.balance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(totals.balance))}
              </span>
            </div>
          </div>
        </div>
        
        {(currentView === 'daily' || currentView === 'monthly') && (
          <div className="date-navigation">
            <button onClick={() => handleDateNavigation(-1)}>
              <ArrowLeft size={16} />
            </button>
            <span className="current-period">{getViewTitle()}</span>
            <button onClick={() => handleDateNavigation(1)}>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      {showFilters && <TransactionFilters />}

      {/* View Content */}
      {currentView === 'daily' && (
        <>
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
              Showing {startIndex + 1}-{Math.min(endIndex, viewTransactions.length)} of {viewTransactions.length} transactions
            </p>
          </div>

          <div className="transactions-table">
            {paginatedTransactions.length === 0 ? (
              <div className="no-transactions">
                <p>{searchTerm || Object.values(filters).some(f => f !== 'all') 
                  ? 'No transactions match your search criteria' 
                  : 'No transactions found for this month'}</p>
              </div>
            ) : (
              <>
                <div className="table-header">
                  <div className="header-cell date">Date</div>
                  <div className="header-cell category">Category/Account</div>
                  <div className="header-cell details">Details</div>
                  <div className="header-cell amount">Amount</div>
                </div>
                
                <div className="table-body">
                  {paginatedTransactions.map((transaction) => (
                    <div 
                      key={transaction.ID} 
                      className="table-row"
                      onClick={() => setEditingTransaction(transaction)}
                    >
                      <div className="cell date">
                        {formatDate(transaction.Date)}
                      </div>
                      <div className="cell category">
                        <div className="transaction-type">
                          {transaction['Income/Expense'] === 'Income' ? (
                            <ArrowUpRight className="income-icon" size={16} />
                          ) : transaction['Income/Expense'] === 'Expense' ? (
                            <ArrowDownLeft className="expense-icon" size={16} />
                          ) : (
                            <div className="transfer-icon">↔</div>
                          )}
                          <span className={`type-badge ${transaction['Income/Expense'].toLowerCase()}`}>
                            {transaction['Income/Expense']}
                          </span>
                        </div>
                        <div className="category-name">
                          {transaction['Income/Expense'] === 'Transfer-Out' 
                            ? `${transaction.FromAccount} → ${transaction.ToAccount}`
                            : transaction.Category || 'Uncategorized'
                          }
                        </div>
                      </div>
                      <div className="cell details">
                        <div className="note">{transaction.Note || 'No note'}</div>
                        <div className="description">{transaction.Description || 'No description'}</div>
                        <div className="account">Account: {transaction.Account}</div>
                      </div>
                      <div className="cell amount">
                        <span className={`amount-value ${transaction['Income/Expense'].toLowerCase()}`}>
                          {formatCurrency(transaction.INR || transaction.Amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
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
        </>
      )}

      {currentView === 'monthly' && (
        <div className="monthly-view">
          <div className="months-grid">
            {Array.from({ length: 12 }, (_, i) => {
              const monthData = getMonthlyData()[i] || { income: 0, expense: 0, count: 0 };
              const monthName = new Date(currentDate.getFullYear(), i, 1).toLocaleDateString('en-US', { month: 'short' });
              const netAmount = monthData.income - monthData.expense;
              
              return (
                <div 
                  key={i} 
                  className="month-card"
                  onClick={() => handleMonthClick(i)}
                >
                  <div className="month-name">{monthName}</div>
                  <div className="month-stats">
                    <div className="stat income">+{formatCurrency(monthData.income)}</div>
                    <div className="stat expense">-{formatCurrency(monthData.expense)}</div>
                    <div className={`stat net ${netAmount >= 0 ? 'positive' : 'negative'}`}>
                      {netAmount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netAmount))}
                    </div>
                  </div>
                  <div className="transaction-count">{monthData.count} transactions</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {currentView === 'total' && (
        <div className="total-view">
          <div className="years-grid">
            {Object.entries(getYearlyData())
              .sort(([a], [b]) => parseInt(b) - parseInt(a))
              .map(([year, data]) => {
                const netAmount = data.income - data.expense;
                
                return (
                  <div 
                    key={year} 
                    className="year-card"
                    onClick={() => handleYearClick(parseInt(year))}
                  >
                    <div className="year-name">{year}</div>
                    <div className="year-stats">
                      <div className="stat income">+{formatCurrency(data.income)}</div>
                      <div className="stat expense">-{formatCurrency(data.expense)}</div>
                      <div className={`stat net ${netAmount >= 0 ? 'positive' : 'negative'}`}>
                        {netAmount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netAmount))}
                      </div>
                    </div>
                    <div className="transaction-count">{data.count} transactions</div>
                  </div>
                );
              })}
          </div>
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