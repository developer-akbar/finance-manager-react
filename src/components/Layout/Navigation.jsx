import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  Search, 
  BarChart3, 
  Settings, 
  LogOut,
  TrendingUp,
  Wallet,
  CreditCard,
  PieChart
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import './Navigation.css';

const Navigation = () => {
  const { state, dispatch } = useApp();
  const { logout } = useAuth();
  const [isCompact, setIsCompact] = useState(window.innerWidth <= 1024);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const compact = window.innerWidth <= 1024;
      setIsCompact(compact);
      if (!compact) setIsExpanded(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'transactions', label: 'Transactions', icon: Search },
    { id: 'accounts', label: 'Accounts', icon: CreditCard },
    { id: 'categories', label: 'Categories', icon: PieChart },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav className={`sidebar ${isCompact ? 'compact' : ''} ${isExpanded ? 'expanded' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <Wallet size={24} />
            <TrendingUp size={16} className="logo-trend" />
          </div>
          {!isCompact && <h2>FinancePro</h2>}
        </div>
        <div className="header-actions">
          <ThemeToggle />
        </div>
      </div>

      {isCompact && (
        <div className="sidebar-controls">
          <button className="hamburger" aria-label="Toggle menu" onClick={() => setIsExpanded(v => !v)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      )}
      
      <ul className="nav-menu">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <button
                className={`nav-item ${state.currentView === item.id ? 'active' : ''}`}
                onClick={() => {
                  if (state.currentView === item.id) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    window.scrollTo(0, 0);
                    dispatch({ type: 'SET_CURRENT_VIEW', payload: item.id });
                  }
                  if (isCompact) setIsExpanded(false);
                }}
              >
                <Icon size={20} />
                {(!isCompact || isExpanded) && <span>{item.label}</span>}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer"></div>
    </nav>
  );
};

export default Navigation;