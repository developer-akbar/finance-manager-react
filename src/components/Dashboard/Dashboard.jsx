import React, { useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { calculateTotals, getMonthlyData, getCategoryWiseData, formatCurrency, formatIndianCurrency } from '../../utils/calculations';
import SummaryCards from './SummaryCards';
import RecentTransactions from './RecentTransactions';
import ChartsSection from './ChartsSection';
import MonthlyTrends from './MonthlyTrends';
import YearlyAnalysis from './YearlyAnalysis';
import ExpenseInsights from './ExpenseInsights';
import './Dashboard.css';

const Dashboard = () => {
  const { state } = useApp();
  const { transactions } = state;

  // Calculate current month and previous month for comparison
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const isFirst10Days = currentDate.getDate() <= 10;
  const monthToShow = isFirst10Days ? currentMonth - 1 : currentMonth;
  const yearToShow = isFirst10Days && currentMonth === 0 ? currentYear - 1 : currentYear;

  // Calculate data for the month to show
  const monthData = useMemo(() => {
    return transactions.filter(transaction => {
      const date = new Date(transaction.Date.split('/').reverse().join('-'));
      return date.getMonth() === monthToShow && date.getFullYear() === yearToShow;
    });
  }, [transactions, monthToShow, yearToShow]);

  // Calculate previous month data for comparison
  const previousMonthData = useMemo(() => {
    const prevMonth = monthToShow === 0 ? 11 : monthToShow - 1;
    const prevYear = monthToShow === 0 ? yearToShow - 1 : yearToShow;
    
    return transactions.filter(transaction => {
      const date = new Date(transaction.Date.split('/').reverse().join('-'));
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    });
  }, [transactions, monthToShow, yearToShow]);

  // Calculate totals
  const currentMonthTotals = calculateTotals(monthData);
  const previousMonthTotals = calculateTotals(previousMonthData);
  const allTimeTotals = calculateTotals(transactions);

  // Calculate expense change percentage
  const expenseChangePercentage = previousMonthTotals.expense > 0 
    ? ((currentMonthTotals.expense - previousMonthTotals.expense) / previousMonthTotals.expense) * 100 
    : 0;

  // Calculate most spending category
  const categoryTotals = useMemo(() => {
    return monthData.reduce((acc, transaction) => {
      if (transaction['Income/Expense'] === 'Expense') {
        const category = transaction.Category;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += parseFloat(transaction.INR || transaction.Amount) || 0;
      }
      return acc;
    }, {});
  }, [monthData]);

  // Debug logging
  console.log('Dashboard Debug:', {
    monthData: monthData.length,
    categoryTotals,
    currentMonthTotals,
    monthToShow,
    yearToShow
  });

  const mostSpendingCategory = Object.keys(categoryTotals).length > 0 
    ? Object.keys(categoryTotals).reduce((a, b) => 
        categoryTotals[a] > categoryTotals[b] ? a : b
      )
    : 'No expenses';

  const mostSpendingPercentage = currentMonthTotals.expense > 0 && Object.keys(categoryTotals).length > 0
    ? (categoryTotals[mostSpendingCategory] / currentMonthTotals.expense) * 100 
    : 0;

  // Calculate average monthly and yearly spending
  const allExpenses = transactions.filter(t => t['Income/Expense'] === 'Expense');
  const totalExpensesAll = allExpenses.reduce((acc, t) => acc + (parseFloat(t.INR || t.Amount) || 0), 0);
  
  const uniqueMonths = new Set(transactions.map(t => {
    const date = new Date(t.Date.split('/').reverse().join('-'));
    return `${date.getFullYear()}-${date.getMonth()}`;
  })).size;
  
  const uniqueYears = new Set(transactions.map(t => {
    const date = new Date(t.Date.split('/').reverse().join('-'));
    return date.getFullYear();
  })).size;

  const avgMonthlySpending = uniqueMonths > 0 ? totalExpensesAll / uniqueMonths : 0;
  const avgYearlySpending = uniqueYears > 0 ? totalExpensesAll / uniqueYears : 0;

  // Calculate current month vs average comparison
  const currentMonthVsAverage = avgMonthlySpending > 0 
    ? ((currentMonthTotals.expense - avgMonthlySpending) / avgMonthlySpending) * 100 
    : 0;

  // Get recent transactions
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.Date.split('/').reverse().join('-')) - new Date(a.Date.split('/').reverse().join('-')))
    .slice(0, 5);

  // Get monthly data for charts
  const monthlyData = getMonthlyData(transactions);
  const expenseByCategory = getCategoryWiseData(transactions, 'Expense');
  const incomeByCategory = getCategoryWiseData(transactions, 'Income');

  const displayMonth = new Date(yearToShow, monthToShow);
  const monthLabel = `${isFirst10Days ? 'Previous Month\'s' : 'Current Month\'s'} (${displayMonth.toLocaleString('default', { month: 'short' })}, ${displayMonth.getFullYear()})`;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your financial overview for {monthLabel}</p>
      </div>

      {/* Summary Cards */}
      <SummaryCards 
        totals={currentMonthTotals} 
        expenseChange={expenseChangePercentage}
        currentMonthVsAverage={currentMonthVsAverage}
      />
      
      {/* Expense Insights */}
      <ExpenseInsights 
        mostSpendingCategory={mostSpendingCategory}
        mostSpendingPercentage={mostSpendingPercentage}
        avgMonthlySpending={avgMonthlySpending}
        avgYearlySpending={avgYearlySpending}
        currentMonthVsAverage={currentMonthVsAverage}
      />

      <div className="dashboard-grid">
        {/* Charts Section */}
        <div className="dashboard-section charts-section">
          <ChartsSection 
            monthlyData={monthlyData}
            expenseByCategory={expenseByCategory}
            incomeByCategory={incomeByCategory}
            monthLabel={monthLabel}
            categoryTotals={categoryTotals}
          />
        </div>
        
        {/* Recent Transactions */}
        <div className="dashboard-section">
          <RecentTransactions transactions={recentTransactions} />
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="dashboard-section full-width">
        <MonthlyTrends transactions={transactions} />
      </div>

      {/* Yearly Analysis */}
      <div className="dashboard-section full-width">
        <YearlyAnalysis transactions={transactions} />
      </div>
    </div>
  );
};

export default Dashboard;