import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { importAPI, transactionsAPI, settingsAPI } from '../../services/api';
import { 
  Download, 
  Upload, 
  Trash2, 
  Plus, 
  Edit2, 
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import AccountManager from './AccountManager';
import CategoryManager from './CategoryManager';
import './Settings.css';

const Settings = () => {
  const { state, loadDataFromStorage, refreshTransactions } = useApp();
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState('accounts');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const sections = [
    { id: 'accounts', label: 'Accounts' },
    { id: 'categories', label: 'Categories' },
    { id: 'data', label: 'Data Management' },
    { id: 'about', label: 'About' }
  ];

  const exportData = () => {
    const data = {
      transactions: state.transactions,
      accounts: state.accounts,
      categories: state.categories,
      accountGroups: state.accountGroups,
      accountMapping: state.accountMapping,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowExportModal(false);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setImportError(''); // Clear previous errors

    // Validate file type
    if (!(file.type === 'application/json' || file.name.endsWith('.json') ||
          file.type === 'text/csv' || file.name.endsWith('.csv') ||
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setImportError('Unsupported file format. Please use JSON, CSV, or Excel files.');
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setImportError('Please select a file first.');
      return;
    }

    setImportLoading(true);
    setImportError('');

    try {
      if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json')) {
        // Handle JSON file
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = JSON.parse(e.target.result);
            
            if (data.transactions && Array.isArray(data.transactions)) {
              const response = await importAPI.importJSON({ transactions: data.transactions });
              
              if (response.success) {
                const stats = response.data;
                const message = `Data imported successfully!\n\n` +
                  `📊 Import Statistics:\n` +
                  `• Total rows processed: ${stats.totalRows || 'N/A'}\n` +
                  `• Successfully imported: ${stats.imported}\n` +
                  `• Skipped rows: ${stats.skippedRows || 'N/A'}\n` +
                  `• Errors: ${stats.errors ? stats.errors.length : 0}`;
                
                alert(message);
                
                if (stats.errors && stats.errors.length > 0) {
                  console.warn('Import warnings:', stats.errors);
                  // Show first few errors in console for debugging
                  console.log('First 5 errors:', stats.errors.slice(0, 5));
                }
                
                setShowImportModal(false);
                setSelectedFile(null);
                // Refresh transactions and settings to show imported data
                await Promise.all([
                  refreshTransactions(),
                  loadData()
                ]);
              } else {
                setImportError(response.message || 'Import failed');
              }
            } else {
              setImportError('Invalid JSON format. Expected transactions array.');
            }
          } catch (error) {
            setImportError('Error reading JSON file. Please check the file format.');
          } finally {
            setImportLoading(false);
          }
        };
        reader.readAsText(selectedFile);
      } else if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv') || 
                 selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 selectedFile.type === 'application/vnd.ms-excel' ||
                 selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        // Handle Excel/CSV file
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const response = await importAPI.importExcel(formData);
        
        if (response.success) {
          const stats = response.data;
          const message = `Data imported successfully!\n\n` +
            `📊 Import Statistics:\n` +
            `• Total rows processed: ${stats.totalRows || 'N/A'}\n` +
            `• Successfully imported: ${stats.imported}\n` +
            `• Skipped rows: ${stats.skippedRows || 'N/A'}\n` +
            `• Errors: ${stats.errors ? stats.errors.length : 0}`;
          
          alert(message);
          
          if (stats.errors && stats.errors.length > 0) {
            console.warn('Import warnings:', stats.errors);
            // Show first few errors in console for debugging
            console.log('First 5 errors:', stats.errors.slice(0, 5));
          }
          
          setShowImportModal(false);
          setSelectedFile(null);
          // Refresh transactions and settings to show imported data
          await Promise.all([
            refreshTransactions(),
            loadData()
          ]);
        } else {
          setImportError(response.message || 'Import failed');
        }
      } else {
        setImportError('Unsupported file format. Please use JSON, CSV, or Excel files.');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportError(error.message || 'Error importing file');
    } finally {
      setImportLoading(false);
    }
  };

  const clearAllData = async () => {
    try {
      // Clear all data from backend
      await Promise.all([
        // Clear all transactions
        transactionsAPI.deleteAll(),
        // Reset settings to defaults
        settingsAPI.update({
          accounts: [],
          categories: {},
          accountGroups: [],
          accountMapping: {},
          csvConversionDetails: {}
        })
      ]);
      
      // Refresh data from backend
      await refreshTransactions();
      
      alert('All data has been cleared successfully!');
      setShowClearModal(false);
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Error clearing data. Please try again.');
    }
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your accounts, categories, and application data</p>
      </div>

      <div className="settings-nav">
        {sections.map(section => (
          <button
            key={section.id}
            className={`nav-btn ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {activeSection === 'accounts' && <AccountManager />}
        {activeSection === 'categories' && <CategoryManager />}
        
        {activeSection === 'data' && (
          <div className="data-management">
            <h2>Data Management</h2>
            
            <div className="data-actions">
              <div className="action-card">
                <div className="action-header">
                  <Download size={24} />
                  <h3>Export Data</h3>
                </div>
                <p>Download all your financial data as a backup file</p>
                <button 
                  className="action-btn export"
                  onClick={() => setShowExportModal(true)}
                >
                  Export Data
                </button>
              </div>

              <div className="action-card">
                <div className="action-header">
                  <Upload size={24} />
                  <h3>Import Data</h3>
                </div>
                <p>Restore your data from a previously exported backup file</p>
                <button 
                  className="action-btn import"
                  onClick={() => setShowImportModal(true)}
                >
                  Import Data
                </button>
              </div>

              <div className="action-card danger">
                <div className="action-header">
                  <Trash2 size={24} />
                  <h3>Clear All Data</h3>
                </div>
                <p>Remove all transactions, accounts, and categories (cannot be undone)</p>
                <button 
                  className="action-btn danger"
                  onClick={() => setShowClearModal(true)}
                >
                  Clear All Data
                </button>
              </div>
            </div>

            <div className="data-stats">
              <h3>Data Statistics</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Transactions:</span>
                  <span className="stat-value">{state.transactions.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Accounts:</span>
                  <span className="stat-value">{state.accounts.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Categories:</span>
                  <span className="stat-value">{Object.keys(state.categories).length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Account Groups:</span>
                  <span className="stat-value">{state.accountGroups.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'about' && (
          <div className="about-section">
            <h2>About Finance Manager</h2>
            <div className="about-content">
              <p>
                Finance Manager is a modern, React-based personal finance tracking application
                that helps you manage your income, expenses, and financial goals.
              </p>
              
              <div className="features-list">
                <h3>Features</h3>
                <ul>
                  <li>✅ Track income and expenses</li>
                  <li>✅ Categorize transactions</li>
                  <li>✅ Multiple account support</li>
                  <li>✅ Visual analytics and charts</li>
                  <li>✅ Data export and import</li>
                  <li>✅ Mobile-responsive design</li>
                  <li>✅ Local data storage</li>
                </ul>
              </div>

              <div className="tech-info">
                <h3>Technology Stack</h3>
                <ul>
                  <li>React.js with Hooks</li>
                  <li>Context API for state management</li>
                  <li>Local Storage for data persistence</li>
                  <li>CSS Modules for styling</li>
                  <li>Lucide React for icons</li>
                </ul>
              </div>

              <div className="privacy-info">
                <h3>Privacy & Security</h3>
                <p>
                  All your financial data is stored locally in your browser. No data is
                  sent to external servers, ensuring complete privacy and security of
                  your financial information.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Export Data</h3>
              <button onClick={() => setShowExportModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>This will download all your financial data as a JSON file that you can use as a backup or to import into another device.</p>
              <div className="export-info">
                <p><strong>Includes:</strong></p>
                <ul>
                  <li>{state.transactions.length} transactions</li>
                  <li>{state.accounts.length} accounts</li>
                  <li>{Object.keys(state.categories).length} categories</li>
                  <li>Account groups and mappings</li>
                </ul>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowExportModal(false)}>Cancel</button>
              <button className="primary" onClick={exportData}>Export Data</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Import Data</h3>
              <button onClick={() => setShowImportModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="import-warning">
                <AlertTriangle size={20} />
                <p><strong>Warning:</strong> This will replace all your current data with the imported data. Make sure to export your current data first if you want to keep it.</p>
              </div>
              <div className="file-input">
                <label htmlFor="import-file">Select file:</label>
                <input
                  type="file"
                  id="import-file"
                  accept=".json,.csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={importLoading}
                />
                {selectedFile && (
                  <div className="selected-file">
                    <p><strong>Selected file:</strong> {selectedFile.name}</p>
                    <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                )}
                {importLoading && <p>Importing data...</p>}
                {importError && <p style={{ color: 'red' }}>{importError}</p>}
              </div>
              <div className="upload-actions">
                <button
                  type="button"
                  className="upload-btn"
                  onClick={handleUpload}
                  disabled={!selectedFile || importLoading}
                >
                  {importLoading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowImportModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Modal */}
      {showClearModal && (
        <div className="modal-overlay" onClick={() => setShowClearModal(false)}>
          <div className="modal danger" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Clear All Data</h3>
              <button onClick={() => setShowClearModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="danger-warning">
                <AlertTriangle size={24} />
                <p><strong>This action cannot be undone!</strong></p>
                <p>All your transactions, accounts, categories, and settings will be permanently deleted.</p>
              </div>
              <p>Type "DELETE" to confirm:</p>
              <input
                type="text"
                id="confirm-delete"
                placeholder="Type DELETE to confirm"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowClearModal(false)}>Cancel</button>
              <button 
                className="danger" 
                onClick={() => {
                  const confirmInput = document.getElementById('confirm-delete');
                  if (confirmInput.value === 'DELETE') {
                    clearAllData();
                  } else {
                    alert('Please type "DELETE" to confirm');
                  }
                }}
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;