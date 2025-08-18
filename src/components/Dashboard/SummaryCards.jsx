import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Percent } from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';
import './SummaryCards.css';

const SummaryCards = ({ totals, expenseChange, currentMonthVsAverage }) => {
  const cards = [
    {
      title: 'Income',
      amount: totals.income,
      icon: TrendingUp,
      className: 'income',
      color: '#65a30d'
    },
    {
      title: 'Expenses',
      amount: totals.expense,
      icon: TrendingDown,
      className: 'expense',
      color: '#dc2626',
      change: expenseChange
    },
    {
      title: 'Balance',
      amount: totals.balance,
      icon: Wallet,
      className: `balance ${totals.balance >= 0 ? 'positive' : 'negative'}`,
      color: totals.balance >= 0 ? '#65a30d' : '#dc2626'
    }
  ];

  return (
    <div className="summary-cards">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className={`summary-card ${card.className}`}>
            <div className="card-icon" style={{ color: card.color }}>
              <Icon size={24} />
            </div>
            <div className="card-content">
              <h3>{card.title}</h3>
              <p className="amount">{formatCurrency(card.amount)}</p>
              {card.change !== undefined && (
                <div className="change-indicator">
                  <Percent size={14} />
                  <span className={`change-value ${card.change > 0 ? 'negative' : 'positive'}`}>
                    {card.change > 0 ? '+' : ''}{card.change.toFixed(1)}%
                  </span>
                  <span className="change-label">vs last month</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Monthly Comparison Card */}
      <div className="summary-card comparison-card">
        <div className="card-icon" style={{ color: '#6366f1' }}>
          <TrendingUp size={24} />
        </div>
        <div className="card-content">
          <h3>Monthly Trend</h3>
          <div className="comparison-content">
            <div className={`trend-indicator ${currentMonthVsAverage > 0 ? 'negative' : 'positive'}`}>
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
            <p className="comparison-label">vs monthly average</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;