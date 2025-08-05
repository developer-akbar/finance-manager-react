import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';
import './SummaryCards.css';

const SummaryCards = ({ totals }) => {
  const cards = [
    {
      title: 'Total Income',
      amount: totals.income,
      icon: TrendingUp,
      className: 'income-card',
      color: '#65a30d'
    },
    {
      title: 'Total Expenses',
      amount: totals.expense,
      icon: TrendingDown,
      className: 'expense-card',
      color: '#dc2626'
    },
    {
      title: 'Net Balance',
      amount: totals.balance,
      icon: Wallet,
      className: `balance-card ${totals.balance >= 0 ? 'positive' : 'negative'}`,
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
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryCards;