import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import { formatCurrency } from "../services/currency";

const Expenses = ({ theme, currency }) => {
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");
  const [tags, setTags] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
// Attach token to requests
const authHeader = () => {
  const token = localStorage.getItem("token"); // or sessionStorage if you stored it there
  return { headers: { Authorization: `Bearer ${token}` } };
};

  // Budget states
  const [monthlyBudget, setMonthlyBudget] = useState(1000);
  const [budgetInput, setBudgetInput] = useState(1000);
  const [totalSpent, setTotalSpent] = useState(0);

  // Recuring states
  const [recurring, setRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState("monthly");


  // Modal states for editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editData, setEditData] = useState({
    category: "",
    amount: "",
    date: "",
    description: "",
    recurring: "",
    recurrence: "",
    tags: [],
    paymentMethod: "card",
  });

// Fetch expenses
const fetchExpenses = async () => {
  try {
    const res = await axios.get("https://expense-tracker-3dmz.onrender.com/api/expenses", authHeader());
    setExpenses(res.data);
  } catch (err) {
    console.error("Error fetching expenses:", err);
  }
};

// Fetch budget
const fetchBudget = async () => {
  try {
    const res = await axios.get("https://expense-tracker-3dmz.onrender.com/api/budget", authHeader());
    const budget = res.data.monthlyBudget || 1000;
    setMonthlyBudget(budget);
    setBudgetInput(budget);
  } catch (err) {
    console.error("Error fetching budget:", err);
  }
};

