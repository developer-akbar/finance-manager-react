import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { calculateTotals, getMonthlyData, getCategoryWiseData, formatCurrency } from '../../utils/calculations';
import SimpleChart from '../Charts/SimpleChart';
import { TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';
import './Analytics.css';

const Analytics = () => {
  const { state } = useApp();
  const { transactions } = state;
  
  const [timeframe, setTimeframe] = useState('all');
  const [chartType, setChartType] = useState('monthly');

  // Filter transactions based on timeframe
  const filteredTransactions = transactions.filter(transaction => {
    if (timeframe === 'all') return true;
    
    const transactionDate = new Date(transaction.Date);
    const now = new Date();
    
    switch (timeframe) {
      case 'year':
        return transactionDate.getFullYear() === now.getFullYear();
      case 'month':
        return transactionDate.getFullYear() === now.getFullYear() && 
               transactionDate.getMonth() === now.getMonth();
      case '3months':
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return transactionDate >= threeMonthsAgo;
      case '6months':
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return transactionDate >= sixMonthsAgo;
      default:
        return true;
    }
  });

  const totals = calculateTotals(filteredTransactions);
  const monthlyData = getMonthlyData(filteredTransactions);
  const expenseByCategory = getCategoryWiseData(filteredTransactions, 'Expense');
  const incomeByCategory = getCategoryWiseData(filteredTransactions, 'Income');

  // Prepare chart data
  const monthlyChartData = Object.entries(monthlyData)
    .sort()
    .slice(-12)
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense
    }));

  const expenseCategoryData = Object.entries(expenseByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([category, amount]) => ({ category, amount }));

  const incomeCategoryData = Object.entries(incomeByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([category, amount]) => ({ category, amount }));

  // Top spending categories (limit to top 3)
  const topExpenseCategories = Object.entries(expenseByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  // Monthly averages
  const monthCount = Object.keys(monthlyData).length || 1;
  const avgIncome = totals.income / monthCount;
  const avgExpense = totals.expense / monthCount;

  return (
    <div className="analytics">
      <div className="analytics-header">
        <h1>Analytics</h1>
        <div className="analytics-controls">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="timeframe-select"
          >
            <option value="all">All Time</option>
            <option value="year">This Year</option>
            <option value="6months">Last 6 Months</option>
            <option value="3months">Last 3 Months</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card income">
          <div className="card-icon">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <h3>Total Income</h3>
            <p className="amount">{formatCurrency(totals.income)}</p>
            <span className="average">Avg: {formatCurrency(avgIncome)}/month</span>
          </div>
        </div>

        <div className="summary-card expense">
          <div className="card-icon">
            <TrendingDown size={24} />
          </div>
          <div className="card-content">
            <h3>Total Expenses</h3>
            <p className="amount">{formatCurrency(totals.expense)}</p>
            <span className="average">Avg: {formatCurrency(avgExpense)}/month</span>
          </div>
        </div>

        <div className={`summary-card balance ${totals.balance >= 0 ? 'positive' : 'negative'}`}>
          <div className="card-icon">
            <BarChart3 size={24} />
          </div>
          <div className="card-content">
            <h3>Net Balance</h3>
            <p className="amount">{formatCurrency(totals.balance)}</p>
            <span className="average">
              {totals.balance >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="chart-controls">
        <div className="chart-type-selector">
          <button
            className={chartType === 'monthly' ? 'active' : ''}
            onClick={() => setChartType('monthly')}
          >
            <BarChart3 size={16} />
            Monthly Trends
          </button>
          <button
            className={chartType === 'expense-categories' ? 'active' : ''}
            onClick={() => setChartType('expense-categories')}
          >
            <PieChart size={16} />
            Expense by Category
          </button>
          <button
            className={chartType === 'income-categories' ? 'active' : ''}
            onClick={() => setChartType('income-categories')}
          >
            <TrendingUp size={16} />
            Income by Category
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-container">
        {chartType === 'monthly' && (
          <div className="chart-section">
            <h2>Monthly Financial Trends</h2>
            <SimpleChart 
              data={monthlyChartData}
              type="line"
              xKey="month"
              yKeys={['income', 'expense']}
              colors={['#65a30d', '#dc2626']}
            />
          </div>
        )}

        {chartType === 'expense-categories' && (
          <div className="chart-section">
            <h2>Expenses by Category</h2>
            <SimpleChart 
              data={expenseCategoryData}
              type="bar"
              xKey="category"
              yKeys={['amount']}
              colors={['#1e3a8a']}
            />
          </div>
        )}

        {chartType === 'income-categories' && (
          <div className="chart-section">
            <h2>Income by Source</h2>
            <SimpleChart 
              data={incomeCategoryData}
              type="bar"
              xKey="category"
              yKeys={['amount']}
              colors={['#65a30d']}
            />
          </div>
        )}
      </div>

      {/* Insights Section */}
      <div className="insights-section">
        <h2>Financial Insights</h2>
        
        <div className="insights-grid">
          <div className="insight-card">
            <h3>Top Spending Categories</h3>
            {topExpenseCategories.length > 0 ? (
              <ul className="top-categories">
                {topExpenseCategories.map(([category, amount], index) => (
                  <li key={category}>
                    <span className="rank">#{index + 1}</span>
                    <span className="category">{category}</span>
                    <span className="amount">{formatCurrency(amount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No expense data available</p>
            )}
          </div>

          <div className="insight-card">
            <h3>Savings Rate</h3>
            <div className="savings-rate">
              {totals.income > 0 ? (
                <>
                  <div className="rate-display">
                    <span className="percentage">
                      {((totals.balance / totals.income) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p>
                    {totals.balance >= 0 
                      ? 'Great job! You\'re saving money.' 
                      : 'You\'re spending more than you earn.'}
                  </p>
                </>
              ) : (
                <p>No income data available</p>
              )}
            </div>
          </div>

          <div className="insight-card">
            <h3>Transaction Summary</h3>
            <div className="transaction-stats">
              <div className="stat">
                <span className="label">Total Transactions:</span>
                <span className="value">{filteredTransactions.length}</span>
              </div>
              <div className="stat">
                <span className="label">Active Months:</span>
                <span className="value">{Object.keys(monthlyData).length}</span>
              </div>
              <div className="stat">
                <span className="label">Categories Used:</span>
                <span className="value">{Object.keys({...expenseByCategory, ...incomeByCategory}).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;