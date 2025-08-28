import React, { useState } from "react";
import { Edit, Trash2, X } from "lucide-react";
import { formatIndianCurrency } from "../../utils/calculations";
import "./TransactionList.css";

const TransactionList = ({
  transactions,
  onEdit,
  onDelete,
  showAccount = false,
  showSubcategory = true,
  dayHeaderFormat = "default", // 'default', 'accounts', 'categories'
  accountName = null, // For account-specific calculations
  accounts = [], // Pass accounts as prop
  categories = {}, // Pass categories as prop
}) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    Date: '',
    Account: '',
    Category: '',
    Subcategory: '',
    Note: '',
    INR: '',
    'Income/Expense': '',
    Description: '',
    Amount: '',
    Currency: 'INR'
  });
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false);
  const [showToAccountDropdown, setShowToAccountDropdown] = useState(false);

  // Get accounts and categories from props
  const getAccounts = () => {
    return accounts || [];
  };

  const getCategories = (transactionType) => {
    if (!categories) return [];

    // For Transfer transactions, show all accounts as categories
    if (transactionType === "Transfer") {
      return accounts || [];
    }

    // Filter categories based on transaction type
    return Object.entries(categories)
      .filter(([, categoryData]) => categoryData.type === transactionType)
      .map(([categoryName]) => categoryName);
  };

  const getSubcategories = (category) => {
    if (!categories || !category) return [];

    // For Transfer transactions, subcategories are not applicable
    // Return empty array for transfers
    if (editForm["Income/Expense"] === "Transfer") {
      return [];
    }

    const categoryData = categories[category];

    // Ensure we always return an array
    if (categoryData && Array.isArray(categoryData.subcategories)) {
      return categoryData.subcategories;
    }

    // If categoryData is not an array, return empty array
    return [];
  };

  // Group transactions by date
  const groupTransactionsByDate = (transactions) => {
    const grouped = {};

    transactions.forEach((transaction) => {
      const date = new Date(
        transaction.Date.split("/").reverse().join("-")
      ).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });

    return grouped;
  };

  // Calculate day totals
  const calculateDayTotals = (dayTransactions) => {
    return dayTransactions.reduce(
      (totals, transaction) => {
        const amount = parseFloat(transaction.INR || transaction.Amount) || 0;

        if (transaction["Income/Expense"] === "Income") {
          totals.income += amount;
        } else if (transaction["Income/Expense"] === "Expense") {
          totals.expense += amount;
        }

        return totals;
      },
      { income: 0, expense: 0 }
    );
  };

  // Calculate account-specific totals (for Accounts page)
  const calculateAccountDayTotals = (dayTransactions, accountName) => {
    return dayTransactions.reduce(
      (totals, transaction) => {
        const amount = parseFloat(transaction.INR || transaction.Amount) || 0;

        // Deposits: Income or Transfer-Out where Category is the account
        if (
          transaction["Income/Expense"] === "Income" ||
          (transaction["Income/Expense"] === "Transfer-Out" &&
            transaction.Category === accountName)
        ) {
          totals.deposits += amount;
        }

        // Withdrawals: Expense or Transfer-Out where Account is the account
        if (
          transaction["Income/Expense"] === "Expense" ||
          (transaction["Income/Expense"] === "Transfer-Out" &&
            transaction.Account === accountName)
        ) {
          totals.withdrawals += amount;
        }

        return totals;
      },
      { deposits: 0, withdrawals: 0 }
    );
  };

  const groupedTransactions = groupTransactionsByDate(transactions);

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
    setIsEditMode(false);
    document.body.classList.add("modal-open");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTransaction(null);
    setIsEditMode(false);
    setEditForm({});
    setShowEditSuggestions(false);
    document.body.classList.remove("modal-open");
  };

  const handleEditTransaction = () => {
    setIsEditMode(true);
    setEditForm({
      Category: selectedTransaction.Category || "",
      Subcategory: selectedTransaction.Subcategory || "",
      Note: selectedTransaction.Note || "",
      Account: selectedTransaction.Account || "",
      Description: selectedTransaction.Description || "",
      "Income/Expense": selectedTransaction["Income/Expense"] || "Expense",
      Amount: selectedTransaction.INR || selectedTransaction.Amount || "",
      Date: selectedTransaction.Date || "",
    });
    // Ensure suggestions don't show automatically when editing
    setShowEditSuggestions(false);
  };

  const handleDeleteTransaction = () => {
    if (onDelete && selectedTransaction) {
      onDelete(selectedTransaction);
    }
    handleCloseModal();
  };

  const handleFormChange = (field, value) => {
    setEditForm((prev) => {
      const updatedForm = { ...prev, [field]: value };

      // If transaction type changed, reset category and subcategory
      if (field === "Income/Expense") {
        updatedForm.Category = "";
        updatedForm.Subcategory = "";
      }
      // If category changed, reset subcategory
      else if (field === "Category") {
        updatedForm.Subcategory = "";
      }

      return updatedForm;
    });
  };

  const handleUpdateTransaction = () => {
    if (onEdit && selectedTransaction) {
      const updatedTransaction = {
        ...selectedTransaction,
        ...editForm,
        INR: editForm.Amount, // Ensure INR field is updated
        Amount: editForm.Amount, // Ensure Amount field is updated
      };
      onEdit(updatedTransaction);
    }
    handleCloseModal();
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditForm({});
    setShowAccountDropdown(false);
    setShowCategoryDropdown(false);
    setShowSubcategoryDropdown(false);
    setShowToAccountDropdown(false);
  };

  const handleDropdownSelect = (field, value) => {
    setEditForm((prev) => {
      const updatedForm = { ...prev, [field]: value };

      // If transaction type changed, reset category and subcategory
      if (field === "Income/Expense") {
        updatedForm.Category = "";
        updatedForm.Subcategory = "";
      }
      // If category changed, reset subcategory
      else if (field === "Category") {
        updatedForm.Subcategory = "";
      }

      return updatedForm;
    });

    // Close dropdowns
    setShowAccountDropdown(false);
    setShowCategoryDropdown(false);
    setShowSubcategoryDropdown(false);
    setShowToAccountDropdown(false);
  };

  const toggleDropdown = (dropdownType) => {
    setShowAccountDropdown(
      dropdownType === "account" ? !showAccountDropdown : false
    );
    setShowCategoryDropdown(
      dropdownType === "category" ? !showCategoryDropdown : false
    );
    setShowSubcategoryDropdown(
      dropdownType === "subcategory" ? !showSubcategoryDropdown : false
    );
    setShowToAccountDropdown(
      dropdownType === "toAccount" ? !showToAccountDropdown : false
    );
  };

  const handleEditNoteChange = (e) => {
    const value = e.target.value;
    setEditForm(prev => ({ ...prev, Note: value }));
    setShowEditSuggestions(value.length > 0);
  };

  const handleEditNoteSelect = (note) => {
    setEditForm(prev => ({ ...prev, Note: note }));
    setShowEditSuggestions(false);
  };

  const handleEditNoteBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowEditSuggestions(false), 200);
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, []);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isEditMode && !event.target.closest(".custom-dropdown")) {
        setShowAccountDropdown(false);
        setShowCategoryDropdown(false);
        setShowSubcategoryDropdown(false);
        setShowToAccountDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditMode]);

  if (!transactions || transactions.length === 0) {
    return (
      <div className="no-transactions">
        <p>No transactions found for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="transactions-container">
      {Object.entries(groupedTransactions)
        .sort(([a], [b]) => new Date(b) - new Date(a))
        .map(([date, dayTransactions]) => {
          const dayTotals =
            dayHeaderFormat === "accounts"
              ? calculateAccountDayTotals(dayTransactions, accountName)
              : calculateDayTotals(dayTransactions);

          return (
            <div key={date} className="day-group">
              <div className="day-header" onClick={() => {
                // Emit a custom event so TransactionsList can open Add modal with this date
                const event = new CustomEvent('fm:add-transaction-for-date', { detail: { date } });
                window.dispatchEvent(event);
              }} style={{cursor:'pointer'}}>
                <h3 className="day-title">
                  {(() => {
                    const dateObj = new Date(date);
                    const day = dateObj.getDate();
                    const weekday = dateObj.toLocaleDateString("en-US", {
                      weekday: "short",
                    });
                    const month = dateObj.toLocaleDateString("en-US", {
                      month: "short",
                    });
                    const year = dateObj.getFullYear();
                    return `${weekday}, ${day} ${month} ${year}`;
                  })()}
                </h3>
                <div className="day-totals">
                  {dayHeaderFormat === "accounts" ? (
                    <>
                      <span className="deposits">
                        {formatIndianCurrency(dayTotals.deposits)}
                      </span>
                      <span className="withdrawals">
                        {formatIndianCurrency(dayTotals.withdrawals)}
                      </span>
                    </>
                  ) : dayHeaderFormat === "categories" ? (
                    <span
                      className={`day-amount ${
                        dayTotals.income > dayTotals.expense
                          ? "income"
                          : "expense"
                      }`}
                    >
                      {formatIndianCurrency(
                        dayTotals.income > dayTotals.expense
                          ? dayTotals.income
                          : dayTotals.expense
                      )}
                    </span>
                  ) : (
                    <>
                      <span className="income">
                        {formatIndianCurrency(dayTotals.income)}
                      </span>
                      <span className="expense">
                        {formatIndianCurrency(dayTotals.expense)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="day-transactions">
                {dayTransactions
                  .sort(
                    (a, b) =>
                      new Date(b.Date.split("/").reverse().join("-")) -
                      new Date(a.Date.split("/").reverse().join("-"))
                  )
                  .map((transaction, index) => (
                    <div
                      key={index}
                      className="transaction-item"
                      onClick={() => handleTransactionClick(transaction)}
                    >
                      <div className="transaction-grid">
                        <div className="transaction-category">
                          <span className="category-text">
                            {transaction.Category}
                          </span>
                          {showSubcategory && transaction.Subcategory && (
                            <span className="subcategory-text">
                              {transaction.Subcategory}
                            </span>
                          )}
                        </div>

                        <div className="transaction-note">
                          {transaction.Note && (
                            <span className="note-text">
                              {transaction.Note}
                            </span>
                          )}
                          {(() => {
                            // Try to parse time portion from Date string like "DD/MM/YYYY HH:MM[:SS] [AM|PM]"
                            const m = (transaction.Date || '').match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?\b/i);
                            if (!m) return null;
                            let [_, hh, mm, ss, ap] = m;
                            let hour = parseInt(hh, 10);
                            if (!ap) {
                              // Convert 24h to 12h
                              ap = hour >= 12 ? 'PM' : 'AM';
                              hour = hour % 12;
                              if (hour === 0) hour = 12;
                            } else {
                              ap = ap.toUpperCase();
                            }
                            const timeText = `${hour}:${mm} ${ap}`;
                            return <span className="account-text" style={{marginLeft: '8px'}}>{timeText}</span>;
                          })()}
                          {showAccount && transaction.Account && (
                            <span className="account-text">
                              {transaction.Account}
                            </span>
                          )}
                        </div>

                        <div className="transaction-description">
                          {transaction.Description && (
                            <span className="description-text">
                              {transaction.Description}
                            </span>
                          )}
                        </div>

                        <div className="transaction-amount">
                          <span
                            className={`amount ${transaction[
                              "Income/Expense"
                            ].toLowerCase()}`}
                          >
                            {formatIndianCurrency(
                              parseFloat(transaction.INR || transaction.Amount)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}

      {/* Transaction Details Modal */}
      {showModal && selectedTransaction && (
        <div className="transaction-modal-overlay" onClick={handleCloseModal}>
          <div
            className="transaction-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{isEditMode ? "Edit" : "Details"}</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            {isEditMode ? (
              <>
                <div className="modal-content">
                  <div className="edit-form">
                    {/* Type Selection - Buttons/Tabs */}
                    <div className="type-selection">
                      <div className="type-buttons">
                        <button
                          type="button"
                          className={`type-btn ${editForm["Income/Expense"] === 'Expense' ? 'active expense' : ''}`}
                          onClick={() => handleFormChange("Income/Expense", "Expense")}
                        >
                          Expense
                        </button>
                        <button
                          type="button"
                          className={`type-btn ${editForm["Income/Expense"] === 'Income' ? 'active income' : ''}`}
                          onClick={() => handleFormChange("Income/Expense", "Income")}
                        >
                          Income
                        </button>
                        <button
                          type="button"
                          className={`type-btn ${editForm["Income/Expense"] === 'Transfer-Out' ? 'active transfer' : ''}`}
                          onClick={() => handleFormChange("Income/Expense", "Transfer-Out")}
                        >
                          Transfer
                        </button>
                      </div>
                    </div>

                    {/* Date Field */}
                    <div className="form-row">
                      <label>Date</label>
                      <input
                        type="date"
                        value={
                          editForm.Date
                            ? new Date(
                                editForm.Date.split("/").reverse().join("-")
                              )
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) => {
                          const date = new Date(e.target.value);
                          const formattedDate = `${date
                            .getDate()
                            .toString()
                            .padStart(2, "0")}/${(date.getMonth() + 1)
                            .toString()
                            .padStart(2, "0")}/${date.getFullYear()}`;
                          handleFormChange("Date", formattedDate);
                        }}
                      />
                    </div>

                    {/* Account Field */}
                    <div className="form-row">
                      <label>
                        {editForm["Income/Expense"] === "Transfer"
                          ? "From Account"
                          : "Account"}
                      </label>
                      <div className="custom-dropdown">
                        <div
                          className={`dropdown-btn ${
                            showAccountDropdown ? "active" : ""
                          }`}
                          onClick={() => toggleDropdown("account")}
                        >
                          {editForm.Account ||
                            (editForm["Income/Expense"] === "Transfer"
                              ? "Select From Account"
                              : "Select Account")}
                        </div>
                        <div
                          className={`dropdown-grid ${
                            showAccountDropdown ? "show" : ""
                          }`}
                        >
                          {(getAccounts() || []).map((account) => (
                            <div
                              key={account}
                              className={`dropdown-item ${
                                editForm.Account === account ? "selected" : ""
                              }`}
                              onClick={() =>
                                handleDropdownSelect("Account", account)
                              }
                            >
                              {account}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Category and Subcategory Fields */}
                    {editForm["Income/Expense"] !== "Transfer" && (
                      <>
                        <div className="form-row">
                          <label>Category</label>
                          <div className="custom-dropdown">
                            <div
                              className={`dropdown-btn ${
                                showCategoryDropdown ? "active" : ""
                              }`}
                              onClick={() => toggleDropdown("category")}
                            >
                              {editForm.Category || "Select Category"}
                            </div>
                            <div
                              className={`dropdown-grid ${
                                showCategoryDropdown ? "show" : ""
                              }`}
                            >
                              {(
                                getCategories(editForm["Income/Expense"]) || []
                              ).map((category) => (
                                <div
                                  key={category}
                                  className={`dropdown-item ${
                                    editForm.Category === category ? "selected" : ""
                                  }`}
                                  onClick={() =>
                                    handleDropdownSelect("Category", category)
                                  }
                                >
                                  {category}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="form-row">
                          <label>Subcategory</label>
                          <div className="custom-dropdown">
                            <div
                              className={`dropdown-btn ${
                                showSubcategoryDropdown ? "active" : ""
                              }`}
                              onClick={() => toggleDropdown("subcategory")}
                            >
                              {editForm.Subcategory || "Select Subcategory"}
                            </div>
                            <div
                              className={`dropdown-grid ${
                                showSubcategoryDropdown ? "show" : ""
                              }`}
                            >
                              {(getSubcategories(editForm.Category) || []).map(
                                (subcategory) => (
                                  <div
                                    key={subcategory}
                                    className={`dropdown-item ${
                                      editForm.Subcategory === subcategory
                                        ? "selected"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      handleDropdownSelect(
                                        "Subcategory",
                                        subcategory
                                      )
                                    }
                                  >
                                    {subcategory}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* To Account for Transfer */}
                    {editForm["Income/Expense"] === "Transfer" && (
                      <div className="form-row">
                        <label>To Account</label>
                        <div className="custom-dropdown">
                          <div
                            className={`dropdown-btn ${
                              showToAccountDropdown ? "active" : ""
                            }`}
                            onClick={() => toggleDropdown("toAccount")}
                          >
                            {editForm.ToAccount || "Select To Account"}
                          </div>
                          <div
                            className={`dropdown-grid ${
                              showToAccountDropdown ? "show" : ""
                            }`}
                          >
                            {(getAccounts() || []).map((account) => (
                              <div
                                key={account}
                                className={`dropdown-item ${
                                  editForm.ToAccount === account ? "selected" : ""
                                }`}
                                onClick={() =>
                                  handleDropdownSelect("ToAccount", account)
                                }
                              >
                                {account}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Amount Field */}
                    <div className="form-row">
                      <label>Amount</label>
                      <input
                        type="number"
                        value={editForm.Amount}
                        onChange={(e) =>
                          handleFormChange("Amount", e.target.value)
                        }
                        placeholder="Enter amount"
                      />
                    </div>

                    {/* Note Field */}
                    <div className="form-row">
                      <label>Note</label>
                      <div className="note-input-container">
                        <input
                          type="text"
                          name="Note"
                          value={editForm.Note}
                          onChange={handleEditNoteChange}
                          onBlur={handleEditNoteBlur}
                          placeholder="Note"
                          required
                        />
                        {editForm.Note && (
                          <button
                            type="button"
                            className="note-clear-btn"
                            onClick={() => {
                              setEditForm(prev => ({ ...prev, Note: '' }));
                              setShowEditSuggestions(false);
                            }}
                          >
                            ×
                          </button>
                        )}
                        {showEditSuggestions && (
                          <div className="note-suggestions">
                            {Array.from(new Set(
                              (transactions || [])
                                .map(t => t.Note)
                                .filter(n => 
                                  n && 
                                  n.trim().length > 0 && 
                                  !n.includes('(') && 
                                  !n.includes(')') &&
                                  n.toLowerCase().includes(editForm.Note.toLowerCase())
                                )
                            ))
                              .slice(0, 10)
                              .map((note) => (
                                <div
                                  key={note}
                                  className="note-suggestion-item"
                                  onClick={() => handleEditNoteSelect(note)}
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
                      <label>Description</label>
                      <textarea
                        value={editForm.Description}
                        onChange={(e) =>
                          handleFormChange("Description", e.target.value)
                        }
                        placeholder="Enter description"
                        rows="3"
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className="modal-btn cancel-btn"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                  <button
                    className="modal-btn update-btn"
                    onClick={handleUpdateTransaction}
                  >
                    Update
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-content">
                  <div className="modal-row" onClick={handleEditTransaction} style={{cursor:'pointer'}}>
                    <span className="modal-label">Type:</span>
                    <span
                      className={`modal-value type-badge ${selectedTransaction[
                        "Income/Expense"
                      ].toLowerCase()}`}
                    >
                      {selectedTransaction["Income/Expense"]}
                    </span>
                  </div>

                  <div className="modal-row" onClick={handleEditTransaction} style={{cursor:'pointer'}}>
                    <span className="modal-label">Date:</span>
                    <span className="modal-value">
                      {selectedTransaction.Date}
                    </span>
                  </div>

                  <div className="modal-row" onClick={handleEditTransaction} style={{cursor:'pointer'}}>
                    <span className="modal-label">Account:</span>
                    <span className="modal-value">
                      {selectedTransaction.Account}
                    </span>
                  </div>

                  {selectedTransaction.Category && (
                    <div className="modal-row" onClick={handleEditTransaction} style={{cursor:'pointer'}}>
                      <span className="modal-label">Category:</span>
                      <span className="modal-value">
                        {selectedTransaction.Category}
                      </span>
                    </div>
                  )}

                  {selectedTransaction.Subcategory && (
                    <div className="modal-row" onClick={handleEditTransaction} style={{cursor:'pointer'}}>
                      <span className="modal-label">Subcategory:</span>
                      <span className="modal-value">
                        {selectedTransaction.Subcategory}
                      </span>
                    </div>
                  )}

                  {selectedTransaction.Note && (
                    <div className="modal-row" onClick={handleEditTransaction} style={{cursor:'pointer'}}>
                      <span className="modal-label">Note:</span>
                      <span className="modal-value">
                        {selectedTransaction.Note}
                      </span>
                    </div>
                  )}

                  {selectedTransaction.Description && (
                    <div className="modal-row" onClick={handleEditTransaction} style={{cursor:'pointer'}}>
                      <span className="modal-label">Description:</span>
                      <span className="modal-value">
                        {selectedTransaction.Description}
                      </span>
                    </div>
                  )}

                  <div className="modal-row" onClick={handleEditTransaction} style={{cursor:'pointer'}}>
                    <span className="modal-label">Amount:</span>
                    <span
                      className={`modal-value amount ${selectedTransaction[
                        "Income/Expense"
                      ].toLowerCase()}`}
                    >
                      {formatIndianCurrency(
                        parseFloat(
                          selectedTransaction.INR || selectedTransaction.Amount
                        )
                      )}
                    </span>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className="modal-btn cancel-btn"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  {onEdit && (
                    <button
                      className="modal-btn edit-btn"
                      onClick={handleEditTransaction}
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="modal-btn delete-btn"
                      onClick={handleDeleteTransaction}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
