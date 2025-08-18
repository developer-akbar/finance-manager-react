import React, { useMemo } from 'react';
import { formatIndianCurrency } from '../../utils/calculations';
import './YearlyAnalysis.css';

const YearlyAnalysis = ({ transactions }) => {
  const yearlyData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    
    // Group transactions by year
    const transactionsByYear = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.Date.split('/').reverse().join('-'));
      const year = date.getFullYear();
      
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(transaction);
      return acc;
    }, {});
    
    // Calculate yearly totals and averages
    const yearlyAnalysis = Object.keys(transactionsByYear).map(year => {
      const yearTransactions = transactionsByYear[year];
      const yearlyTotal = yearTransactions
        .filter(t => t['Income/Expense'] === 'Expense')
        .reduce((acc, t) => acc + (parseFloat(t.INR || t.Amount) || 0), 0);
      
      const monthlyAverage = yearlyTotal / 12;
      
      return {
        year: parseInt(year),
        yearlyTotal,
        monthlyAverage,
        isCurrentYear: parseInt(year) === currentYear,
        isFutureYear: parseInt(year) > currentYear
      };
    }).sort((a, b) => b.year - a.year);
    
    // Calculate overall totals
    const totalExpensesAcrossYears = yearlyAnalysis.reduce((acc, year) => acc + year.yearlyTotal, 0);
    const totalMonths = yearlyAnalysis.length * 12;
    const overallMonthlyAverage = totalMonths > 0 ? totalExpensesAcrossYears / totalMonths : 0;
    
    return {
      yearlyAnalysis,
      totalExpensesAcrossYears,
      overallMonthlyAverage
    };
  }, [transactions]);

  return (
    <div className="yearly-analysis">
      <div className="analysis-header">
        <h2>Yearly Analysis</h2>
        <p>Comprehensive yearly spending breakdown</p>
      </div>

      <div className="analysis-container">
        {/* Header Row */}
        <div className="analysis-row header">
          <div className="year-column">Year</div>
          <div className="total-column">Yearly Spendings</div>
          <div className="average-column">Monthly Average</div>
        </div>

        {/* Yearly Data Rows */}
        {yearlyData.yearlyAnalysis.map((yearData, index) => (
          <div 
            key={yearData.year} 
            className={`analysis-row ${yearData.isCurrentYear ? 'current-year' : ''} ${yearData.isFutureYear ? 'future-year' : ''}`}
          >
            <div className="year-column">
              <span className="year-label">{yearData.year}</span>
              {yearData.isCurrentYear && <span className="current-badge">Current</span>}
            </div>
            <div className="total-column">
              {formatIndianCurrency(yearData.yearlyTotal)}
            </div>
            <div className="average-column">
              {formatIndianCurrency(yearData.monthlyAverage)}
            </div>
          </div>
        ))}

        {/* Total Row */}
        <div className="analysis-row total">
          <div className="year-column">
            <span className="total-label">Total</span>
          </div>
          <div className="total-column">
            <span className="total-value">{formatIndianCurrency(yearlyData.totalExpensesAcrossYears)}</span>
          </div>
          <div className="average-column">
            <span className="total-value">{formatIndianCurrency(yearlyData.overallMonthlyAverage)}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="yearly-summary">
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h3>Total Years</h3>
              <div className="card-value">{yearlyData.yearlyAnalysis.length}</div>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <h3>Total Spent</h3>
              <div className="card-value">{formatIndianCurrency(yearlyData.totalExpensesAcrossYears)}</div>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="card-icon">📅</div>
            <div className="card-content">
              <h3>Avg Monthly</h3>
              <div className="card-value">{formatIndianCurrency(yearlyData.overallMonthlyAverage)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearlyAnalysis;
