import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { X, Save } from 'lucide-react';
import './EditTransactionModal.css';

const EditTransactionModal = ({ transaction, onClose }) => {
  const { state, updateTransaction } = useApp();
  const { accounts, categories } = state;

  const [formData, setFormData] = useState({
    ...transaction,
    Date: transaction.Date.split('T')[0] // Convert to YYYY-MM-DD format
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

    const updatedTransaction = {
      ...formData,
      INR: parseFloat(formData.Amount)
    };

    updateTransaction(updatedTransaction);
    onClose();
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Transaction</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-type">Type</label>
              <select
                id="edit-type"
                value={formData['Income/Expense']}
                onChange={(e) => handleInputChange('Income/Expense', e.target.value)}
                className={formData['Income/Expense'].toLowerCase()}
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-date">Date</label>
              <input
                type="date"
                id="edit-date"
                value={formData.Date}
                onChange={(e) => handleInputChange('Date', e.target.value)}
                className={errors.Date ? 'error' : ''}
              />
              {errors.Date && <span className="error-text">{errors.Date}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-account">Account</label>
              <select
                id="edit-account"
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
              <label htmlFor="edit-amount">Amount</label>
              <input
                type="number"
                id="edit-amount"
                step="0.01"
                min="0"
                value={formData.Amount}
                onChange={(e) => handleInputChange('Amount', e.target.value)}
                className={errors.Amount ? 'error' : ''}
              />
              {errors.Amount && <span className="error-text">{errors.Amount}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-category">Category</label>
              <select
                id="edit-category"
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
              <label htmlFor="edit-subcategory">Subcategory</label>
              <select
                id="edit-subcategory"
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
            <label htmlFor="edit-note">Note</label>
            <input
              type="text"
              id="edit-note"
              value={formData.Note}
              onChange={(e) => handleInputChange('Note', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              rows="3"
              value={formData.Description}
              onChange={(e) => handleInputChange('Description', e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              <Save size={18} />
              Update Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;