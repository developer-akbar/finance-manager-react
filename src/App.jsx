import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import AddTransaction from './components/Transactions/AddTransaction';
import TransactionsList from './components/Transactions/TransactionsList';
import Analytics from './components/Analytics/Analytics';
import Settings from './components/Settings/Settings';
import { useApp } from './contexts/AppContext';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const { state } = useApp();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderCurrentView = () => {
    switch (state.currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'add-transaction':
        return <AddTransaction />;
      case 'transactions':
        return <TransactionsList />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderCurrentView()}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;