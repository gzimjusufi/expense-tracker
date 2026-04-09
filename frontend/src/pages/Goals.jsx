import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "../services/currency";

const glassCard = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  padding: "20px",
};

const lightCard = {
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: "16px",
  border: "1px solid rgba(0,0,0,0.07)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
  padding: "20px",
};

const inputBase = (dark) => ({
  padding: "10px 14px",
  borderRadius: "10px",
  border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
  backgroundColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
  color: dark ? "#fff" : "#000",
  outline: "none",
  fontSize: "14px",
});

const buttonBase = (bg, color) => ({
  padding: "10px 18px",
  borderRadius: "10px",
  border: "none",
  fontWeight: "600",
  fontSize: "14px",
  cursor: "pointer",
  background: bg,
  color: color,
  transition: "opacity 0.2s",
});

export default function Goals({ theme, currency = "USD" }) {
  const dark = theme === "dark";
  const card = dark ? glassCard : lightCard;

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
      const token = localStorage.getItem("token");
      const res = await axios.get("https://expense-tracker-3dmz.onrender.com/api/goals", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGoals(res.data);
    } catch (err) { console.error(err); }
  };

  const addGoal = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount) return alert("Fill in name and target!");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("https://expense-tracker-3dmz.onrender.com/api/goals",
        { name, targetAmount, deadline, emoji },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGoals([res.data, ...goals]);
      setName(""); setTargetAmount(""); setDeadline(""); setEmoji("🎯");
    } catch (err) { console.error(err); }
  };

  const addMoney = async (id) => {
    const amount = addAmounts[id];
    if (!amount || amount <= 0) return alert("Enter valid amount!");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`https://expense-tracker-3dmz.onrender.com/api/goals/${id}/add`, { amount }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGoals(goals.map(g => g._id === id ? res.data : g));
      setAddAmounts({ ...addAmounts, [id]: "" });
    } catch (err) { console.error(err); }
  };

  const removeMoney = async (id) => {
    const amount = addAmounts[id];
    if (!amount || amount <= 0) return alert("Enter valid amount!");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`https://expense-tracker-3dmz.onrender.com/api/goals/${id}/remove`, { amount }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGoals(goals.map(g => g._id === id ? res.data : g));
      setAddAmounts({ ...addAmounts, [id]: "" });
    } catch (err) { console.error(err); }
  };

  const deleteGoal = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`https://expense-tracker-3dmz.onrender.com/api/goals/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGoals(goals.filter(g => g._id !== id));
    } catch (err) { console.error(err); }
  };

  const saveEdit = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`https://expense-tracker-3dmz.onrender.com/api/goals/${editingGoal._id}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGoals(goals.map(g => g._id === editingGoal._id ? res.data : g));
      setEditingGoal(null);
    } catch (err) { console.error(err); }
  };

  const pageStyle = {
    background: dark
      ? "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)"
      : "linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f0f4ff 100%)",
    color: dark ? "#fff" : "#111",
    minHeight: "100vh",
    padding: window.innerWidth < 600 ? "10px" : "24px",
  };

  return (
    <div style={pageStyle}>
      <h2 style={{ marginBottom: "20px" }}>🎯 Savings Goals</h2>

      {/* Add Goal Form */}
      <div style={{ ...card, marginBottom: "20px" }}>
        <h4>Add New Goal</h4>
        <form onSubmit={addGoal} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <input style={inputBase(dark)} placeholder="Goal name" value={name} onChange={e => setName(e.target.value)} />
          <input style={inputBase(dark)} type="number" placeholder="Target amount" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
          <input style={inputBase(dark)} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          <input style={{ ...inputBase(dark), maxWidth: "80px" }} placeholder="🎯" value={emoji} onChange={e => setEmoji(e.target.value)} />
          <button type="submit" style={buttonBase("#6366f1", "#fff")}>Add Goal</button>
        </form>
      </div>

      {/* Goals List */}
      <AnimatePresence>
        {goals.length === 0 ? (
          <div style={{ ...card, textAlign: "center", opacity: 0.5 }}>No savings goals yet.</div>
        ) : (
          goals.map(goal => {
            const progress = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
            const remaining = goal.targetAmount - goal.savedAmount;
            const isComplete = progress >= 100;

            return (
             <motion.div
  key={goal._id}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  style={{ ...card, marginBottom: "15px" }}
>
  {/* Header */}
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
            emoji: goal.emoji
          });
        }}
        style={buttonBase("#f39c12", "#fff")}
      >
        Edit
      </button>
      <button onClick={() => deleteGoal(goal._id)} style={buttonBase("#e74c3c", "#fff")}>Delete</button>
    </div>
  </div>

  {/* Saved / Target / Deadline Info */}
  <div style={{ fontSize: "13px", opacity: 0.8, marginBottom: "8px", display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
    <span>Saved: {formatCurrency(goal.savedAmount, currency)}</span>
    <span>Target: {formatCurrency(goal.targetAmount, currency)}</span>
    {goal.deadline && <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>}
  </div>

  {/* Progress Bar */}
  <div style={{ backgroundColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", borderRadius: "100px", height: "10px", marginBottom: "8px", overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${progress}%`, background: isComplete ? "#2ecc71" : "#6366f1", borderRadius: "100px", transition: "width 0.5s" }} />
  </div>

  {/* Completion text */}
  <div style={{ fontSize: "13px", opacity: 0.8, marginBottom: "8px" }}>
    {progress.toFixed(1)}% complete | Remaining: {formatCurrency(remaining, currency)}
  </div>

  {/* Add / Remove Money */}
  {!isComplete && (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      <input
        type="number"
        placeholder="Add amount"
        value={addAmounts[goal._id] || ""}
        onChange={e => setAddAmounts({ ...addAmounts, [goal._id]: e.target.value })}
        style={inputBase(dark)}
      />
      <button onClick={() => addMoney(goal._id)} style={buttonBase("#2ecc71", "#fff")}>Add</button>
      <button onClick={() => removeMoney(goal._id)} style={buttonBase("#e74c3c", "#fff")}>Remove</button>
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
          <div style={{ ...card, width: "95%", maxWidth: "400px" }}>
            <h4>Edit Goal</h4>
            <input style={inputBase(dark)} placeholder="Goal name" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
            <input style={inputBase(dark)} type="number" placeholder="Target amount" value={editData.targetAmount} onChange={e => setEditData({ ...editData, targetAmount: e.target.value })} />
            <input style={inputBase(dark)} type="date" value={editData.deadline} onChange={e => setEditData({ ...editData, deadline: e.target.value })} />
            <input style={inputBase(dark)} placeholder="Emoji" value={editData.emoji} onChange={e => setEditData({ ...editData, emoji: e.target.value })} />
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button onClick={saveEdit} style={buttonBase("#6366f1", "#fff")}>Save</button>
              <button onClick={() => setEditingGoal(null)} style={buttonBase("#95a5a6", "#fff")}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}