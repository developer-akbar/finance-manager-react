import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { X } from 'lucide-react';
import AddTransaction from './AddTransaction';
import './EditTransactionModal.css';

const EditTransactionModal = ({ transaction, onClose }) => {
  const { updateTransaction } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="edit-modal-overlay" onClick={handleOverlayClick}>
      <div className="edit-modal">
        <div className="modal-header">
          <h2>Edit Transaction</h2>
          <button 
            className="close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-content">
          <AddTransaction 
            isEditMode={true}
            editTransaction={transaction}
            onClose={onClose}
            setIsSubmitting={setIsSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default EditTransactionModal;