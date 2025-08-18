import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatIndianCurrency } from '../../utils/calculations';
import './ChartsSection.css';

const ChartsSection = ({ monthlyData, expenseByCategory, incomeByCategory, monthLabel, categoryTotals }) => {
  // Prepare monthly chart data
  const monthlyChartData = Object.entries(monthlyData)
    .sort()
    .slice(-6) // Last 6 months
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      income: data.income,
      expense: data.expense
    }));

  // Prepare monthly category spending data
  const monthlyCategoryData = Object.entries(categoryTotals || {}).map(([category, amount]) => ({
    name: category,
    value: amount
  }));

  // Prepare total category spending data
  const totalCategoryData = Object.entries(expenseByCategory).map(([category, amount]) => ({
    name: category,
    value: amount
  }));

  // Generate colors for pie charts
  const generateColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(`hsl(${i * 30}, 100%, 75%)`);
    }
    return colors;
  };

  const monthlyColors = generateColors(monthlyCategoryData.length);
  const totalColors = generateColors(totalCategoryData.length);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = monthlyCategoryData.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((data.value / total) * 100).toFixed(2);
      
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{data.name}</p>
          <p className="tooltip-value">{formatIndianCurrency(data.value)}</p>
          <p className="tooltip-percentage">({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  const TotalTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = totalCategoryData.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((data.value / total) * 100).toFixed(2);
      
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{data.name}</p>
          <p className="tooltip-value">{formatIndianCurrency(data.value)}</p>
          <p className="tooltip-percentage">({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="charts-section">
      <div className="charts-header">
        <h2>Financial Charts</h2>
        <p>Visual insights into your spending patterns</p>
      </div>
      
      <div className="charts-grid">
        <div className="chart-container">
          <h3>{monthLabel} Category Spendings</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={monthlyCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {monthlyCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={monthlyColors[index % monthlyColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container">
          <h3>Total Category Spendings</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={totalCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {totalCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={totalColors[index % totalColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<TotalTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;