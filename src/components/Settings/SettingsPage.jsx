import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import './SettingsPage.css';

const SettingsPage = () => {
  const { state, dispatch } = useApp();
  const { accounts, categories } = state;

  // State for accounts management
  const [accountGroups, setAccountGroups] = useState([
    { id: 1, name: "Cash" },
    { id: 2, name: "Bank Accounts" },
    { id: 3, name: "Credit Cards" }
  ]);
  const [accountMappings, setAccountMappings] = useState({
    "Cash": ["Cash"],
    "Bank Accounts": ["Bank Accounts"],
    "Credit Cards": ["Credit Cards"]
  });

  // State for categories management
  const [categoryGroups, setCategoryGroups] = useState({});

  // Modal states
  const [showAccountGroupModal, setShowAccountGroupModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showUnmappedAccountModal, setShowUnmappedAccountModal] = useState(false);
  const [showUnmappedSubcategoryModal, setShowUnmappedSubcategoryModal] = useState(false);

  // Form states
  const [editingAccountGroup, setEditingAccountGroup] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [selectedUnmappedAccount, setSelectedUnmappedAccount] = useState(null);
  const [selectedUnmappedSubcategory, setSelectedUnmappedSubcategory] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState('accounts');

  useEffect(() => {
    // Initialize account mappings from existing accounts
    if (accounts && accounts.length > 0) {
      const unmappedAccounts = accounts.filter(acc => 
        !Object.values(accountMappings).flat().includes(acc)
      );
      
      if (unmappedAccounts.length > 0) {
        setAccountMappings(prev => ({
          ...prev,
          "Unmapped Accounts": unmappedAccounts
        }));
      }
    }

    // Initialize category groups from existing categories
    if (categories) {
      setCategoryGroups(categories);
    }
  }, [accounts, categories]);

  // Get unmapped accounts
  const getUnmappedAccounts = () => {
    const mappedAccounts = Object.values(accountMappings).flat();
    return accounts.filter(account => !mappedAccounts.includes(account));
  };

  // Get unmapped subcategories
  const getUnmappedSubcategories = () => {
    return categoryGroups["Unmapped Subcategories"] || [];
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="setting-items">
          <div className="mobile-header"></div>
          <ul>
            <li 
              className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
              onClick={() => setActiveTab('accounts')}
            >
              Accounts
            </li>
            <li 
              className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              Categories
            </li>
          </ul>
        </div>

        <div className="setting-items-content">
          <div className="setting-header mobile-header sticky-container">
            <p className="back-button" onClick={() => setActiveTab('')}>
              &larr; &nbsp;&nbsp;
              <span className="selected-setting-item">
                {activeTab === 'accounts' ? 'Accounts' : 'Categories'}
              </span>
            </p>
          </div>

          {/* Accounts Tab */}
          {activeTab === 'accounts' && (
            <div className="accounts-settings">
              <div className="group-container">
                <div className="cta-buttons">
                  <button 
                    className="add-account-group-btn"
                    onClick={() => setShowAccountGroupModal(true)}
                  >
                    Add Account Group
                  </button>
                  <button 
                    className="add-account-btn"
                    onClick={() => setShowAccountModal(true)}
                  >
                    Add New Account
                  </button>
                </div>
                
                <div className="account-groups-list grid-container mapping-container">
                  {accountGroups.map(group => (
                    <div key={group.id} className="group-box" data-id={group.id}>
                      <h3>
                        {group.name}
                        <span className="edit-group">&#9997;</span>
                      </h3>
                      <ul className="mapped-accounts">
                        {accountMappings[group.name]?.map(account => (
                          <li 
                            key={account} 
                            className="account-item"
                            data-account={account}
                          >
                            <span className="account-name">{account}</span>
                          </li>
                        ))}
                      </ul>
                      <span className="add-account-btn"></span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="unmapped-accounts mapping-container">
                <h3 className="unmapped-accounts-heading">
                  Unmapped Accounts
                </h3>
                <div className="accounts-list">
                  {getUnmappedAccounts().map(account => (
                    <div 
                      key={account}
                      className="account-item unmapped"
                      data-account={account}
                    >
                      {account}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="categories-settings">
              <div className="group-container">
                <div className="cta-buttons">
                  <button 
                    className="add-category-btn"
                    onClick={() => setShowCategoryModal(true)}
                  >
                    Add Category
                  </button>
                  <button 
                    className="add-subcategory-btn"
                    onClick={() => setShowSubcategoryModal(true)}
                  >
                    Add New Subcategory
                  </button>
                </div>
                
                <div className="categories-list grid-container mapping-container">
                  {Object.entries(categoryGroups).map(([categoryName, categoryData]) => {
                    if (categoryName === 'Unmapped Subcategories') return null;
                    
                    return (
                      <div key={categoryName} className={`group-box ${categoryData.type.toLowerCase()}-box`}>
                        <h3 className={categoryData.type.toLowerCase()}>
                          {categoryName}
                          <span className="edit-group edit-category">&#9997;</span>
                        </h3>
                        <ul className="mapped-subcategories">
                          {categoryData.subcategories?.map(subcategory => (
                            <li 
                              key={subcategory}
                              className="subcategory-item"
                              data-subcategory={subcategory}
                            >
                              <span className="subcategory-name">{subcategory}</span>
                            </li>
                          ))}
                        </ul>
                        <span className="add-subcategory-btn"></span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="unmapped-subcategories mapping-container">
                <h3 className="unmapped-subcategories-heading">
                  Unmapped Subcategories
                </h3>
                <div className="subcategories-list">
                  {getUnmappedSubcategories().map(subcategory => (
                    <div 
                      key={subcategory}
                      className="subcategory-item unmapped"
                      data-subcategory={subcategory}
                    >
                      {subcategory}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
