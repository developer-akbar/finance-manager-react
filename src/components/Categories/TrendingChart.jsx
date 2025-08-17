import React from 'react';
import { formatIndianCurrency } from '../../utils/calculations';
import './TrendingChart.css';

const TrendingChart = ({ data, title, type }) => {
  if (!data || data.length === 0) {
    return (
      <div className="trending-chart">
        <div className="chart-header">
          <h3>{title}</h3>
        </div>
        <div className="no-data">
          <p>No trending data available</p>
        </div>
      </div>
    );
  }

  // Sort data in ascending order and take last 9 items
  const sortedData = [...data]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-9);

  const maxAmount = Math.max(...sortedData.map(item => item.amount));

  return (
    <div className="trending-chart">
      <div className="chart-header">
        <h3>{title}</h3>
        <div className="chart-info">
          <span className="total-amount">
            {formatIndianCurrency(sortedData.reduce((sum, item) => sum + item.amount, 0))}
          </span>
          <span className="period-label">Last 9 periods</span>
        </div>
      </div>
      
      <div className="chart-container">
        <div className="chart-bars">
          {sortedData.map((item, index) => {
            const height = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
            const isPositive = item.amount >= 0;
            
            return (
              <div key={index} className="chart-bar-group">
                <div className="bar-container">
                  <div 
                    className={`chart-bar ${isPositive ? 'positive' : 'negative'}`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <div className="bar-label">
                  <span className="amount">{formatIndianCurrency(item.amount)}</span>
                  <span className="date">{item.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrendingChart;
