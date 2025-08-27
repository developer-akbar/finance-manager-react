import React, { useState, useRef } from 'react';
import api from '../../services/api';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download, Info, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import './DataImport.css';

const DataImport = () => {
  const { state, loadData } = useApp();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);
  const [importMode, setImportMode] = useState('override'); // 'override' or 'merge'
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/json' // .json
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please select an Excel (.xlsx, .xls), CSV (.csv), or JSON (.json) file.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size too large. Please select a file smaller than 10MB.');
      return;
    }

    setError(null);
    setPendingFile(file);
    
    // Check if there are existing transactions
    if (state.transactions && state.transactions.length > 0) {
      setShowConsentModal(true);
    } else {
      handleImport(file, 'override');
    }
  };

  const handleImport = async (file, mode) => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const result = await api.import.importExcel(formData, mode);

      if (!result.success) {
        throw new Error(result.message || 'Import failed');
      }

      setImportResult(result);
      
      // Refresh data after successful import
      await loadData();

    } catch (error) {
      console.error('Import error:', error);
      setError(error.message || 'An error occurred during import');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setPendingFile(null);
      setShowConsentModal(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConsent = (mode) => {
    if (pendingFile) {
      handleImport(pendingFile, mode);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        Date: '01/01/2024',
        Account: 'Cash',
        Category: 'Food',
        Subcategory: 'Groceries',
        Note: 'Sample transaction',
        INR: 100.00,
        'Income/Expense': 'Expense',
        Description: 'Sample description',
        Amount: '100.00',
        Currency: 'INR',
        ID: 'sample_1'
      },
      {
        Date: '01/01/2024',
        Account: 'Bank',
        Category: 'Salary',
        Subcategory: 'Monthly',
        Note: 'Sample income',
        INR: 5000.00,
        'Income/Expense': 'Income',
        Description: 'Sample income description',
        Amount: '5000.00',
        Currency: 'INR',
        ID: 'sample_2'
      },
      {
        Date: '01/01/2024',
        Account: 'Cash',
        Category: 'Bank',
        Subcategory: 'Transfer',
        Note: 'Sample transfer',
        INR: 1000.00,
        'Income/Expense': 'Transfer',
        Description: 'Sample transfer description',
        Amount: '1000.00',
        Currency: 'INR',
        ID: 'sample_3'
      }
    ];

    const csvContent = [
      'Date,Account,Category,Subcategory,Note,INR,Income/Expense,Description,Amount,Currency,ID',
      ...template.map(row => [
        row.Date,
        row.Account,
        row.Category,
        row.Subcategory,
        row.Note,
        row.INR,
        row['Income/Expense'],
        row.Description,
        row.Amount,
        row.Currency,
        row.ID
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finance_manager_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCurrentData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const result = await api.transactions.getAll();
      
      if (!result.success || !result.data) {
        throw new Error('No data available for export');
      }

      const transactions = result.data;
      
      // Convert to CSV format
      const csvContent = [
        'Date,Account,Category,Subcategory,Note,INR,Income/Expense,Description,Amount,Currency,ID',
        ...transactions.map(t => [
          t.Date,
          t.Account,
          t.Category,
          t.Subcategory,
          t.Note,
          t.INR,
          t['Income/Expense'],
          t.Description,
          t.Amount,
          t.Currency,
          t.ID
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance_manager_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export data: ' + error.message);
    }
  };

  const deleteAllData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const result = await api.settings.deleteAll();
      
      if (result.success) {
        setError(null);
        setImportResult({
          message: 'All data deleted successfully',
          stats: { total: 0, deleted: result.deletedCount }
        });
        // Refresh data after successful deletion
        await loadData();
      } else {
        throw new Error(result.message || 'Failed to delete all data');
      }

    } catch (error) {
      console.error('Delete all data error:', error);
      setError('Failed to delete all data: ' + error.message);
    } finally {
      setShowDeleteConfirmModal(false);
    }
  };

  return (
    <div className="data-import">
      <div className="import-header">
        <h2>Data Management</h2>
        <p>Import your financial data from Excel, CSV, or JSON files</p>
      </div>

      <div className="import-sections">
        {/* Import Section */}
        <div className="import-section">
          <div className="section-header">
            <h3>Import Data</h3>
            <div className="section-actions">
              <button 
                className="btn btn-secondary"
                onClick={downloadTemplate}
                title="Download template file"
              >
                <Download size={16} />
                Template
              </button>
                             <button 
                 className="btn btn-secondary"
                 onClick={exportCurrentData}
                 title="Export current data"
               >
                 <FileText size={16} />
                 Export
               </button>
               <button 
                 className="btn btn-danger"
                 onClick={() => setShowDeleteConfirmModal(true)}
                 title="Delete all data"
               >
                 <Trash2 size={16} />
                 Delete All Data
               </button>
            </div>
          </div>

          <div className="import-area">
            <div className="file-upload-zone">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                onChange={handleFileSelect}
                className="file-input"
                disabled={isUploading}
              />
              <div className="upload-content">
                <Upload size={48} className="upload-icon" />
                <h4>Choose a file or drag it here</h4>
                <p>Supports Excel (.xlsx, .xls), CSV (.csv), and JSON (.json) files</p>
                <p className="file-size-limit">Maximum file size: 10MB</p>
              </div>
            </div>

            {isUploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p>Processing import...</p>
              </div>
            )}

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
                <button 
                  className="error-close"
                  onClick={() => setError(null)}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {importResult && (
              <div className="success-message">
                <CheckCircle size={16} />
                <div className="success-content">
                  <span>{importResult.message}</span>
                  {importResult.stats && (
                    <div className="import-stats">
                      <span>Total: {importResult.stats.total}</span>
                      {importResult.stats.new && <span>New: {importResult.stats.new}</span>}
                      {importResult.stats.duplicates && <span>Duplicates: {importResult.stats.duplicates}</span>}
                    </div>
                  )}
                </div>
                <button 
                  className="success-close"
                  onClick={() => setImportResult(null)}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Instructions Section */}
        <div className="import-section">
          <div className="section-header">
            <h3>Import Instructions</h3>
          </div>
          
          <div className="instructions-content">
            <div className="instruction-item">
              <h4>File Format Requirements</h4>
              <ul>
                <li>File must contain a header row with column names</li>
                <li>Required columns: Date, Account, Category, INR, Income/Expense</li>
                <li>Optional columns: Subcategory, Note, Description, Amount, Currency, ID</li>
                <li>Date format: DD-MM-YYYY or DD-MM-YYYY HH:MM:SS AM/PM</li>
              </ul>
            </div>

                         <div className="instruction-item">
               <h4>Transaction Types</h4>
               <ul>
                 <li><strong>Income/Expense:</strong> Normal transactions with Account and Category</li>
                 <li><strong>Transfer/Transfer-Out:</strong> For transfers, Account = FromAccount, Category = ToAccount</li>
               </ul>
             </div>

            <div className="instruction-item">
              <h4>Import Modes</h4>
              <ul>
                <li><strong>Override:</strong> Replace all existing data with imported data</li>
                <li><strong>Merge:</strong> Add new transactions, skip duplicates</li>
              </ul>
            </div>

            <div className="instruction-item">
              <h4>Data Validation</h4>
              <ul>
                <li>Invalid dates will be skipped</li>
                <li>Missing required fields will be skipped</li>
                <li>Duplicate transactions (based on date, account, category, amount) will be handled according to mode</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Current Data Stats */}
        <div className="import-section">
          <div className="section-header">
            <h3>Current Data</h3>
          </div>
          
          <div className="data-stats">
            <div className="stat-item">
              <span className="stat-label">Total Transactions:</span>
              <span className="stat-value">{state.transactions?.length || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Accounts:</span>
              <span className="stat-value">{state.accounts?.length || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Categories:</span>
              <span className="stat-value">{Object.keys(state.categories || {}).length}</span>
            </div>
          </div>
        </div>
      </div>

             {/* Consent Modal */}
       {showConsentModal && (
         <div className="consent-modal-overlay">
           <div className="consent-modal">
             <div className="modal-header">
               <h3>Import Mode Selection</h3>
               <button 
                 className="modal-close"
                 onClick={() => setShowConsentModal(false)}
               >
                 <X size={20} />
               </button>
             </div>
             
             <div className="modal-content">
               <div className="consent-message">
                 <Info size={24} />
                 <p>You have existing data. How would you like to handle the import?</p>
               </div>
               
               <div className="import-modes">
                 <div className="mode-option">
                   <h4>Override Mode</h4>
                   <p>Replace all existing data with the imported file</p>
                   <button 
                     className="btn btn-danger"
                     onClick={() => handleConsent('override')}
                   >
                     Override All Data
                   </button>
                 </div>
                 
                 <div className="mode-option">
                   <h4>Merge Mode</h4>
                   <p>Add new transactions, skip duplicates</p>
                   <button 
                     className="btn btn-primary"
                     onClick={() => handleConsent('merge')}
                   >
                     Merge Data
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Delete All Data Confirmation Modal */}
       {showDeleteConfirmModal && (
         <div className="consent-modal-overlay">
           <div className="consent-modal">
             <div className="modal-header">
               <h3>Delete All Data</h3>
               <button 
                 className="modal-close"
                 onClick={() => setShowDeleteConfirmModal(false)}
               >
                 <X size={20} />
               </button>
             </div>
             
             <div className="modal-content">
               <div className="consent-message">
                 <AlertCircle size={24} className="text-danger" />
                 <p><strong>Warning:</strong> This action will permanently delete ALL your financial data including:</p>
                 <ul>
                   <li>All transactions</li>
                   <li>All accounts</li>
                   <li>All categories and subcategories</li>
                 </ul>
                 <p>This action cannot be undone. Are you sure you want to continue?</p>
               </div>
               
               <div className="import-modes">
                 <div className="mode-option">
                   <button 
                     className="btn btn-secondary"
                     onClick={() => setShowDeleteConfirmModal(false)}
                   >
                     Cancel
                   </button>
                 </div>
                 
                 <div className="mode-option">
                   <button 
                     className="btn btn-danger"
                     onClick={deleteAllData}
                   >
                     Yes, Delete All Data
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default DataImport;
