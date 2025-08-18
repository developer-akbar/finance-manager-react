import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatIndianCurrency } from '../../utils/calculations';
import './MonthlyTrends.css';

const MonthlyTrends = ({ transactions }) => {
  const monthlyData = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Get last 6 months data
    const months = [];
    const incomeTrends = [];
    const expenseTrends = [];
    
    for (let i = currentMonth; i > currentMonth - 6; i--) {
      const month = i < 0 ? i + 12 : i;
      const year = i < 0 ? currentYear - 1 : currentYear;
      
      const monthTransactions = transactions.filter(transaction => {
        const date = new Date(transaction.Date.split('/').reverse().join('-'));
        return date.getMonth() === month && date.getFullYear() === year;
      });
      
      const monthTotals = monthTransactions.reduce((acc, transaction) => {
        const amount = parseFloat(transaction.INR || transaction.Amount) || 0;
        if (transaction['Income/Expense'] === 'Income') {
          acc.income += amount;
        } else if (transaction['Income/Expense'] === 'Expense') {
          acc.expense += amount;
        }
        return acc;
      }, { income: 0, expense: 0 });
      
      const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short' });
      
      months.push(monthName);
      incomeTrends.push(monthTotals.income);
      expenseTrends.push(monthTotals.expense);
    }
    
    return months.map((month, index) => ({
      month,
      income: incomeTrends[index],
      expense: expenseTrends[index],
      net: incomeTrends[index] - expenseTrends[index]
    }));
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="trends-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatIndianCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="monthly-trends">
      <div className="trends-header">
        <h2>Monthly Trends</h2>
        <p>Income vs Expenses over the last 6 months</p>
      </div>

      <div className="trends-chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
            <XAxis 
              dataKey="month" 
              stroke="var(--text-secondary)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--text-secondary)"
              fontSize={12}
              tickFormatter={(value) => formatIndianCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="income" 
              fill="var(--accent-success)" 
              name="Income"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="expense" 
              fill="var(--accent-danger)" 
              name="Expenses"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Summary */}
      <div className="monthly-summary">
        <div className="summary-grid">
          {monthlyData.map((data, index) => (
            <div key={index} className="month-summary-card">
              <div className="month-header">
                <h3>{data.month}</h3>
                <div className={`net-indicator ${data.net >= 0 ? 'positive' : 'negative'}`}>
                  {data.net >= 0 ? '+' : ''}{formatIndianCurrency(data.net)}
                </div>
              </div>
              <div className="month-details">
                <div className="detail-item income">
                  <span className="label">Income</span>
                  <span className="value">{formatIndianCurrency(data.income)}</span>
                </div>
                <div className="detail-item expense">
                  <span className="label">Expenses</span>
                  <span className="value">{formatIndianCurrency(data.expense)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonthlyTrends;
