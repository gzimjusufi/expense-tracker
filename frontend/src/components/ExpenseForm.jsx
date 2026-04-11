import React, { useState } from "react";

export default function ExpenseForm({ onAdd, theme }) {
  const [formData, setFormData] = useState({
    date: "",
    category: "",
    description: "",
    amount: "",
  });

  const dark = theme === "dark";

  const inputStyle = {
    padding: "10px 14px",
    borderRadius: "10px",
    border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
    backgroundColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    color: dark ? "#fff" : "#000",
    outline: "none",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
    marginBottom: "12px",
  };

  const labelStyle = {
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    opacity: 0.5,
    marginBottom: "6px",
    display: "block",
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date || !formData.category || !formData.amount) {
      alert("Please fill out all required fields!");
      return;
    }
    onAdd({ ...formData, amount: parseFloat(formData.amount) });
    setFormData({ date: "", category: "", description: "", amount: "" });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>

        <div style={{ flex: "1 1 140px" }}>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ flex: "1 1 140px" }}>
          <label style={labelStyle}>Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            style={inputStyle}
          >
            <option value="">Select Category</option>
            <option value="Food">Food</option>
            <option value="Groceries">Groceries</option>
            <option value="Transport">Transport</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Bills">Bills</option>
            <option value="Shopping">Shopping</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ flex: "2 1 200px" }}>
          <label style={labelStyle}>Description</label>
          <input
            type="text"
            placeholder="e.g. Coffee, Netflix, Bus Ticket"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ flex: "1 1 120px" }}>
          <label style={labelStyle}>Amount</label>
          <input
            type="number"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ flex: "1 1 100px", display: "flex", alignItems: "flex-end" }}>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
              transition: "opacity 0.2s",
              marginBottom: "12px",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            + Add
          </button>
        </div>

      </div>
    </form>
  );
}