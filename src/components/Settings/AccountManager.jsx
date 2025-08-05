import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import './AccountManager.css';

const AccountManager = () => {
  const { state } = useApp();
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');

  const saveAccounts = (accounts) => {
    localStorage.setItem('accounts', JSON.stringify(accounts));
    window.location.reload(); // Simple refresh to update state
  };

  const saveAccountGroups = (groups) => {
    localStorage.setItem('accountGroups', JSON.stringify(groups));
    window.location.reload();
  };

  const saveAccountMapping = (mapping) => {
    localStorage.setItem('accountMapping', JSON.stringify(mapping));
    window.location.reload();
  };

  const addAccount = () => {
    if (!newAccountName.trim() || !selectedGroup) return;

    const updatedAccounts = [...state.accounts, newAccountName.trim()];
    const updatedMapping = { ...state.accountMapping };
    
    if (!updatedMapping[selectedGroup]) {
      updatedMapping[selectedGroup] = [];
    }
    updatedMapping[selectedGroup].push(newAccountName.trim());

    saveAccounts(updatedAccounts);
    saveAccountMapping(updatedMapping);
    setNewAccountName('');
    setSelectedGroup('');
  };

  const updateAccount = (oldName, newName) => {
    if (!newName.trim()) return;

    const updatedAccounts = state.accounts.map(acc => acc === oldName ? newName.trim() : acc);
    const updatedMapping = { ...state.accountMapping };
    
    // Update in mapping
    Object.keys(updatedMapping).forEach(group => {
      updatedMapping[group] = updatedMapping[group].map(acc => acc === oldName ? newName.trim() : acc);
    });

    saveAccounts(updatedAccounts);
    saveAccountMapping(updatedMapping);
    setEditingAccount(null);
  };

  const deleteAccount = (accountName) => {
    if (!window.confirm(`Are you sure you want to delete "${accountName}"?`)) return;

    // Check if account is used in transactions
    const hasTransactions = state.transactions.some(t => t.Account === accountName);
    if (hasTransactions) {
      alert('Cannot delete account that has transactions. Please delete or move the transactions first.');
      return;
    }

    const updatedAccounts = state.accounts.filter(acc => acc !== accountName);
    const updatedMapping = { ...state.accountMapping };
    
    // Remove from mapping
    Object.keys(updatedMapping).forEach(group => {
      updatedMapping[group] = updatedMapping[group].filter(acc => acc !== accountName);
    });

    saveAccounts(updatedAccounts);
    saveAccountMapping(updatedMapping);
  };

  const addGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup = {
      id: Date.now(),
      name: newGroupName.trim()
    };

    const updatedGroups = [...state.accountGroups, newGroup];
    const updatedMapping = { ...state.accountMapping, [newGroupName.trim()]: [] };

    saveAccountGroups(updatedGroups);
    saveAccountMapping(updatedMapping);
    setNewGroupName('');
  };

  const updateGroup = (oldName, newName) => {
    if (!newName.trim()) return;

    const updatedGroups = state.accountGroups.map(group => 
      group.name === oldName ? { ...group, name: newName.trim() } : group
    );
    
    const updatedMapping = { ...state.accountMapping };
    if (updatedMapping[oldName]) {
      updatedMapping[newName.trim()] = updatedMapping[oldName];
      delete updatedMapping[oldName];
    }

    saveAccountGroups(updatedGroups);
    saveAccountMapping(updatedMapping);
    setEditingGroup(null);
  };

  const deleteGroup = (groupName) => {
    if (!window.confirm(`Are you sure you want to delete group "${groupName}"?`)) return;

    const groupAccounts = state.accountMapping[groupName] || [];
    if (groupAccounts.length > 0) {
      alert('Cannot delete group that contains accounts. Please move or delete the accounts first.');
      return;
    }

    const updatedGroups = state.accountGroups.filter(group => group.name !== groupName);
    const updatedMapping = { ...state.accountMapping };
    delete updatedMapping[groupName];

    saveAccountGroups(updatedGroups);
    saveAccountMapping(updatedMapping);
  };

  return (
    <div className="account-manager">
      <h2>Account Management</h2>
      
      {/* Account Groups Section */}
      <div className="section">
        <h3>Account Groups</h3>
        
        <div className="add-item">
          <input
            type="text"
            placeholder="New group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <button onClick={addGroup} disabled={!newGroupName.trim()}>
            <Plus size={16} />
            Add Group
          </button>
        </div>

        <div className="items-list">
          {state.accountGroups.map(group => (
            <div key={group.id} className="item">
              {editingGroup === group.name ? (
                <div className="edit-item">
                  <input
                    type="text"
                    defaultValue={group.name}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        updateGroup(group.name, e.target.value);
                      }
                    }}
                  />
                  <button onClick={() => updateGroup(group.name, document.querySelector('.edit-item input').value)}>
                    <Save size={16} />
                  </button>
                  <button onClick={() => setEditingGroup(null)}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="item-content">
                  <span className="item-name">{group.name}</span>
                  <span className="item-count">
                    {state.accountMapping[group.name]?.length || 0} accounts
                  </span>
                  <div className="item-actions">
                    <button onClick={() => setEditingGroup(group.name)}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteGroup(group.name)} className="delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Accounts Section */}
      <div className="section">
        <h3>Accounts</h3>
        
        <div className="add-item">
          <input
            type="text"
            placeholder="New account name"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
          />
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="">Select group</option>
            {state.accountGroups.map(group => (
              <option key={group.id} value={group.name}>{group.name}</option>
            ))}
          </select>
          <button onClick={addAccount} disabled={!newAccountName.trim() || !selectedGroup}>
            <Plus size={16} />
            Add Account
          </button>
        </div>

        <div className="accounts-by-group">
          {state.accountGroups.map(group => {
            const groupAccounts = state.accountMapping[group.name] || [];
            return (
              <div key={group.id} className="group-section">
                <h4>{group.name}</h4>
                <div className="items-list">
                  {groupAccounts.map(account => (
                    <div key={account} className="item">
                      {editingAccount === account ? (
                        <div className="edit-item">
                          <input
                            type="text"
                            defaultValue={account}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateAccount(account, e.target.value);
                              }
                            }}
                          />
                          <button onClick={() => updateAccount(account, document.querySelector('.edit-item input').value)}>
                            <Save size={16} />
                          </button>
                          <button onClick={() => setEditingAccount(null)}>
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="item-content">
                          <span className="item-name">{account}</span>
                          <span className="item-count">
                            {state.transactions.filter(t => t.Account === account).length} transactions
                          </span>
                          <div className="item-actions">
                            <button onClick={() => setEditingAccount(account)}>
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => deleteAccount(account)} className="delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {groupAccounts.length === 0 && (
                    <p className="no-items">No accounts in this group</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AccountManager;