import React from 'react';
import { TrendingUp, TrendingDown, Target, Calendar, BarChart3 } from 'lucide-react';
import { formatIndianCurrency } from '../../utils/calculations';
import './ExpenseInsights.css';

const ExpenseInsights = ({ 
  mostSpendingCategory, 
  mostSpendingPercentage, 
  avgMonthlySpending, 
  avgYearlySpending,
  currentMonthVsAverage 
}) => {
  const insights = [
    {
      title: 'Most Spending Category',
      value: mostSpendingCategory === 'No expenses' ? 'No expenses this month' : mostSpendingCategory,
      subtitle: mostSpendingCategory === 'No expenses' 
        ? 'No expense transactions found' 
        : `${mostSpendingPercentage.toFixed(1)}% of total expenses`,
      icon: BarChart3,
      className: 'category-insight'
    },
    {
      title: 'Average Monthly Spending',
      value: formatIndianCurrency(avgMonthlySpending),
      subtitle: 'Based on all-time data',
      icon: Calendar,
      className: 'monthly-insight'
    },
    {
      title: 'Average Yearly Spending',
      value: formatIndianCurrency(avgYearlySpending),
      subtitle: 'Based on all-time data',
      icon: Target,
      className: 'yearly-insight'
    }
  ];

  return (
    <div className="expense-insights">
      <div className="insights-header">
        <h2>Expense Insights</h2>
        <p>Key metrics and spending patterns</p>
      </div>

      <div className="insights-grid">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div key={index} className={`insight-card ${insight.className}`}>
              <div className="insight-icon">
                <Icon size={20} />
              </div>
              <div className="insight-content">
                <h3>{insight.title}</h3>
                <div className="insight-value">{insight.value}</div>
                <p className="insight-subtitle">{insight.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Spending Comparison */}
      <div className="spending-comparison">
        <div className="comparison-header">
          <h3>Spending Analysis</h3>
        </div>
        
        <div className="comparison-content">
          <div className="comparison-item">
            <div className="comparison-label">vs Previous Month</div>
            <div className={`comparison-value ${currentMonthVsAverage > 0 ? 'negative' : 'positive'}`}>
              {currentMonthVsAverage > 0 ? (
                <>
                  <TrendingUp size={16} />
                  {currentMonthVsAverage.toFixed(1)}% more
                </>
              ) : (
                <>
                  <TrendingDown size={16} />
                  {Math.abs(currentMonthVsAverage).toFixed(1)}% less
                </>
              )}
            </div>
          </div>
          
          <div className="comparison-item">
            <div className="comparison-label">vs Average Monthly</div>
            <div className={`comparison-value ${currentMonthVsAverage > 0 ? 'negative' : 'positive'}`}>
              {currentMonthVsAverage > 0 ? (
                <>
                  <TrendingUp size={16} />
                  {currentMonthVsAverage.toFixed(1)}% above average
                </>
              ) : (
                <>
                  <TrendingDown size={16} />
                  {Math.abs(currentMonthVsAverage).toFixed(1)}% below average
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseInsights;
