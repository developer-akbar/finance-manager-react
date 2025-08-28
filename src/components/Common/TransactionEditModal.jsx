import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { transactionsAPI } from '../../services/api';

const TransactionEditModal = ({ transaction, isOpen, onClose, onUpdate }) => {
  const { state } = useApp();
  const [formData, setFormData] = useState({
    Date: '',
    Account: '',
    Category: '',
    Subcategory: '',
    Note: '',
    Description: '',
    Amount: '',
    'Income/Expense': 'Expense',
    Currency: 'INR'
  });
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (transaction && isOpen) {
      // Convert date from DD/MM/YYYY to YYYY-MM-DD for input
      const dateParts = transaction.Date.split('/');
      const formattedDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
      
      setFormData({
        Date: formattedDate,
        Account: transaction.Account || '',
        Category: transaction.Category || '',
        Subcategory: transaction.Subcategory || '',
        Note: transaction.Note || '',
        Description: transaction.Description || '',
        Amount: transaction.Amount || transaction.INR?.toString() || '',
        'Income/Expense': transaction['Income/Expense'] || 'Expense',
        Currency: transaction.Currency || 'INR'
      });
      // Ensure suggestions don't show automatically when editing
      setShowSuggestions(false);
    }
  }, [transaction, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await transactionsAPI.update(transaction._id, formData);
      
      if (response.success) {
        onUpdate(response.transaction);
        onClose();
      } else {
        alert('Failed to update transaction: ' + response.message);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Error updating transaction');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
         <div className="modal-overlay" onClick={() => {
       setShowSuggestions(false);
       onClose();
     }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Transaction</h3>
                     <button className="modal-close" onClick={() => {
             setShowSuggestions(false);
             onClose();
           }}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="transaction-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="Date">Date</label>
                <input
                  type="date"
                  id="Date"
                  name="Date"
                  value={formData.Date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="Account">Account</label>
                <select
                  id="Account"
                  name="Account"
                  value={formData.Account}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Account</option>
                  {state.accounts?.map(account => (
                    <option key={account} value={account}>{account}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="Income/Expense">Type</label>
                <select
                  id="Income/Expense"
                  name="Income/Expense"
                  value={formData['Income/Expense']}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                  <option value="Transfer-Out">Transfer</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="Amount">Amount</label>
                <input
                  type="number"
                  id="Amount"
                  name="Amount"
                  value={formData.Amount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="Category">Category</label>
                <select
                  id="Category"
                  name="Category"
                  value={formData.Category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {Object.keys(state.categories || {}).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="Subcategory">Subcategory</label>
                <select
                  id="Subcategory"
                  name="Subcategory"
                  value={formData.Subcategory}
                  onChange={handleInputChange}
                >
                  <option value="">Select Subcategory</option>
                  {formData.Category && state.categories?.[formData.Category]?.subcategories?.map(subcategory => (
                    <option key={subcategory} value={subcategory}>{subcategory}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="Note">Note</label>
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
                      (state.transactions || [])
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
                      .map((note, index) => (
                        <div
                          key={index}
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

            <div className="form-group">
              <label htmlFor="Description">Description</label>
              <textarea
                id="Description"
                name="Description"
                value={formData.Description}
                onChange={handleInputChange}
                placeholder="Detailed description of the transaction"
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionEditModal;
