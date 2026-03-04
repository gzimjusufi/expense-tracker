import React, { useEffect, useState } from "react";
import axios from "axios";
import { formatCurrency } from "../services/currency";
import { motion, AnimatePresence } from "framer-motion";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

export default function Goals({ theme, currency = "USD" }) {
  const [goals, setGoals] = useState([]);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [addAmounts, setAddAmounts] = useState({});
  const [editingGoal, setEditingGoal] = useState(null);
  const [editData, setEditData] = useState({ name: "", targetAmount: "", deadline: "", emoji: "" });

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/goals", authHeader());
      setGoals(res.data);
    } catch (err) { console.error(err); }
  };

  const addGoal = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount) return alert("Please fill in name and target amount!");
    try {
      const res = await axios.post("http://localhost:5000/api/goals", { name, targetAmount, deadline, emoji }, authHeader());
      setGoals([res.data, ...goals]);
      setName(""); setTargetAmount(""); setDeadline(""); setEmoji("🎯");
    } catch (err) { console.error(err); }
  };

  const addMoney = async (id) => {
    const amount = addAmounts[id];
    if (!amount || amount <= 0) return alert("Enter a valid amount!");
    try {
      const res = await axios.put(`http://localhost:5000/api/goals/${id}/add`, { amount }, authHeader());
      setGoals(goals.map(g => g._id === id ? res.data : g));
      setAddAmounts({ ...addAmounts, [id]: "" });
    } catch (err) { console.error(err); }
  };

  const deleteGoal = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/goals/${id}`, authHeader());
      setGoals(goals.filter(g => g._id !== id));
    } catch (err) { console.error(err); }
  };

  const saveEdit = async () => {
    try {
      const res = await axios.put(`http://localhost:5000/api/goals/${editingGoal._id}`, editData, authHeader());
      setGoals(goals.map(g => g._id === editingGoal._id ? res.data : g));
      setEditingGoal(null);
    } catch (err) { console.error(err); }
  };

  const removeMoney = async (id) => {
  const amount = addAmounts[id];
  if (!amount || amount <= 0) return alert("Enter a valid amount!");
  try {
    const res = await axios.put(`http://localhost:5000/api/goals/${id}/remove`, { amount }, authHeader());
    setGoals(goals.map(g => g._id === id ? res.data : g));
    setAddAmounts({ ...addAmounts, [id]: "" });
  } catch (err) { console.error(err); }
};

  const pageStyle = {
    backgroundColor: theme === "dark" ? "#121212" : "#f5f5f5",
    color: theme === "dark" ? "#fff" : "#000",
    minHeight: "100vh",
    padding: "20px",
  };

  const cardStyle = {
    backgroundColor: theme === "dark" ? "#1e1e1e" : "#fff",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "15px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  };

  const inputStyle = {
    padding: "10px",
    borderRadius: "8px",
    border: theme === "dark" ? "1px solid #555" : "1px solid #ccc",
    backgroundColor: theme === "dark" ? "#2a2a2a" : "#fff",
    color: theme === "dark" ? "#fff" : "#000",
    width: "100%",
    marginBottom: "10px",
  };

  return (
    <div style={pageStyle}>
      <h2 style={{ marginBottom: "20px" }}>🎯 Savings Goals</h2>

      {/* Add Goal Form */}
      <div style={cardStyle}>
        <h4>Add New Goal</h4>
        <form onSubmit={addGoal}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Goal name (e.g. Buy a car)" value={name} onChange={e => setName(e.target.value)} />
            <input style={{ ...inputStyle, flex: 1 }} type="number" placeholder="Target amount" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
            <input style={{ ...inputStyle, flex: 1 }} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            <input style={{ ...inputStyle, width: "80px", flex: "none" }} placeholder="🎯" value={emoji} onChange={e => setEmoji(e.target.value)} />
          </div>
          <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#6366f1", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            Add Goal
          </button>
        </form>
      </div>

      {/* Goals List */}
      <AnimatePresence>
        {goals.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No savings goals yet. Add one above!</p>
        ) : (
          goals.map(goal => {
            const progress = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
            const isComplete = progress >= 100;
            const remaining = goal.targetAmount - goal.savedAmount;

            return (
              <motion.div
                key={goal._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={cardStyle}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h4 style={{ margin: 0 }}>{goal.emoji} {goal.name}</h4>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => {
                        setEditingGoal(goal);
                        setEditData({
                          name: goal.name,
                          targetAmount: goal.targetAmount,
                          deadline: goal.deadline ? new Date(goal.deadline).toISOString().split("T")[0] : "",
                          emoji: goal.emoji,
                        });
                      }}
                      style={{ backgroundColor: "#f39c12", color: "#fff", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteGoal(goal._id)}
                      style={{ backgroundColor: "#e74c3c", color: "#fff", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", opacity: 0.8 }}>
                  <span>Saved: <strong>{formatCurrency(goal.savedAmount, currency)}</strong></span>
                  <span>Target: <strong>{formatCurrency(goal.targetAmount, currency)}</strong></span>
                  {goal.deadline && <span>Deadline: <strong>{new Date(goal.deadline).toLocaleDateString()}</strong></span>}
                </div>

                {/* Progress Bar */}
                <div style={{ backgroundColor: "#e0e0e0", borderRadius: "8px", height: "18px", marginBottom: "8px" }}>
                  <div style={{
                    height: "100%",
                    width: `${progress}%`,
                    backgroundColor: isComplete ? "#2ecc71" : "#6366f1",
                    borderRadius: "8px",
                    transition: "width 0.3s ease",
                  }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "12px" }}>
                  <span>{progress.toFixed(1)}% complete</span>
                  {!isComplete && <span>Remaining: {formatCurrency(remaining, currency)}</span>}
                  {isComplete && <span style={{ color: "#2ecc71", fontWeight: "bold" }}>🎉 Goal Reached!</span>}
                </div>

                {!isComplete && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="number"
                      placeholder="Add amount"
                      value={addAmounts[goal._id] || ""}
                      onChange={e => setAddAmounts({ ...addAmounts, [goal._id]: e.target.value })}
                      style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                    />
                    <button onClick={() => addMoney(goal._id)} style={{ padding: "10px 20px", backgroundColor: "#2ecc71", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                      Add
                    </button>
                    <button onClick={() => removeMoney(goal._id)} style={{ padding: "10px 20px", backgroundColor: "#e74c3c", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                      Remove
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      {editingGoal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ ...cardStyle, minWidth: "350px", marginBottom: 0 }}>
            <h4>Edit Goal</h4>
            <input style={inputStyle} placeholder="Goal name" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
            <input style={inputStyle} type="number" placeholder="Target amount" value={editData.targetAmount} onChange={e => setEditData({ ...editData, targetAmount: e.target.value })} />
            <input style={inputStyle} type="date" value={editData.deadline} onChange={e => setEditData({ ...editData, deadline: e.target.value })} />
            <input style={inputStyle} placeholder="Emoji" value={editData.emoji} onChange={e => setEditData({ ...editData, emoji: e.target.value })} />
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={saveEdit} style={{ flex: 1, padding: "10px", backgroundColor: "#6366f1", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>Save</button>
              <button onClick={() => setEditingGoal(null)} style={{ flex: 1, padding: "10px", backgroundColor: "#95a5a6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
