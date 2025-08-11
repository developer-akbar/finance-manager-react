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
  const { state, loadData, refreshTransactions } = useApp();
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState('accounts');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [importMode, setImportMode] = useState('override'); // 'override' or 'merge'

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
            
            // Handle both formats: { transactions: [...] } and direct array [...]
            let transactionsArray;
            if (data.transactions && Array.isArray(data.transactions)) {
              // Format: { transactions: [...] }
              transactionsArray = data.transactions;
            } else if (Array.isArray(data)) {
              // Format: direct array [...]
              transactionsArray = data;
            } else {
              setImportError('Invalid JSON format. Expected transactions array or object with transactions property.');
              setImportLoading(false);
              return;
            }
            
            const response = await importAPI.fromJSON(transactionsArray, importMode);
              
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
          } catch (error) {
            console.error('JSON parsing error:', error);
            setImportError(`Error reading JSON file: ${error.message}. Please check the file format.`);
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
        
        const response = await importAPI.importExcel(formData, importMode);
        
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
      await Promise.all([
        refreshTransactions(),
        loadData()
      ]);
      
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
                  <Upload size={24} />
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
                  <Download size={24} />
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

              <div className="action-card">
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
                Finance Manager is a modern, full-stack personal finance management application 
                built with React.js frontend and Express.js + MongoDB backend. Track your income, 
                expenses, and financial goals with a beautiful, responsive interface featuring 
                elegant design, dark mode support, and comprehensive financial analytics.
              </p>
              
              <div className="features-list">
                <h3>✨ Key Features</h3>
                <ul>
                  <li>✅ <strong>Transaction Management</strong> - Add, edit, delete transactions with in-place editing</li>
                  <li>✅ <strong>Account Management</strong> - Multiple accounts with real-time balance tracking</li>
                  <li>✅ <strong>Smart Categorization</strong> - Custom categories and subcategories</li>
                  <li>✅ <strong>Advanced Analytics</strong> - Interactive charts and financial insights</li>
                  <li>✅ <strong>Data Import/Export</strong> - Excel, CSV, and JSON support with smart parsing</li>
                  <li>✅ <strong>Dark/Light Mode</strong> - Toggle between themes with persistent preference</li>
                  <li>✅ <strong>Responsive Design</strong> - Works perfectly on desktop, tablet, and mobile</li>
                  <li>✅ <strong>Date Navigation</strong> - Smart month/year navigation with quick selection</li>
                  <li>✅ <strong>Search & Filter</strong> - Advanced filtering by date, category, account</li>
                  <li>✅ <strong>Bulk Operations</strong> - Import multiple transactions at once</li>
                </ul>
              </div>

              <div className="tech-info">
                <h3>🛠️ Technology Stack</h3>
                <ul>
                  <li><strong>Frontend:</strong> React.js with Hooks and Context API</li>
                  <li><strong>Backend:</strong> Node.js with Express.js</li>
                  <li><strong>Database:</strong> MongoDB with Mongoose ODM</li>
                  <li><strong>Authentication:</strong> JWT-based secure authentication</li>
                  <li><strong>Styling:</strong> CSS Custom Properties with responsive design</li>
                  <li><strong>Icons:</strong> Lucide React for modern iconography</li>
                  <li><strong>Data Import:</strong> Excel.js for Excel file processing</li>
                  <li><strong>Charts:</strong> Interactive data visualization</li>
                </ul>
              </div>

              <div className="architecture-info">
                <h3>🏗️ Architecture</h3>
                <ul>
                  <li><strong>Component-Based:</strong> Modular React components with reusable design</li>
                  <li><strong>State Management:</strong> React Context API for global state</li>
                  <li><strong>API Layer:</strong> RESTful API with proper error handling</li>
                  <li><strong>Data Validation:</strong> Comprehensive input validation and sanitization</li>
                  <li><strong>Security:</strong> JWT authentication with bcrypt password hashing</li>
                  <li><strong>Performance:</strong> Optimized queries and efficient data loading</li>
                </ul>
              </div>

              <div className="privacy-info">
                <h3>🔐 Privacy & Security</h3>
                <p>
                  Your financial data is protected with industry-standard security measures:
                </p>
                <ul>
                  <li><strong>JWT Authentication:</strong> Secure token-based authentication</li>
                  <li><strong>Password Hashing:</strong> bcryptjs for secure password storage</li>
                  <li><strong>Data Isolation:</strong> Each user's data is completely private</li>
                  <li><strong>Input Validation:</strong> All inputs validated and sanitized</li>
                  <li><strong>Error Handling:</strong> Secure error responses without data leakage</li>
                </ul>
              </div>

              <div className="version-info">
                <h3>📋 Version Information</h3>
                <p><strong>Current Version:</strong> 2.0.0</p>
                <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong>License:</strong> MIT License</p>
              </div>

              <div className="developer-info">
                <h3>👨‍💻 Developer</h3>
                <p><strong>Built with ❤️ by:</strong> developer-akbar</p>
                <p><strong>GitHub:</strong> <a href="https://github.com/developer-akbar" target="_blank" rel="noopener noreferrer">github.com/developer-akbar</a></p>
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
                <p><strong>Warning:</strong> Choose how you want to import the data:</p>
              </div>
              
              <div className="import-mode-selection">
                <label>
                  <input
                    type="radio"
                    name="importMode"
                    value="override"
                    checked={importMode === 'override'}
                    onChange={(e) => setImportMode(e.target.value)}
                    disabled={importLoading}
                  />
                  <strong>Override Mode:</strong> Replace all existing data with imported data
                </label>
                <label>
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={(e) => setImportMode(e.target.value)}
                    disabled={importLoading}
                  />
                  <strong>Merge Mode:</strong> Add imported data to existing data (skip duplicates)
                </label>
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