import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "../services/currency";

// Colors for categories
const categoryColors = {
  Food: "#2ecc71",
  Groceries: "#3498db",
  Transport: "#9b59b6",
  Entertainment: "#f39c12",
  Bills: "#e67e22",
  Shopping: "#9b59a6",
  Other: "#95a5a6",
};

export default function ExpenseList({ expenses, onDelete, theme, readOnly = false, currency = "USD" }) {
  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow:
      theme === "dark"
        ? "0 2px 8px rgba(0, 0, 0, 0.6)"
        : "0 2px 8px rgba(0, 0, 0, 0.1)",
    marginTop: "20px",
  };

  const thStyle = {
    padding: "14px",
    textAlign: "left",
    backgroundColor: theme === "dark" ? "#2d3748" : "#e6e6e6",
    color: theme === "dark" ? "#fff" : "#000",
    fontWeight: "600",
    borderBottom: theme === "dark" ? "2px solid #4a5568" : "2px solid #ccc",
  };

  const tdStyle = {
    padding: "12px",
    borderBottom: theme === "dark" ? "1px solid #4a5568" : "1px solid #ccc",
    color: theme === "dark" ? "#e2e8f0" : "#000",
  };

  const buttonStyle = {
    padding: "6px 10px",
    backgroundColor: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "13px",
    transition: "all 0.2s ease-in-out",
  };

  const getCategoryColor = (category) => {
    const normalized = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    return categoryColors[normalized] || "#95a5a6";
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <h3 style={{ marginBottom: "10px" }}>Expense List</h3>


      <table style={{ ...tableStyle, minWidth: "600px" }}>
        <thead>
          <tr>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Category</th>
            <th style={thStyle}>Item</th>
            <th style={thStyle}>Amount</th>
            <th style={thStyle}>Recurring</th> {/* New column */}
            {!readOnly && <th style={thStyle}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {expenses.map((expense) => (
              <motion.tr
                key={expense._id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <td style={tdStyle}>{new Date(expense.date).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      display: "inline-block",
                      backgroundColor: getCategoryColor(expense.category),
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: "600",
                      minWidth: "60px",
                      textAlign: "center",
                    }}
                  >
                    {capitalize(expense.category)}
                  </span>
                </td>
                <td style={tdStyle}>{expense.description || "-"}</td>
                <td style={tdStyle}>{formatCurrency(expense.amount, currency)}</td>
                <td style={tdStyle}>
                  {expense.recurring ? (
                    <span
                      style={{
                        color: "#27ae60",
                        fontWeight: "600",
                      }}
                    >
                      ✅ {capitalize(expense.recurrence)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                {!readOnly && (
                  <td style={tdStyle}>
                    <button style={buttonStyle} onClick={() => onDelete(expense._id)}>
                      Delete
                    </button>
                  </td>
                )}
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
