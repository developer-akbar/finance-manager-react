import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { calculateTotals, getMonthlyData, getCategoryWiseData, formatCurrency } from '../../utils/calculations';
import SummaryCards from './SummaryCards';
import RecentTransactions from './RecentTransactions';
import ChartsSection from './ChartsSection';
import './Dashboard.css';

const Dashboard = () => {
  const { state } = useApp();
  const { transactions } = state;

  const totals = calculateTotals(transactions);
  const monthlyData = getMonthlyData(transactions);
  const expenseByCategory = getCategoryWiseData(transactions, 'Expense');
  const incomeByCategory = getCategoryWiseData(transactions, 'Income');

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.Date) - new Date(a.Date))
    .slice(0, 5);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your financial overview</p>
      </div>

      <SummaryCards totals={totals} />
      
      <div className="dashboard-grid">
        <div className="dashboard-section">
          <ChartsSection 
            monthlyData={monthlyData}
            expenseByCategory={expenseByCategory}
            incomeByCategory={incomeByCategory}
          />
        </div>
        
        <div className="dashboard-section">
          <RecentTransactions transactions={recentTransactions} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;