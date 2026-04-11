import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "../services/currency";

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
  const dark = theme === "dark";

  const getCategoryColor = (category) => {
    const normalized = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    return categoryColors[normalized] || "#95a5a6";
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  return (
    <div style={{ width: "100%" }}>
      <div style={{
        fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em",
        textTransform: "uppercase", opacity: 0.5, marginBottom: "12px",
      }}>
        Expense List
      </div>

      <div style={{ overflowX: "auto", width: "100%" }}>
        <table style={{
          width: "100%",
          minWidth: "600px",
          borderCollapse: "collapse",
          borderRadius: "16px",
          overflow: "hidden",
        }}>
          <thead>
            <tr style={{
              background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
            }}>
              {["Date", "Category", "Item", "Amount", "Recurring", ...(!readOnly ? ["Actions"] : [])].map((h, i) => (
                <th key={i} style={{
                  padding: "12px 14px",
                  textAlign: "left",
                  fontSize: "11px",
                  fontWeight: "600",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  opacity: 0.5,
                  borderBottom: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                  whiteSpace: "nowrap",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={readOnly ? 5 : 6} style={{
                    padding: "40px", textAlign: "center",
                    opacity: 0.4, fontSize: "14px",
                  }}>
                    No expenses found.
                  </td>
                </tr>
              ) : expenses.map((expense) => (
                <motion.tr
                  key={expense._id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    borderBottom: dark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.04)",
                    transition: "background 0.2s",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "12px 14px", fontSize: "13px", opacity: 0.7, whiteSpace: "nowrap" }}>
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      display: "inline-block",
                      backgroundColor: getCategoryColor(expense.category),
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: "100px",
                      fontSize: "12px",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                    }}>
                      {capitalize(expense.category)}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: "13px", opacity: 0.8 }}>
                    {expense.description || "—"}
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: "14px", fontWeight: "700", color: "#6366f1", whiteSpace: "nowrap" }}>
                    {formatCurrency(expense.amount, currency)}
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: "13px" }}>
                    {expense.recurring ? (
                      <span style={{
                        color: "#10b981", fontWeight: "600",
                        background: "rgba(16,185,129,0.1)",
                        padding: "4px 10px", borderRadius: "100px",
                        fontSize: "12px", whiteSpace: "nowrap",
                      }}>
                        ✅ {capitalize(expense.recurrence)}
                      </span>
                    ) : (
                      <span style={{ opacity: 0.3 }}>—</span>
                    )}
                  </td>
                  {!readOnly && (
                    <td style={{ padding: "12px 14px" }}>
                      <button
                        onClick={() => onDelete(expense._id)}
                        style={{
                          padding: "6px 12px",
                          background: "rgba(239,68,68,0.1)",
                          color: "#ef4444",
                          border: "1px solid rgba(239,68,68,0.3)",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          transition: "all 0.2s",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                        }}
                      >
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
    </div>
  );
}