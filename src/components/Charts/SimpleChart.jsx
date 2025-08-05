import React from 'react';
import { formatCurrency } from '../../utils/calculations';
import './SimpleChart.css';

const SimpleChart = ({ data, type, xKey, yKeys, colors }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.flatMap(item => 
    yKeys.map(key => item[key] || 0)
  ));

  if (type === 'bar') {
    return (
      <div className="simple-chart bar-chart">
        {data.map((item, index) => (
          <div key={index} className="bar-item">
            <div className="bar-container">
              {yKeys.map((yKey, yIndex) => (
                <div
                  key={yKey}
                  className="bar"
                  style={{
                    height: `${(item[yKey] / maxValue) * 100}%`,
                    backgroundColor: colors[yIndex] || colors[0]
                  }}
                  title={`${item[xKey]}: ${formatCurrency(item[yKey])}`}
                />
              ))}
            </div>
            <div className="bar-label">{item[xKey]}</div>
            <div className="bar-value">{formatCurrency(item[yKeys[0]])}</div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div className="simple-chart line-chart">
        <div className="chart-grid">
          {data.map((item, index) => (
            <div key={index} className="line-item">
              <div className="line-bars">
                {yKeys.map((yKey, yIndex) => (
                  <div key={yKey} className="line-bar-container">
                    <div
                      className="line-bar"
                      style={{
                        height: `${(item[yKey] / maxValue) * 100}%`,
                        backgroundColor: colors[yIndex]
                      }}
                      title={`${yKey}: ${formatCurrency(item[yKey])}`}
                    />
                  </div>
                ))}
              </div>
              <div className="line-label">{item[xKey]}</div>
            </div>
          ))}
        </div>
        
        <div className="chart-legend">
          {yKeys.map((yKey, index) => (
            <div key={yKey} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: colors[index] }}
              />
              <span>{yKey}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default SimpleChart;