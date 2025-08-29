import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Save, ArrowLeft } from 'lucide-react';
import { convertDateFormat } from '../../utils/calculations';
import './AddTransaction.css';

const AddTransaction = ({ isEditMode = false, editTransaction = null, onClose = null, setIsSubmitting = null, prefillDate = '' }) => {
  const { state, addTransaction, updateTransaction, dispatch } = useApp();
  const { accounts, categories, transactions } = state;

  // Prevent body scrolling when modal is open
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  // Helper function to convert DD/MM/YYYY to YYYY-MM-DD for HTML input
  // Based on user's proven date handling approach
  const convertDateForInput = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Convert using user's proven approach
    const convertedDate = convertDateFormat(dateStr);
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(convertedDate)) {
      const [day, month, year] = convertedDate.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Fallback to current date
    return new Date().toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState(() => {
    if (isEditMode && editTransaction) {
      return {
        ...editTransaction,
        Date: convertDateForInput(editTransaction.Date),
        Amount: editTransaction.INR || editTransaction.Amount || ''
      };
    }
    // Include current time in HH:MM:SS for server-side parsing; store date input separately
    const isoDate = prefillDate || new Date().toISOString().split('T')[0];
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return {
      Date: isoDate,
      Time: `${hh}:${mm}:${ss}`,
      Account: '',
      FromAccount: '',
      ToAccount: '',
      Category: '',
      Subcategory: '',
      'Income/Expense': 'Expense',
      Amount: '',
      Currency: 'INR',
      Note: '',
      Description: ''
    };
  });

  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (prefillDate) {
      setFormData(prev => ({ ...prev, Date: prefillDate }));
    }
  }, [prefillDate]);

  // Helpers to format/display time
  const getCurrentTime = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };
  const getTimeDisplay = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hour = parseInt(h, 10);
    const ap = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12; if (hour === 0) hour = 12;
    return `${hour}:${m} ${ap}`;
  };

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.Date) newErrors.Date = 'Date is required';
    if (!formData.Amount || parseFloat(formData.Amount) < 0) {
      newErrors.Amount = 'Valid amount is required (0 is allowed)';
    }

    if (formData['Income/Expense'] === 'Transfer-Out') {
      if (!formData.FromAccount) newErrors.FromAccount = 'From Account is required';
      if (!formData.ToAccount) newErrors.ToAccount = 'To Account is required';
      if (formData.FromAccount === formData.ToAccount) {
        newErrors.ToAccount = 'From Account and To Account must be different';
      }
    } else {
      if (!formData.Account) newErrors.Account = 'Account is required';
      if (!formData.Category) newErrors.Category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (setIsSubmitting) setIsSubmitting(true);

    try {
      const transaction = {
        ...formData,
        INR: parseFloat(formData.Amount),
        // For Transfer-Out transactions, set Account to FromAccount for display purposes
        Account: formData['Income/Expense'] === 'Transfer-Out' ? formData.FromAccount : formData.Account,
        // Set default subcategory if empty
        Subcategory: formData.Subcategory || 'Default'
      };

      if (isEditMode) {
        await updateTransaction({ ...transaction, ID: editTransaction?._id || editTransaction?.ID });
        if (onClose) onClose();
      } else {
        const result = await addTransaction(transaction);
        if (onClose) onClose();
      }
    } catch (error) {
      console.error('Transaction operation failed:', error);
    } finally {
      if (setIsSubmitting) setIsSubmitting(false);
    }
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

  const handleNoteChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, Note: value }));
    setShowSuggestions(value.length > 0);
  };

  const handleNoteSelect = (note) => {
    setFormData(prev => ({ ...prev, Note: note }));
    setShowSuggestions(false);
  };

  const handleNoteBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // Get categories for the current transaction type
  const availableCategories = Object.entries(categories || {})
    .filter(([categoryName, categoryData]) => categoryData.type === formData['Income/Expense'])
    .map(([categoryName]) => categoryName);

  // Get subcategories for the selected category
  const availableSubcategories = formData.Category && categories[formData.Category]
    ? (categories[formData.Category].subcategories && categories[formData.Category].subcategories.length > 0
        ? categories[formData.Category].subcategories
        : ['Default'])
    : ['Default'];

  return (
    <>
      {/* Modal Overlay */}
             <div className="transaction-modal-overlay" onClick={() => {
         setShowSuggestions(false);
         if (onClose) onClose();
       }}>
        {/* Modal Content */}
        <div className="transaction-modal add-transaction-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Add</h3>
                         <button 
               className="modal-close-btn"
               onClick={() => {
                 setShowSuggestions(false);
                 if (onClose) onClose();
               }}
             >
              ×
            </button>
          </div>
          
          <div className="modal-content">
            <form onSubmit={handleSubmit} className="transaction-form">
              {/* Type Selection - Buttons/Tabs */}
              <div className="type-selection">
                <div className="type-buttons">
                  <button
                    type="button"
                    className={`type-btn ${formData['Income/Expense'] === 'Expense' ? 'active expense' : ''}`}
                    onClick={() => handleInputChange('Income/Expense', 'Expense')}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${formData['Income/Expense'] === 'Income' ? 'active income' : ''}`}
                    onClick={() => handleInputChange('Income/Expense', 'Income')}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${formData['Income/Expense'] === 'Transfer-Out' ? 'active transfer' : ''}`}
                    onClick={() => handleInputChange('Income/Expense', 'Transfer-Out')}
                  >
                    Transfer
                  </button>
                </div>
              </div>

              {/* Date & Time Fields (side-by-side) */}
              <div className="form-row" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)'}}>
                <div>
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
                <div>
                  <label htmlFor="time">Time</label>
                  <input
                    type="time"
                    id="time"
                    value={formData.Time || ''}
                    onChange={(e) => handleInputChange('Time', e.target.value)}
                  />
                </div>
              </div>

              {/* Account Field */}
              {formData['Income/Expense'] === 'Transfer-Out' ? (
                <>
                  <div className="form-row">
                    <label htmlFor="fromAccount">From Account</label>
                    <select
                      id="fromAccount"
                      value={formData.FromAccount}
                      onChange={(e) => handleInputChange('FromAccount', e.target.value)}
                      className={errors.FromAccount ? 'error' : ''}
                    >
                      <option value="">Select From Account</option>
                      {accounts.map(account => (
                        <option key={account} value={account}>{account}</option>
                      ))}
                    </select>
                    {errors.FromAccount && <span className="error-text">{errors.FromAccount}</span>}
                  </div>

                  <div className="form-row">
                    <label htmlFor="toAccount">To Account</label>
                    <select
                      id="toAccount"
                      value={formData.ToAccount}
                      onChange={(e) => handleInputChange('ToAccount', e.target.value)}
                      className={errors.ToAccount ? 'error' : ''}
                    >
                      <option value="">Select To Account</option>
                      {accounts.map(account => (
                        <option key={account} value={account}>{account}</option>
                      ))}
                    </select>
                    {errors.ToAccount && <span className="error-text">{errors.ToAccount}</span>}
                  </div>
                </>
              ) : (
                <div className="form-row">
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
              )}

              {/* Category and Subcategory Fields */}
              {formData['Income/Expense'] !== 'Transfer-Out' && (
                <>
                  <div className="form-row">
                    <label htmlFor="category">Category</label>
                    <select
                      id="category"
                      value={formData.Category}
                      onChange={(e) => handleInputChange('Category', e.target.value)}
                      className={errors.Category ? 'error' : ''}
                    >
                      <option value="">Select Category</option>
                      {availableCategories.map((categoryName) => (
                        <option key={categoryName} value={categoryName}>{categoryName}</option>
                      ))}
                    </select>
                    {errors.Category && <span className="error-text">{errors.Category}</span>}
                  </div>

                  <div className="form-row">
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
                </>
              )}

              {/* Amount Field */}
              <div className="form-row">
                <label htmlFor="amount">Amount</label>
                <input
                  type="number"
                  id="amount"
				  inputmode="numeric"
                  value={formData.Amount}
                  onChange={(e) => handleInputChange('Amount', e.target.value)}
                  className={errors.Amount ? 'error' : ''}
                />
                {errors.Amount && <span className="error-text">{errors.Amount}</span>}
              </div>

              {/* Note Field */}
              <div className="form-row">
                <label htmlFor="note">Note</label>
                <div className="note-input-container">
                  <input
                    type="text"
                    name="Note"
                    value={formData.Note}
                    onChange={handleNoteChange}
                    onBlur={handleNoteBlur}
                    placeholder="Note"
                    required
                  />
                  {formData.Note && (
                    <button
                      type="button"
                      className="note-clear-btn"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, Note: '' }));
                        setShowSuggestions(false);
                      }}
                    >
                      ×
                    </button>
                  )}
                  {showSuggestions && (
                    <div className="note-suggestions">
                      {Array.from(new Set(
                        (transactions || [])
                          .map(t => t.Note)
                          .filter(n => 
                            n && 
                            n.trim().length > 0 && 
                            !n.includes('(') && 
                            !n.includes(')') &&
                            n.toLowerCase().includes(formData.Note.toLowerCase())
                          )
                      ))
                        .slice(0, 10)
                        .map((note) => (
                          <div
                            key={note}
                            className="note-suggestion-item"
                            onClick={() => handleNoteSelect(note)}
                          >
                            {note}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Description Field */}
              <div className="form-row">
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
                  onClick={() => {
                    // Hide suggestions when canceling
                    setShowSuggestions(false);
                    if (isEditMode && onClose) {
                      onClose();
                    } else if (onClose) {
                      onClose();
                    } else {
                      dispatch({ type: 'SET_CURRENT_VIEW', payload: 'dashboard' });
                    }
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  <Save size={18} />
                  {isEditMode ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddTransaction;