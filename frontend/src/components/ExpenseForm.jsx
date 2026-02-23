import React, { useState } from "react";

export default function ExpenseForm({ onAdd, theme }) {
  const [formData, setFormData] = useState({
    date: "",
    category: "",
    description: "",
    amount: "",
  });

  const inputStyle = {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginBottom: "10px",
    width: "100%",
    fontSize: "14px",
    backgroundColor: theme === "dark" ? "#2d3748" : "#fff",
    color: theme === "dark" ? "#fff" : "#000",
  };

  const buttonStyle = {
    padding: "10px",
    backgroundColor: theme === "dark" ? "#3182ce" : "#1abc9c",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    marginTop: "5px",
    width: "100%",
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date || !formData.category || !formData.amount) {
      alert("Please fill out all fields!");
      return;
    }

    onAdd({ ...formData, amount: parseFloat(formData.amount) });
    setFormData({ date: "", category: "", description: "", amount: "" });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
      <input
        type="date"
        name="date"
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        style={inputStyle}
      />

      <select
        name="category"
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        style={inputStyle}
      >
        <option value="">Select Category</option>
        <option value="Groceries">Groceries</option>
        <option value="Transport">Transport</option>
        <option value="Entertainment">Entertainment</option>
        <option value="Bills">Bills</option>
        <option value="Shopping">Shopping</option>
        <option value="Other">Other</option>
      </select>

      <input
        type="text"
        name="description"
        placeholder="Enter item (e.g. Coffee, Netflix, Bus Ticket)"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        style={inputStyle}
      />

      <input
        type="number"
        name="amount"
        placeholder="Enter amount"
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        style={inputStyle}
      />

      <button type="submit" style={buttonStyle}>
        Add Expense
      </button>
    </form>
  );
}
