import React from 'react';
import { useApp } from '../../contexts/AppContext';
import './MobileBottomNav.css';

const MobileBottomNav = () => {
  const { state, dispatch } = useApp();

  const menuItems = [
    { id: 'dashboard', label: '🏠', title: 'Dashboard' },
    { id: 'add-transaction', label: '➕', title: 'Add' },
    { id: 'transactions', label: '🔍', title: 'Search' },
    { id: 'analytics', label: '📊', title: 'Analytics' },
    { id: 'settings', label: '⚙️', title: 'Settings' }
  ];

  return (
    <nav className="bottom-nav">
      {menuItems.map(item => (
        <button
          key={item.id}
          className={`bottom-nav-item ${state.currentView === item.id ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: item.id })}
          title={item.title}
        >
          <span className="nav-emoji">{item.label}</span>
          <span className="nav-text">{item.title}</span>
        </button>
      ))}
    </nav>
  );
};

export default MobileBottomNav;