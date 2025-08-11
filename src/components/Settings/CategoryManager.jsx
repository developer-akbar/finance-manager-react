import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { settingsAPI } from '../../services/api';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import './CategoryManager.css';

const CategoryManager = () => {
  const { state, loadData } = useApp();
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('Expense');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const saveCategories = async (categories) => {
    try {
      setLoading(true);
      const response = await settingsAPI.update({ categories });
      if (response.success) {
        await loadData(); // Refresh data from backend
      } else {
        alert('Failed to save categories: ' + response.message);
      }
    } catch (error) {
      console.error('Error saving categories:', error);
      alert('Error saving categories: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;

    const updatedCategories = {
      ...state.categories,
      [newCategoryName.trim()]: {
        type: newCategoryType,
        subcategories: []
      }
    };

    await saveCategories(updatedCategories);
    setNewCategoryName('');
  };

  const updateCategory = async (oldName, newName) => {
    if (!newName.trim() || oldName === newName.trim()) {
      setEditingCategory(null);
      return;
    }

    const updatedCategories = { ...state.categories };
    updatedCategories[newName.trim()] = updatedCategories[oldName];
    delete updatedCategories[oldName];

    await saveCategories(updatedCategories);
    setEditingCategory(null);
  };

  const deleteCategory = async (categoryName) => {
    if (!window.confirm(`Are you sure you want to delete "${categoryName}"?`)) return;

    // Check if category is used in transactions
    const hasTransactions = state.transactions.some(t => t.Category === categoryName);
    if (hasTransactions) {
      alert('Cannot delete category that has transactions. Please delete or move the transactions first.');
      return;
    }

    const updatedCategories = { ...state.categories };
    delete updatedCategories[categoryName];

    await saveCategories(updatedCategories);
  };

  const addSubcategory = async () => {
    if (!newSubcategoryName.trim() || !selectedCategory) return;

    const updatedCategories = { ...state.categories };
    if (!updatedCategories[selectedCategory].subcategories.includes(newSubcategoryName.trim())) {
      updatedCategories[selectedCategory].subcategories.push(newSubcategoryName.trim());
    }

    await saveCategories(updatedCategories);
    setNewSubcategoryName('');
    setSelectedCategory('');
  };

  const updateSubcategory = async (categoryName, oldSubcategory, newSubcategory) => {
    if (!newSubcategory.trim()) return;

    const updatedCategories = { ...state.categories };
    const subcategories = updatedCategories[categoryName].subcategories;
    const index = subcategories.indexOf(oldSubcategory);
    
    if (index > -1) {
      subcategories[index] = newSubcategory.trim();
    }

    await saveCategories(updatedCategories);
    setEditingSubcategory(null);
  };

  const deleteSubcategory = async (categoryName, subcategory) => {
    if (!window.confirm(`Are you sure you want to delete "${subcategory}"?`)) return;

    // Check if subcategory is used in transactions
    const hasTransactions = state.transactions.some(t => 
      t.Category === categoryName && t.Subcategory === subcategory
    );
    
    if (hasTransactions) {
      alert('Cannot delete subcategory that has transactions. Please delete or move the transactions first.');
      return;
    }

    const updatedCategories = { ...state.categories };
    updatedCategories[categoryName].subcategories = updatedCategories[categoryName].subcategories
      .filter(sub => sub !== subcategory);

    await saveCategories(updatedCategories);
  };

  const expenseCategories = Object.entries(state.categories).filter(([, data]) => data.type === 'Expense');
  const incomeCategories = Object.entries(state.categories).filter(([, data]) => data.type === 'Income');

  return (
    <div className="category-manager">
      <h2>Category Management</h2>
      
      {/* Add New Category */}
      <div className="section">
        <h3>Add New Category</h3>
        <div className="add-item">
          <input
            type="text"
            placeholder="Category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <select
            value={newCategoryType}
            onChange={(e) => setNewCategoryType(e.target.value)}
          >
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
          </select>
          <button onClick={addCategory} disabled={!newCategoryName.trim()}>
            <Plus size={16} />
            Add Category
          </button>
        </div>
      </div>

      {/* Add New Subcategory */}
      <div className="section">
        <h3>Add New Subcategory</h3>
        <div className="add-item">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Select category</option>
            {Object.keys(state.categories).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Subcategory name"
            value={newSubcategoryName}
            onChange={(e) => setNewSubcategoryName(e.target.value)}
          />
          <button onClick={addSubcategory} disabled={!newSubcategoryName.trim() || !selectedCategory}>
            <Plus size={16} />
            Add Subcategory
          </button>
        </div>
      </div>

      {/* Expense Categories */}
      <div className="section">
        <h3>Expense Categories ({expenseCategories.length})</h3>
        <div className="categories-list">
          {expenseCategories.map(([categoryName, categoryData]) => (
            <div key={categoryName} className="category-item expense">
              <div className="category-header">
                {editingCategory === categoryName ? (
                  <div className="edit-item">
                    <input
                      type="text"
                      defaultValue={categoryName}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          updateCategory(categoryName, e.target.value);
                        }
                      }}
                    />
                    <button onClick={() => updateCategory(categoryName, document.querySelector('.edit-item input').value)}>
                      <Save size={16} />
                    </button>
                    <button onClick={() => setEditingCategory(null)}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="category-info">
                    <span className="category-name">{categoryName}</span>
                    <span className="category-count">
                      {state.transactions.filter(t => t.Category === categoryName).length} transactions
                    </span>
                    <div className="category-actions">
                      <button onClick={() => setEditingCategory(categoryName)}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteCategory(categoryName)} className="delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {categoryData.subcategories.length > 0 && (
                <div className="subcategories">
                  <h5>Subcategories:</h5>
                  <div className="subcategories-list">
                    {categoryData.subcategories.map(subcategory => (
                      <div key={subcategory} className="subcategory-item">
                        {editingSubcategory === `${categoryName}-${subcategory}` ? (
                          <div className="edit-subcategory">
                            <input
                              type="text"
                              defaultValue={subcategory}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updateSubcategory(categoryName, subcategory, e.target.value);
                                }
                              }}
                            />
                            <button onClick={() => updateSubcategory(categoryName, subcategory, document.querySelector('.edit-subcategory input').value)}>
                              <Save size={14} />
                            </button>
                            <button onClick={() => setEditingSubcategory(null)}>
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="subcategory-content">
                            <span className="subcategory-name">{subcategory}</span>
                            <span className="subcategory-count">
                              {state.transactions.filter(t => 
                                t.Category === categoryName && t.Subcategory === subcategory
                              ).length}
                            </span>
                            <div className="subcategory-actions">
                              <button onClick={() => setEditingSubcategory(`${categoryName}-${subcategory}`)}>
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => deleteSubcategory(categoryName, subcategory)} className="delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Income Categories */}
      <div className="section">
        <h3>Income Categories ({incomeCategories.length})</h3>
        <div className="categories-list">
          {incomeCategories.map(([categoryName, categoryData]) => (
            <div key={categoryName} className="category-item income">
              <div className="category-header">
                {editingCategory === categoryName ? (
                  <div className="edit-item">
                    <input
                      type="text"
                      defaultValue={categoryName}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          updateCategory(categoryName, e.target.value);
                        }
                      }}
                    />
                    <button onClick={() => updateCategory(categoryName, document.querySelector('.edit-item input').value)}>
                      <Save size={16} />
                    </button>
                    <button onClick={() => setEditingCategory(null)}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="category-info">
                    <span className="category-name">{categoryName}</span>
                    <span className="category-count">
                      {state.transactions.filter(t => t.Category === categoryName).length} transactions
                    </span>
                    <div className="category-actions">
                      <button onClick={() => setEditingCategory(categoryName)}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteCategory(categoryName)} className="delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {categoryData.subcategories.length > 0 && (
                <div className="subcategories">
                  <h5>Subcategories:</h5>
                  <div className="subcategories-list">
                    {categoryData.subcategories.map(subcategory => (
                      <div key={subcategory} className="subcategory-item">
                        {editingSubcategory === `${categoryName}-${subcategory}` ? (
                          <div className="edit-subcategory">
                            <input
                              type="text"
                              defaultValue={subcategory}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updateSubcategory(categoryName, subcategory, e.target.value);
                                }
                              }}
                            />
                            <button onClick={() => updateSubcategory(categoryName, subcategory, document.querySelector('.edit-subcategory input').value)}>
                              <Save size={14} />
                            </button>
                            <button onClick={() => setEditingSubcategory(null)}>
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="subcategory-content">
                            <span className="subcategory-name">{subcategory}</span>
                            <span className="subcategory-count">
                              {state.transactions.filter(t => 
                                t.Category === categoryName && t.Subcategory === subcategory
                              ).length}
                            </span>
                            <div className="subcategory-actions">
                              <button onClick={() => setEditingSubcategory(`${categoryName}-${subcategory}`)}>
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => deleteSubcategory(categoryName, subcategory)} className="delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;