useEffect(() => {
  fetchExpenses();
  fetchBudget();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  // Save updated budget
  const saveBudget = async () => {
    try {
      await axios.put("https://expense-tracker-3dmz.onrender.com/api/budget", {
  monthlyBudget: Number(budgetInput),
}, authHeader());

      setMonthlyBudget(Number(budgetInput));
    } catch (err) {
      console.error("Error updating budget:", err);
    }
  };

  // Recalculate total spent
  useEffect(() => {
    const currentMonth = new Date().getMonth();
    const spent = expenses
      .filter((e) => new Date(e.date).getMonth() === currentMonth)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    setTotalSpent(spent);
  }, [expenses]);

  // Add expense
  const addExpense = async (e) => {
    e.preventDefault();
    if (!category || !amount || !date || !description) {
      alert("Please fill in all fields!");
      return;
    }

    try {
      console.log("Tags being sent:", tags);
      const res = await axios.post("https://expense-tracker-3dmz.onrender.com/api/expenses", {
  category,
  amount,
  date,
  description,
  recurring,
  recurrence: recurring ? recurrence : null,
  tags: tags ? tags.split(",").map(t => t.trim()) : [],
  paymentMethod,
}, authHeader());
      setExpenses([...expenses, res.data]);
      setCategory("Food");
setAmount("");
setDate("");
setDescription("");
setRecurring(false);
setRecurrence("");
setTags("");
setPaymentMethod("card");
    } catch (err) {
      console.error("Error adding expense:", err);
    }
  };

  // Delete expense
  const deleteExpense = async (id) => {
    try {
      await axios.delete(`https://expense-tracker-3dmz.onrender.com/api/expenses/${id}`, authHeader());
      setExpenses(expenses.filter((exp) => exp._id !== id));
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  };

  // Open edit modal
  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setEditData({
  category: expense.category,
  amount: expense.amount,
  date: expense.date.split("T")[0],
  description: expense.description,
  recurring: expense.recurring,
  recurrence: expense.recurring
    ? expense.recurrence || "monthly" // ✅ Always default to "monthly"
    : null,
    tags: expense.tags || [],
    paymentMethod: expense.paymentMethod || "card",
});

    setIsModalOpen(true);
  };

  // Save edit
  const saveEdit = async () => {
    try {
      const res = await axios.put(
  `https://expense-tracker-3dmz.onrender.com/api/expenses/${editingExpense._id}`,
  editData,
  authHeader()
);
      const updatedExpenses = expenses.map((exp) =>
        exp._id === editingExpense._id ? res.data : exp
      );
      setExpenses(updatedExpenses);
      setIsModalOpen(false);
      setEditingExpense(null);
    } catch (err) {
      console.error("Error updating expense:", err);
    }
  };

  // Category colors
  const getCategoryBadge = (category) => {
    const styles = {
      padding: "5px 10px",
      borderRadius: "12px",
      fontSize: "13px",
      fontWeight: "600",
      color: "#fff",
      display: "inline-block",
    };

    switch (category.toLowerCase()) {
      case "food":
        return { ...styles, backgroundColor: "#2ecc71" };
      case "groceries":
        return { ...styles, backgroundColor: "#3498db" };
      case "transport":
        return { ...styles, backgroundColor: "#9b59b6" };
      case "entertainment":
        return { ...styles, backgroundColor: "#f39c12" };
      case "bills":
        return { ...styles, backgroundColor: "#e67e22" };
      case "shopping":
        return { ...styles, backgroundColor: "#9b59a6" };
      default:
        return { ...styles, backgroundColor: "#95a5a6" };
    }
  };

  // Budget progress
  const budgetUsedPercentage = monthlyBudget
    ? Math.min((totalSpent / monthlyBudget) * 100, 100)
    : 0;

  const getProgressBarVariant = () => {
    if (budgetUsedPercentage >= 90) return "bg-danger";
    if (budgetUsedPercentage >= 70) return "bg-warning";
    return "bg-success";
  };

  return (
<div
  style={{
    backgroundColor: theme === "dark" ? "#121212" : "#f5f5f5",
    color: theme === "dark" ? "#fff" : "#000",
    minHeight: "100vh",
    padding: "20px",
  }}
>
      <h1 className="mb-4 text-center">Expenses Tab</h1>

      {/* Budget */}
      <div
        className={`card p-3 mb-4 shadow ${
          theme === "dark" ? "bg-secondary text-light" : "bg-white"
        }`}
      >
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
          <h5 className="m-0">Monthly Budget</h5>
          <div className="d-flex gap-2 align-items-center">
            <input
              type="number"
              className={`form-control form-control-sm ${
                theme === "dark" ? "bg-dark text-light border-0" : ""
              }`}
              style={{ width: "120px" }}
              value={budgetInput}
              onChange={(e) => setBudgetInput(Number(e.target.value))}
            />
            <span className="fw-bold">{currency || "USD"}</span>
            <button className="btn btn-primary btn-sm" onClick={saveBudget}>
              Update
            </button>
          </div>
        </div>
        <div className="progress" style={{ height: "20px" }}>
          <div
            className={`progress-bar ${getProgressBarVariant()}`}
            role="progressbar"
            style={{ width: `${budgetUsedPercentage}%` }}
          >
            {budgetUsedPercentage.toFixed(1)}%
          </div>
        </div>
        <p className="mt-2 mb-0">
          Spent: <strong>{formatCurrency(totalSpent, currency)}</strong> /{" "}
          <strong>{formatCurrency(monthlyBudget, currency)}</strong>
        </p>
        {budgetUsedPercentage >= 90 && (
          <p className="text-danger fw-bold mt-2">
            ⚠️ Warning: You are exceeding your monthly budget!
          </p>
        )}
        {budgetUsedPercentage >= 70 && budgetUsedPercentage < 90 && (
          <p className="text-warning fw-bold mt-2">
            ⚠️ Caution: You are close to exceeding your monthly budget.
          </p>
        )}
      </div>

      {/* Add Expense Form */}
      <form className="row g-3 mb-4" onSubmit={addExpense}>
        <div className="col-12 col-md-3">
          <select
            className={`form-select ${
              theme === "dark" ? "bg-secondary text-light border-0" : ""
            }`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Food</option>
            <option>Groceries</option>
            <option>Transport</option>
            <option>Entertainment</option>
            <option>Bills</option>
            <option>Shopping</option>
            <option>Other</option>
          </select>
        </div>
        <div className="col-12 col-md-2">
          <input
            type="number"
            className={`form-control ${
              theme === "dark" ? "bg-secondary text-light border-0" : ""
            }`}
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-3">
          <input
            type="date"
            className={`form-control ${
              theme === "dark" ? "bg-secondary text-light border-0" : ""
            }`}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-3">
          <input
            type="text"
            className={`form-control ${
              theme === "dark" ? "bg-secondary text-light border-0" : ""
            }`}
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-3">
  <input
    type="text"
    className={`form-control ${theme === "dark" ? "bg-secondary text-light border-0" : ""}`}
    placeholder="Tags (comma separated)"
    value={tags}
    onChange={(e) => setTags(e.target.value)}
  />
</div>
<div className="col-12 col-md-2">
  <select
    className={`form-select ${theme === "dark" ? "bg-secondary text-light border-0" : ""}`}
    value={paymentMethod}
    onChange={(e) => setPaymentMethod(e.target.value)}
  >
    <option value="card">💳 Card</option>
    <option value="cash">💵 Cash</option>
    <option value="bank transfer">🏦 Bank Transfer</option>
    <option value="other">🔄 Other</option>
  </select>
</div>
        <div className="col-12 col-md-1">
          <div className="col-md-3 d-flex align-items-center">
  <input
    type="checkbox"
    checked={recurring}
    onChange={(e) => setRecurring(e.target.checked)}
    style={{ marginRight: "8px" }}
  />
  <label className="me-2">Recurring</label>
  {recurring && (
    <select
      className={`form-select ${
        theme === "dark" ? "bg-secondary text-light border-0" : ""
      }`}
      style={{ maxWidth: "150px" }}
      value={recurrence}
      onChange={(e) => setRecurrence(e.target.value)}
    >
      <option value="daily">Daily</option>
      <option value="weekly">Weekly</option>
      <option value="monthly">Monthly</option>
    </select>
  )}
</div>
          <button type="submit" className="btn btn-success w-100">
            Add
          </button>
        </div>
      </form>

      <div className="mb-3">
  <input
    type="text"
    className={`form-control ${theme === "dark" ? "bg-secondary text-light border-0" : ""}`}
    placeholder="🔍 Search by description, category or tags..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
</div>

      {/* Expense Table */}
      <div className="table-responsive">
        <table
          className={`table table-hover table-striped shadow ${
            theme === "dark" ? "table-dark" : "table-light"
          }`}
        >
          <thead className={theme === "dark" ? "table-secondary" : "table-dark"}>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Description</th>
              <th>Recurring</th>
              <th>Tags</th>
              <th>Payment</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {expenses.filter((expense) => {
  const q = search.toLowerCase();
  return (
    expense.description?.toLowerCase().includes(q) ||
    expense.category?.toLowerCase().includes(q) ||
    expense.tags?.some(t => t.toLowerCase().includes(q))
  );
}).map((expense) => (
                <motion.tr
                  key={expense._id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <td>
                    <span style={getCategoryBadge(expense.category)}>
                      {expense.category}
                    </span>
                  </td>
                  <td>{formatCurrency(expense.amount, currency)}</td>
                  <td>{new Date(expense.date).toLocaleDateString()}</td>
                  <td>{expense.description}</td>
                  <td>
  {expense.recurring ? (
    <span
      style={{
        backgroundColor: "#27ae60",
        color: "#fff",
        padding: "3px 8px",
        borderRadius: "5px",
        fontSize: "12px",
        fontWeight: "600",
      }}
    >
      ✅ {expense.recurrence}
    </span>
  ) : (
    "—"
  )}
</td>
<td>          
  {expense.tags?.length > 0 ? expense.tags.map((tag, i) => (
    <span key={i} style={{
      display: "inline-block",
      backgroundColor: "#6366f1",
      color: "#fff",
      padding: "2px 8px",
      borderRadius: "12px",
      fontSize: "12px",
      marginRight: "4px",
    }}>
      #{tag}
    </span>
  )) : "—"}
</td>
<td>
  {expense.paymentMethod === "cash" && "💵 Cash"}
  {expense.paymentMethod === "card" && "💳 Card"}
  {expense.paymentMethod === "bank transfer" && "🏦 Bank Transfer"}
  {expense.paymentMethod === "other" && "🔄 Other"}
  {!expense.paymentMethod && "💳 Card"}
</td>
                  <td>
                    <button
                      className="btn btn-warning btn-sm me-1"
                      onClick={() => openEditModal(expense)}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteExpense(expense._id)}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="modal d-block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: "rgba(0,0,0,0.5)",
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <motion.div
              className={`card p-4 ${
                theme === "dark" ? "bg-dark text-light" : "bg-light text-dark"
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              style={{ minWidth: "300px", maxWidth: "95vw", width: "95vw" }}
            >
              <h5>Edit Expense</h5>
              <div className="mb-2">
                <select
                  className="form-select"
                  value={editData.category}
                  onChange={(e) =>
                    setEditData({ ...editData, category: e.target.value })
                  }
                >
                  <option>Food</option>
                  <option>Groceries</option>
                  <option>Transport</option>
                  <option>Entertainment</option>
                  <option>Bills</option>
                  <option>Shopping</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="mb-2">
                <input
                  type="number"
                  className="form-control"
                  value={editData.amount}
                  onChange={(e) =>
                    setEditData({ ...editData, amount: e.target.value })
                  }
                />
              </div>
              <div className="mb-2">
                <input
                  type="date"
                  className="form-control"
                  value={editData.date}
                  onChange={(e) =>
                    setEditData({ ...editData, date: e.target.value })
                  }
                />
              </div>
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control"
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                />
              </div>
              <div className="mb-2">
    <div className="mb-2">
  <input
    type="text"
    className="form-control"
    placeholder="Tags (comma separated)"
    value={editData.tags?.join(", ") || ""}
    onChange={(e) => setEditData({ ...editData, tags: e.target.value.split(",").map(t => t.trim()) })}
  />
</div>
<div className="mb-2">
  <select
  className={`form-select ${theme === "dark" ? "bg-secondary text-light border-0" : ""}`}
  value={editData.paymentMethod || "card"}
  onChange={(e) => setEditData({ ...editData, paymentMethod: e.target.value })}
>
    <option value="card">💳 Card</option>
    <option value="cash">💵 Cash</option>
    <option value="bank transfer">🏦 Bank Transfer</option>
    <option value="other">🔄 Other</option>
  </select>
</div>
    <input
      type="checkbox"
      checked={editData.recurring || false}
      onChange={(e) =>
        setEditData({
          ...editData,
          recurring: e.target.checked,
          recurrence: e.target.checked ? "" : null, // Reset recurrence if unchecked
        })
      }
    />{" "}
    Recurring

  {editData.recurring && (
    <select
      className="form-select mt-2"
      value={editData.recurrence || ""}
      onChange={(e) =>
        setEditData({ ...editData, recurrence: e.target.value })
      }
    >
      <option value="">Please choose...</option>
      <option value="daily">Daily</option>
      <option value="weekly">Weekly</option>
      <option value="monthly">Monthly</option>
    </select>
  )}
</div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
  className="btn btn-success"
  onClick={saveEdit}
  disabled={editData.recurring && (!editData.recurrence || editData.recurrence === "")}
>
  Save
</button>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Expenses;
