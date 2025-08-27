import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api, { transactionsAPI, settingsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const initialState = {
  transactions: [],
  accounts: [],
  categories: {},
  accountGroups: [],
  accountMapping: {},
  csvConversionDetails: {},
  currentView: 'dashboard',
  filters: {
    dateRange: 'all',
    account: 'all',
    category: 'all',
    type: 'all'
  },
  searchTerm: '',
  loading: false,
  error: null
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t._id === action.payload._id ? action.payload : t
        )
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t._id !== action.payload)
      };
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_ACCOUNT_GROUPS':
      return { ...state, accountGroups: action.payload };
    case 'SET_ACCOUNT_MAPPING':
      return { ...state, accountMapping: action.payload };
    case 'SET_CSV_CONVERSION_DETAILS':
      return { ...state, csvConversionDetails: action.payload };
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'INITIALIZE_DATA':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      // Hydrate from cache to avoid empty UI while network loads
      try {
        const cached = JSON.parse(localStorage.getItem('fm_cached_state') || 'null');
        if (cached && cached.transactions && Array.isArray(cached.transactions)) {
          dispatch({ type: 'INITIALIZE_DATA', payload: {
            accounts: cached.accounts || [],
            categories: cached.categories || {},
            accountGroups: cached.accountGroups || [],
            accountMapping: cached.accountMapping || {},
            csvConversionDetails: cached.csvConversionDetails || {}
          }});
          dispatch({ type: 'SET_TRANSACTIONS', payload: cached.transactions });
        }
      } catch {}

      // Warm up backend just before loading data
      api.health.check().catch(() => {});

      loadData();
    }
  }, [isAuthenticated]);

  // Handle legacy navigation state
  useEffect(() => {
    // If user has old navigation state, redirect to dashboard
    if (state.currentView === 'add-transaction') {
      dispatch({ type: 'SET_CURRENT_VIEW', payload: 'dashboard' });
    }
  }, [state.currentView, dispatch]);

  const loadData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Load settings and transactions in parallel
      const [settingsResponse, transactionsResponse] = await Promise.all([
        settingsAPI.get(),
        transactionsAPI.getAll() // Get all transactions for analytics
      ]);

      if (settingsResponse.success) {
        const { accounts, categories, accountGroups, accountMapping, csvConversionDetails } = settingsResponse.data;
        dispatch({
          type: 'INITIALIZE_DATA',
          payload: {
            accounts,
            categories,
            accountGroups,
            accountMapping,
            csvConversionDetails
          }
        });
      }

      if (transactionsResponse.success) {
        dispatch({ type: 'SET_TRANSACTIONS', payload: transactionsResponse.data });
        // Cache for faster perceived load next time
        try {
          localStorage.setItem('fm_cached_state', JSON.stringify({
            accounts: settingsResponse.success ? settingsResponse.data.accounts : [],
            categories: settingsResponse.success ? settingsResponse.data.categories : {},
            accountGroups: settingsResponse.success ? settingsResponse.data.accountGroups : [],
            accountMapping: settingsResponse.success ? settingsResponse.data.accountMapping : {},
            csvConversionDetails: settingsResponse.success ? settingsResponse.data.csvConversionDetails : {},
            transactions: transactionsResponse.data
          }));
        } catch {}
      }
    } catch (error) {
      console.error('Error loading data:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addTransaction = async (transaction) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const newTransaction = {
        ...transaction,
        ID: Date.now().toString()
      };

      const response = await transactionsAPI.create(newTransaction);
      
      if (response.success) {
        dispatch({ type: 'ADD_TRANSACTION', payload: response.data });
        return { success: true, message: 'Transaction added successfully' };
      } else {
        return { success: false, message: response.message || 'Failed to add transaction' };
      }
    } catch (error) {
      console.error('Add transaction error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, message: error.message || 'Failed to add transaction' };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateTransaction = async (transaction) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await transactionsAPI.update(transaction.ID, transaction);
      
      if (response.success) {
        dispatch({ type: 'UPDATE_TRANSACTION', payload: response.data });
        return { success: true, message: 'Transaction updated successfully' };
      } else {
        return { success: false, message: response.message || 'Failed to update transaction' };
      }
    } catch (error) {
      console.error('Update transaction error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, message: error.message || 'Failed to update transaction' };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteTransaction = async (id) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await transactionsAPI.delete(id);
      
      if (response.success) {
        dispatch({ type: 'DELETE_TRANSACTION', payload: id });
        return { success: true, message: 'Transaction deleted successfully' };
      } else {
        return { success: false, message: response.message || 'Failed to delete transaction' };
      }
    } catch (error) {
      console.error('Delete transaction error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, message: error.message || 'Failed to delete transaction' };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateSettings = async (settingsData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await settingsAPI.update(settingsData);
      
      if (response.success) {
        const { accounts, categories, accountGroups, accountMapping, csvConversionDetails } = response.data;
        dispatch({
          type: 'INITIALIZE_DATA',
          payload: {
            accounts,
            categories,
            accountGroups,
            accountMapping,
            csvConversionDetails
          }
        });
        return { success: true, message: 'Settings updated successfully' };
      } else {
        return { success: false, message: response.message || 'Failed to update settings' };
      }
    } catch (error) {
      console.error('Update settings error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, message: error.message || 'Failed to update settings' };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const refreshTransactions = async () => {
    try {
      const response = await transactionsAPI.getAll(); // Get all transactions without limit
      if (response.success) {
        dispatch({ type: 'SET_TRANSACTIONS', payload: response.data });
      }
    } catch (error) {
      console.error('Refresh transactions error:', error);
    }
  };

  const value = {
    state,
    dispatch,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateSettings,
    refreshTransactions,
    loadData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};