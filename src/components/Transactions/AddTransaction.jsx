import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Save, ArrowLeft } from 'lucide-react';
import './AddTransaction.css';

const AddTransaction = () => {
  const { state, addTransaction, dispatch } = useApp();
  const { accounts, categories } = state;

  const [formData, setFormData] = useState({
    Date: new Date().toISOString().split('T')[0],
    Account: accounts[0] || '',
    Category: '',
    Subcategory: '',
    'Income/Expense': 'Expense',
    Amount: '',
    Currency: 'INR',
    Note: '',
    Description: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.Date) newErrors.Date = 'Date is required';
    if (!formData.Account) newErrors.Account = 'Account is required';
    if (!formData.Category) newErrors.Category = 'Category is required';
    if (!formData.Amount || parseFloat(formData.Amount) <= 0) {
      newErrors.Amount = 'Valid amount is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const transaction = {
      ...formData,
      INR: parseFloat(formData.Amount)
    };

    addTransaction(transaction);
    
    // Reset form
    setFormData({
      Date: new Date().toISOString().split('T')[0],
      Account: accounts[0] || '',
      Category: '',
      Subcategory: '',
      'Income/Expense': 'Expense',
      Amount: '',
      Currency: 'INR',
      Note: '',
      Description: ''
    });

    // Show success message or redirect
    dispatch({ type: 'SET_CURRENT_VIEW', payload: 'dashboard' });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Reset subcategory when category changes
    if (field === 'Category') {
      setFormData(prev => ({ ...prev, Subcategory: '' }));
    }
  };

  const availableCategories = Object.entries(categories).filter(
    ([, categoryData]) => categoryData.type === formData['Income/Expense']
  );

  const availableSubcategories = formData.Category && categories[formData.Category]
    ? categories[formData.Category].subcategories
    : [];

  return (
    <div className="add-transaction">
      <div className="page-header">
        <button 
          className="back-btn"
          onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: 'dashboard' })}
        >
          <ArrowLeft size={20} />
        </button>
        <h1>Add Transaction</h1>
      </div>

      <form onSubmit={handleSubmit} className="transaction-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              value={formData['Income/Expense']}
              onChange={(e) => handleInputChange('Income/Expense', e.target.value)}
              className={formData['Income/Expense'].toLowerCase()}
            >
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              value={formData.Date}
              onChange={(e) => handleInputChange('Date', e.target.value)}
              className={errors.Date ? 'error' : ''}
            />
            {errors.Date && <span className="error-text">{errors.Date}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="account">Account</label>
            <select
              id="account"
              value={formData.Account}
              onChange={(e) => handleInputChange('Account', e.target.value)}
              className={errors.Account ? 'error' : ''}
            >
              <option value="">Select Account</option>
              {accounts.map(account => (
                <option key={account} value={account}>{account}</option>
              ))}
            </select>
            {errors.Account && <span className="error-text">{errors.Account}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              id="amount"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.Amount}
              onChange={(e) => handleInputChange('Amount', e.target.value)}
              className={errors.Amount ? 'error' : ''}
            />
            {errors.Amount && <span className="error-text">{errors.Amount}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={formData.Category}
              onChange={(e) => handleInputChange('Category', e.target.value)}
              className={errors.Category ? 'error' : ''}
            >
              <option value="">Select Category</option>
              {availableCategories.map(([categoryName]) => (
                <option key={categoryName} value={categoryName}>{categoryName}</option>
              ))}
            </select>
            {errors.Category && <span className="error-text">{errors.Category}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="subcategory">Subcategory</label>
            <select
              id="subcategory"
              value={formData.Subcategory}
              onChange={(e) => handleInputChange('Subcategory', e.target.value)}
              disabled={!availableSubcategories.length}
            >
              <option value="">Select Subcategory</option>
              {availableSubcategories.map(subcategory => (
                <option key={subcategory} value={subcategory}>{subcategory}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="note">Note</label>
          <input
            type="text"
            id="note"
            placeholder="Quick note about this transaction"
            value={formData.Note}
            onChange={(e) => handleInputChange('Note', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows="3"
            placeholder="Detailed description (optional)"
            value={formData.Description}
            onChange={(e) => handleInputChange('Description', e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => dispatch({ type: 'SET_CURRENT_VIEW', payload: 'dashboard' })}
          >
            Cancel
          </button>
          <button type="submit" className="save-btn">
            <Save size={18} />
            Save Transaction
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTransaction;