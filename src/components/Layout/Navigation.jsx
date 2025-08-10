import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  PlusCircle, 
  Search, 
  BarChart3, 
  Settings, 
  LogOut,
  TrendingUp,
  Wallet,
  CreditCard
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import './Navigation.css';

const Navigation = () => {
  const { state, dispatch } = useApp();
  const { logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'add-transaction', label: 'Add Transaction', icon: PlusCircle },
    { id: 'transactions', label: 'Transactions', icon: Search },
    { id: 'accounts', label: 'Accounts', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <Wallet size={24} />
            <TrendingUp size={16} className="logo-trend" />
          </div>
          <h2>FinancePro</h2>
        </div>
        <ThemeToggle />
      </div>
      
      <ul className="nav-menu">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <button
                className={`nav-item ${state.currentView === item.id ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: item.id })}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={logout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;