import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { initializeDefaultData } from '../utils/defaultData';

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
  searchTerm: ''
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.ID === action.payload.ID ? action.payload : t
        )
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.ID !== action.payload)
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

  useEffect(() => {
    initializeDefaultData();
    loadDataFromStorage();
  }, []);

  const loadDataFromStorage = () => {
    try {
      const transactions = JSON.parse(localStorage.getItem('masterExpenses') || '[]');
      const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      const categories = JSON.parse(localStorage.getItem('categories') || '{}');
      const accountGroups = JSON.parse(localStorage.getItem('accountGroups') || '[]');
      const accountMapping = JSON.parse(localStorage.getItem('accountMapping') || '{}');
      const csvConversionDetails = JSON.parse(localStorage.getItem('csvConversionDetails') || '{}');

      dispatch({
        type: 'INITIALIZE_DATA',
        payload: {
          transactions,
          accounts,
          categories,
          accountGroups,
          accountMapping,
          csvConversionDetails
        }
      });
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  };

  const saveTransactionsToStorage = (transactions) => {
    localStorage.setItem('masterExpenses', JSON.stringify(transactions));
  };

  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      ID: Date.now().toString()
    };
    const updatedTransactions = [...state.transactions, newTransaction];
    dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
    saveTransactionsToStorage(updatedTransactions);
  };

  const updateTransaction = (transaction) => {
    const updatedTransactions = state.transactions.map(t =>
      t.ID === transaction.ID ? transaction : t
    );
    dispatch({ type: 'UPDATE_TRANSACTION', payload: transaction });
    saveTransactionsToStorage(updatedTransactions);
  };

  const deleteTransaction = (id) => {
    const updatedTransactions = state.transactions.filter(t => t.ID !== id);
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
    saveTransactionsToStorage(updatedTransactions);
  };

  const value = {
    state,
    dispatch,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    loadDataFromStorage
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};