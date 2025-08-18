import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatIndianCurrency, formatDate } from '../../utils/calculations';
import DateNavigation from '../Common/DateNavigation';
import CategoryChart from './CategoryChart';
import TrendingChart from './TrendingChart';

import TransactionList from '../Common/TransactionList';
import { transactionsAPI } from '../../services/api';
import { Edit, Trash2 } from 'lucide-react';
import './Categories.css';

const Categories = () => {
  const { state, refreshTransactions } = useApp();
  const { transactions, loading, error } = state;
  const [currentMainTab, setCurrentMainTab] = useState('expense');
  const [currentTab, setCurrentTab] = useState('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [isSubcategoryView, setIsSubcategoryView] = useState(false);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [categories, setCategories] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [trendingData, setTrendingData] = useState([]);

  // Helper function to parse date from DD/MM/YYYY format (same as Transactions page)
  const parseDate = (dateStr) => {
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return new Date(dateStr);
  };

  // Filter transactions based on current tab and date
  const getFilteredTransactions = () => {
    if (!transactions || transactions.length === 0) {
      console.log('No transactions available');
      return [];
    }

    console.log(`Filtering ${transactions.length} transactions for ${currentMainTab} in ${currentTab} view`);
    return transactions.filter(transaction => {
      const transactionDate = parseDate(transaction.Date);
      const isCorrectType = transaction["Income/Expense"] === (currentMainTab === 'expense' ? 'Expense' : 'Income');

      if (!isCorrectType) return false;

      switch (currentTab) {
        case 'monthly':
          return transactionDate.getMonth() === currentDate.getMonth() && 
                 transactionDate.getFullYear() === currentDate.getFullYear();
        case 'yearly':
          return transactionDate.getFullYear() === currentDate.getFullYear();
        case 'financial-yearly':
          const financialYearStart = currentDate.getMonth() >= 3 
            ? new Date(currentDate.getFullYear(), 3, 1)
            : new Date(currentDate.getFullYear() - 1, 3, 1);
          const financialYearEnd = new Date(financialYearStart);
          financialYearEnd.setFullYear(financialYearStart.getFullYear() + 1);
          financialYearEnd.setDate(financialYearEnd.getDate() - 1);
          return transactionDate >= financialYearStart && transactionDate <= financialYearEnd;
        case 'total':
          return true;
        default:
          return false;
      }
    });
  };

  // Calculate categories and totals
  const calculateCategories = () => {
    const filteredTransactions = getFilteredTransactions();
    const categoriesData = {};

    filteredTransactions.forEach(transaction => {
      const { Category, Subcategory, INR } = transaction;
      
      if (!categoriesData[Category]) {
        categoriesData[Category] = { total: 0, subcategories: {} };
      }
      
      categoriesData[Category].total += parseFloat(INR);
      
      if (Subcategory) {
        if (!categoriesData[Category].subcategories[Subcategory]) {
          categoriesData[Category].subcategories[Subcategory] = 0;
        }
        categoriesData[Category].subcategories[Subcategory] += parseFloat(INR);
      }
    });

    const total = Object.values(categoriesData).reduce((sum, category) => sum + category.total, 0);
    
    setCategories(categoriesData);
    setTotalAmount(total);
  };

  useEffect(() => {
    console.log('Categories component: transactions changed', transactions?.length);
    calculateCategories();
  }, [transactions, currentMainTab, currentTab, currentDate]);

  // Get stable HSL color for category indicators based on category name
  const getCategoryColor = (categoryName) => {
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  // Handle category click
  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    setSelectedSubcategory(null);
    setShowSubcategories(true);
    setIsSubcategoryView(true); // Show transactions immediately
  };

  // Handle subcategory click
  const handleSubcategoryClick = (subcategoryName) => {
    setSelectedSubcategory(subcategoryName === 'All' ? null : subcategoryName);
    // Keep transactions view active, just filter by subcategory
  };

  // Handle back to categories view
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setIsSubcategoryView(false);
    setShowSubcategories(false);
  };

  // Handle back to parent category
  const handleBackToParentCategory = () => {
    setSelectedSubcategory(null);
    setIsSubcategoryView(false);
  };

  // Reset category view when switching tabs
  useEffect(() => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setIsSubcategoryView(false);
    setShowSubcategories(false);
  }, [currentMainTab, currentTab]);

  // Handle edit transaction - this will be called by the integrated form in TransactionList
  const handleEditTransaction = async (updatedTransaction) => {
    try {
      await transactionsAPI.update(updatedTransaction._id, updatedTransaction);
      // Refresh data without page reload
      if (refreshTransactions) {
        refreshTransactions();
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Failed to update transaction');
    }
  };

  // Handle delete transaction - this will be called by the integrated form in TransactionList
  const handleDeleteTransaction = async (transaction) => {
    try {
      await transactionsAPI.delete(transaction._id);
      // Refresh data without page reload
      if (refreshTransactions) {
        refreshTransactions();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    }
  };



  // Get filtered transactions for selected category/subcategory
  const getSelectedTransactions = () => {
    const filteredTransactions = getFilteredTransactions();
    console.log('Filtering transactions for:', { selectedCategory, selectedSubcategory });
    console.log('Available transactions:', filteredTransactions.length);
    
    return filteredTransactions.filter(transaction => {
      const categoryMatch = transaction.Category === selectedCategory;
      const subcategoryMatch = !selectedSubcategory || transaction.Subcategory === selectedSubcategory;
      const matches = categoryMatch && subcategoryMatch;
      
      if (matches) {
        console.log('Matching transaction:', transaction);
      }
      
      return matches;
    });
  };

  // Group transactions by date
  const groupTransactionsByDate = (transactions) => {
    return transactions.reduce((acc, transaction) => {
      try {
        const date = parseDate(transaction.Date);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date for transaction:', transaction);
          return acc;
        }
        const dateString = date.toDateString();
        if (!acc[dateString]) {
          acc[dateString] = [];
        }
        acc[dateString].push(transaction);
      } catch (error) {
        console.error('Error parsing date for transaction:', transaction, error);
      }
      return acc;
    }, {});
  };

  // Calculate totals for transactions
  const calculateTotals = (transactions) => {
    return transactions.reduce((acc, transaction) => {
      if (transaction["Income/Expense"] === "Income") {
        acc.income += parseFloat(transaction.INR);
      } else {
        acc.expense += parseFloat(transaction.INR);
      }
      return acc;
    }, { income: 0, expense: 0 });
  };

  const selectedTransactions = getSelectedTransactions();
  const groupedTransactions = groupTransactionsByDate(selectedTransactions);

  // Calculate trending data for selected category/subcategory
  const calculateTrendingData = () => {
    if (!selectedCategory) return [];

    // Always show last 9 months trends regardless of current tab
    const allTransactions = transactions || [];
    const categoryTransactions = allTransactions.filter(transaction => {
      const categoryMatch = transaction.Category === selectedCategory;
      const subcategoryMatch = !selectedSubcategory || transaction.Subcategory === selectedSubcategory;
      return categoryMatch && subcategoryMatch;
    });

    // Group by month for consistent 9-month trend
    const periodGroups = {};
    
    categoryTransactions.forEach(transaction => {
      const transactionDate = parseDate(transaction.Date);
      const periodKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!periodGroups[periodKey]) {
        periodGroups[periodKey] = 0;
      }
      periodGroups[periodKey] += parseFloat(transaction.INR);
    });

    // Convert to array and sort by date, take last 9 months
    const trendingArray = Object.entries(periodGroups).map(([period, amount]) => ({
      date: period,
      amount: amount
    })).sort((a, b) => a.date.localeCompare(b.date)).slice(-9);

    setTrendingData(trendingArray);
  };

  useEffect(() => {
    calculateTrendingData();
  }, [selectedCategory, selectedSubcategory, currentTab, currentDate]);

  // Show loading state
  if (loading) {
    return (
      <div className="categories-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="categories-page">
        <div className="error-state">
          <p>Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="categories-page">
      <div className="categories-header">
        <h1>Categories</h1>
      </div>

      {/* Main Tabs */}
      <div className="main-tabs">
        <button 
          className={`main-tab-button ${currentMainTab === 'expense' ? 'active' : ''}`}
          onClick={() => setCurrentMainTab('expense')}
        >
          Expenses
        </button>
        <button 
          className={`main-tab-button ${currentMainTab === 'income' ? 'active' : ''}`}
          onClick={() => setCurrentMainTab('income')}
        >
          Income
        </button>
      </div>

      {/* Period Tabs */}
      <div className="period-tabs">
        <button 
          className={`period-tab-button ${currentTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setCurrentTab('monthly')}
        >
          Monthly
        </button>
        <button 
          className={`period-tab-button ${currentTab === 'yearly' ? 'active' : ''}`}
          onClick={() => setCurrentTab('yearly')}
        >
          Yearly
        </button>
        <button 
          className={`period-tab-button ${currentTab === 'financial-yearly' ? 'active' : ''}`}
          onClick={() => setCurrentTab('financial-yearly')}
        >
          FY
        </button>
        <button 
          className={`period-tab-button ${currentTab === 'total' ? 'active' : ''}`}
          onClick={() => setCurrentTab('total')}
        >
          Total
        </button>
      </div>

      {/* Date Navigation */}
      {currentTab !== 'total' && (
        <DateNavigation 
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          viewType={currentTab}
        />
      )}

      {/* Category Chart */}
      <CategoryChart categories={categories} totalAmount={totalAmount} />

                           {/* Categories Container */}
        {!showSubcategories && !isSubcategoryView ? (
          <div className="categories-container">
            {Object.keys(categories).length === 0 ? (
              <div className="no-categories">
                <p>No categories found for the selected period.</p>
                <p>Try switching between Expenses/Income or changing the time period.</p>
              </div>
            ) : (
              Object.keys(categories)
                .sort((a, b) => categories[b].total - categories[a].total)
                .map(categoryName => {
               const category = categories[categoryName];
               const percentage = totalAmount > 0 ? ((category.total / totalAmount) * 100).toFixed(2) : 0;
               
               return (
                 <div key={categoryName} className="category-card">
                   <div 
                     className="category-header"
                     onClick={() => handleCategoryClick(categoryName)}
                   >
                     <div className="category-indicator" style={{ backgroundColor: getCategoryColor(categoryName) }}>
                       {percentage}%
                     </div>
                     <div className="category-info">
                       <span className="category-name">{categoryName}</span>
                       <span className={`category-amount ${currentMainTab}`}>
                         {formatIndianCurrency(category.total)}
                       </span>
                     </div>
                     <div className="category-arrow">›</div>
                   </div>
                 </div>
               );
             })
           )}
         </div>
               ) : (
          /* Combined Subcategories and Transactions View */
          <div className="selected-category-view">
            <div className="category-back-header">
              <button className="back-button" onClick={handleBackToCategories}>
                ← Back to Categories
              </button>
              <h2 className="selected-category-title">
                {selectedCategory}
                {selectedSubcategory && (
                  <>
                    <span className="separator">›</span>
                    <span className="current-selection">{selectedSubcategory}</span>
                  </>
                )}
              </h2>
            </div>

            {/* Subcategories Container */}
            <div className="subcategories-container">
              <div 
                className={`subcategory-item all ${!selectedSubcategory ? 'active' : ''}`}
                onClick={() => handleSubcategoryClick('All')}
              >
                <div className="subcategory-indicator" style={{ backgroundColor: getCategoryColor(selectedCategory) }}>
                  100%
                </div>
                <span className="subcategory-name">All</span>
                <span className={`subcategory-amount ${currentMainTab}`}>
                  {formatIndianCurrency(categories[selectedCategory]?.total || 0)}
                </span>
              </div>
              {Object.keys(categories[selectedCategory]?.subcategories || {})
                .sort((a, b) => categories[selectedCategory].subcategories[b] - categories[selectedCategory].subcategories[a])
                .map(subcategoryName => {
                  const subcategoryAmount = categories[selectedCategory].subcategories[subcategoryName];
                  const subcategoryPercentage = categories[selectedCategory].total > 0 
                    ? ((subcategoryAmount / categories[selectedCategory].total) * 100).toFixed(2) 
                    : 0;
                  
                  return (
                    <div 
                      key={subcategoryName}
                      className={`subcategory-item ${selectedSubcategory === subcategoryName ? 'active' : ''}`}
                      onClick={() => handleSubcategoryClick(subcategoryName)}
                    >
                      <div className="subcategory-indicator" style={{ backgroundColor: getCategoryColor(subcategoryName) }}>
                        {subcategoryPercentage}%
                      </div>
                      <span className="subcategory-name">{subcategoryName}</span>
                      <span className={`subcategory-amount ${currentMainTab}`}>
                        {formatIndianCurrency(subcategoryAmount)}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Trending Chart */}
            <TrendingChart 
              data={trendingData}
              title={`${selectedCategory}${selectedSubcategory ? ` - ${selectedSubcategory}` : ''} Trends`}
              type={currentTab}
            />

            {/* Transactions Container */}
            <TransactionList
              transactions={Object.values(groupedTransactions).flat()}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              showAccount={false}
              showSubcategory={true}
              dayHeaderFormat="categories"
              accounts={state.accounts}
              categories={state.categories}
            />
          </div>
        )}


     </div>
   );
 };

export default Categories;
