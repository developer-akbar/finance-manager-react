import React from 'react';
import { formatIndianCurrency } from '../../utils/calculations';
import './CategoryChart.css';

const CategoryChart = ({ categories, totalAmount }) => {
  if (!categories || Object.keys(categories).length === 0) {
    return (
      <div className="category-chart-container">
        <div className="no-data-message">
          <p>No data available for the selected period</p>
        </div>
      </div>
    );
  }

  // Sort categories by amount (descending)
  const sortedCategories = Object.entries(categories)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 8); // Show top 8 categories

  // Calculate pie chart segments
  let currentAngle = 0;
  const segments = sortedCategories.map(([name, data], index) => {
    const percentage = totalAmount > 0 ? (data.total / totalAmount) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    // Generate stable color based on category name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    const color = `hsl(${hue}, 70%, 60%)`;

    return {
      name,
      total: data.total,
      percentage,
      startAngle,
      angle,
      color
    };
  });

  // Create SVG path for each segment
  const createArcPath = (startAngle, angle, radius = 80) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (startAngle + angle - 90) * (Math.PI / 180);
    
    const x1 = radius * Math.cos(startRad);
    const y1 = radius * Math.sin(startRad);
    const x2 = radius * Math.cos(endRad);
    const y2 = radius * Math.sin(endRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    return [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'L 0 0'
    ].join(' ');
  };

  return (
    <div className="category-chart-container">
      <div className="chart-header">
        <h3>Category Distribution</h3>
                 <div className="total-display">
           <span className="total-label">Total</span>
           <span className="total-value">{formatIndianCurrency(totalAmount)}</span>
         </div>
      </div>
      
      <div className="chart-content">
        <div className="pie-chart">
          <svg width="200" height="200" viewBox="-100 -100 200 200">
            {segments.map((segment, index) => (
              <path
                key={segment.name}
                d={createArcPath(segment.startAngle, segment.angle)}
                fill={segment.color}
                stroke="var(--background-primary)"
                strokeWidth="2"
                className="chart-segment"
                data-category={segment.name}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  opacity: segment.percentage === 100 ? 1 : 1 // Ensure 100% segments are not transparent
                }}
              />
            ))}
          </svg>
          <div className="chart-center">
            <div className="center-text">
              <span className="center-percentage">
                {segments.length > 0 ? segments[0].percentage.toFixed(1) : 0}%
              </span>
              <span className="center-category">
                {segments.length > 0 ? segments[0].name : 'No Data'}
              </span>
            </div>
          </div>
        </div>
        
        {/* <div className="chart-legend">
          {segments.map((segment, index) => (
            <div 
              key={segment.name} 
              className="legend-item"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div 
                className="legend-color" 
                style={{ backgroundColor: segment.color }}
              />
                             <div className="legend-info">
                 <span className="legend-name">{segment.name}</span>
                 <span className="legend-amount">{formatIndianCurrency(segment.total)}</span>
               </div>
              <span className="legend-percentage">{segment.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div> */}
      </div>
    </div>
  );
};

export default CategoryChart;
