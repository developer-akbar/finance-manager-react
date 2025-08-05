import React from 'react';
import SimpleChart from '../Charts/SimpleChart';
import './ChartsSection.css';

const ChartsSection = ({ monthlyData, expenseByCategory, incomeByCategory }) => {
  // Prepare monthly chart data
  const monthlyChartData = Object.entries(monthlyData)
    .sort()
    .slice(-6) // Last 6 months
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      income: data.income,
      expense: data.expense
    }));

  // Prepare category chart data (top 5 categories)
  const expenseCategoryData = Object.entries(expenseByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }));

  const incomeCategoryData = Object.entries(incomeByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }));

  return (
    <div className="charts-section">
      <h2>Financial Overview</h2>
      
      <div className="charts-grid">
        <div className="chart-container">
          <h3>Monthly Trends</h3>
          <SimpleChart 
            data={monthlyChartData}
            type="line"
            xKey="month"
            yKeys={['income', 'expense']}
            colors={['#65a30d', '#dc2626']}
          />
        </div>

        <div className="chart-container">
          <h3>Expense Categories</h3>
          <SimpleChart 
            data={expenseCategoryData}
            type="bar"
            xKey="category"
            yKeys={['amount']}
            colors={['#1e3a8a']}
          />
        </div>

        <div className="chart-container">
          <h3>Income Sources</h3>
          <SimpleChart 
            data={incomeCategoryData}
            type="bar"
            xKey="category"
            yKeys={['amount']}
            colors={['#65a30d']}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;