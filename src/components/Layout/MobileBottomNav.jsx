import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { 
  Home, 
  Search, 
  BarChart3, 
  Settings,
  CreditCard,
  PieChart
} from 'lucide-react';
import './MobileBottomNav.css';

const MobileBottomNav = () => {
  const { state, dispatch } = useApp();

  const menuItems = [
    { id: 'dashboard', icon: Home, title: 'Dashboard' },
    { id: 'transactions', icon: Search, title: 'Transactions' },
    { id: 'accounts', icon: CreditCard, title: 'Accounts' },
    { id: 'categories', icon: PieChart, title: 'Categories' },
    { id: 'analytics', icon: BarChart3, title: 'Analytics' },
    { id: 'settings', icon: Settings, title: 'Settings' }
  ];

  return (
    <nav className="bottom-nav">
      {menuItems.map(item => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${state.currentView === item.id ? 'active' : ''}`}
            onClick={() => {
              if (state.currentView === item.id) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                window.scrollTo(0, 0);
                dispatch({ type: 'SET_CURRENT_VIEW', payload: item.id });
              }
            }}
            title={item.title}
          >
            <Icon size={20} className="nav-icon" />
            <span className="nav-text">{item.title}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;