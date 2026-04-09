import React, { useEffect, useState } from "react";
import axios from "axios";
import { formatCurrency } from "../services/currency";
import { motion, AnimatePresence } from "framer-motion";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export default function Goals({ theme = "light", currency = "USD" }) {
  const [goals, setGoals] = useState([]);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [addAmounts, setAddAmounts] = useState({});
  const [editingGoal, setEditingGoal] = useState(null);
  const [editData, setEditData] = useState({ name: "", targetAmount: "", deadline: "", emoji: "" });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await axios.get("https://expense-tracker-3dmz.onrender.com/api/goals", authHeader());
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addGoal = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount) return alert("Please fill in name and target amount!");
    try {
      const res = await axios.post(
        "https://expense-tracker-3dmz.onrender.com/api/goals",
        { name, targetAmount, deadline, emoji },
        authHeader()
      );
      setGoals([res.data, ...goals]);
      setName("");
      setTargetAmount("");
      setDeadline("");
      setEmoji("🎯");
    } catch (err) {
      console.error(err);
    }
  };

  const addMoney = async (id) => {
    const amount = addAmounts[id];
    if (!amount || amount <= 0) return alert("Enter a valid amount!");
    try {
      const res = await axios.put(
        `https://expense-tracker-3dmz.onrender.com/api/goals/${id}/add`,
        { amount },
        authHeader()
      );
      setGoals(goals.map((g) => (g._id === id ? res.data : g)));
      setAddAmounts({ ...addAmounts, [id]: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const removeMoney = async (id) => {
    const amount = addAmounts[id];
    if (!amount || amount <= 0) return alert("Enter a valid amount!");
    try {
      const res = await axios.put(
        `https://expense-tracker-3dmz.onrender.com/api/goals/${id}/remove`,
        { amount },
        authHeader()
      );
      setGoals(goals.map((g) => (g._id === id ? res.data : g)));
      setAddAmounts({ ...addAmounts, [id]: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteGoal = async (id) => {
    try {
      await axios.delete(`https://expense-tracker-3dmz.onrender.com/api/goals/${id}`, authHeader());
      setGoals(goals.filter((g) => g._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const saveEdit = async () => {
    try {
      const res = await axios.put(
        `https://expense-tracker-3dmz.onrender.com/api/goals/${editingGoal._id}`,
        editData,
        authHeader()
      );
      setGoals(goals.map((g) => (g._id === editingGoal._id ? res.data : g)));
      setEditingGoal(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-container" data-theme={theme}>
      <h2 style={{ marginBottom: "20px" }}>🎯 Savings Goals</h2>

      {/* Add Goal Form */}
      <div className="card">
        <h4>Add New Goal</h4>
        <form onSubmit={addGoal}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              className="input"
              placeholder="Goal name (e.g. Buy a car)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="input"
              type="number"
              placeholder="Target amount"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
            <input
              className="input"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <input
              className="input emoji-input"
              placeholder="🎯"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
            />
          </div>
          <button type="submit" className="button primary" style={{ marginTop: "10px" }}>
            Add Goal
          </button>
        </form>
      </div>

      {/* Goals List */}
      <AnimatePresence>
        {goals.length === 0 ? (
          <p className="empty-text">No savings goals yet. Add one above!</p>
        ) : (
          goals.map((goal) => {
            const progress = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
            const isComplete = progress >= 100;
            const remaining = goal.targetAmount - goal.savedAmount;

            return (
              <motion.div
                key={goal._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card"
              >
                <div className="goal-header">
                  <h4>
                    {goal.emoji} {goal.name}
                  </h4>
                  <div className="goal-actions">
                    <button
                      className="button edit"
                      onClick={() => {
                        setEditingGoal(goal);
                        setEditData({
                          name: goal.name,
                          targetAmount: goal.targetAmount,
                          deadline: goal.deadline
                            ? new Date(goal.deadline).toISOString().split("T")[0]
                            : "",
                          emoji: goal.emoji,
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button className="button delete" onClick={() => deleteGoal(goal._id)}>
                      Delete
                    </button>
                  </div>
                </div>

                <div className="goal-info">
                  <span>
                    Saved: <strong>{formatCurrency(goal.savedAmount, currency)}</strong>
                  </span>
                  <span>
                    Target: <strong>{formatCurrency(goal.targetAmount, currency)}</strong>
                  </span>
                  {goal.deadline && (
                    <span>
                      Deadline: <strong>{new Date(goal.deadline).toLocaleDateString()}</strong>
                    </span>
                  )}
                </div>

                <div className="progress-bar">
                  <div
                    className="progress"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: isComplete ? "#2ecc71" : "#6366f1",
                    }}
                  />
                </div>

                <div className="goal-footer">
                  <span>{progress.toFixed(1)}% complete</span>
                  {!isComplete && <span>Remaining: {formatCurrency(remaining, currency)}</span>}
                  {isComplete && <span className="goal-complete">🎉 Goal Reached!</span>}
                </div>

                {!isComplete && (
                  <div className="goal-add-money">
                    <input
                      type="number"
                      placeholder="Add amount"
                      className="input"
                      value={addAmounts[goal._id] || ""}
                      onChange={(e) => setAddAmounts({ ...addAmounts, [goal._id]: e.target.value })}
                    />
                    <button className="button success" onClick={() => addMoney(goal._id)}>
                      Add
                    </button>
                    <button className="button danger" onClick={() => removeMoney(goal._id)}>
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
        <div className="modal-backdrop">
          <div className="modal-card">
            <h4>Edit Goal</h4>
            <input
              className="input"
              placeholder="Goal name"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
            <input
              className="input"
              type="number"
              placeholder="Target amount"
              value={editData.targetAmount}
              onChange={(e) => setEditData({ ...editData, targetAmount: e.target.value })}
            />
            <input
              className="input"
              type="date"
              value={editData.deadline}
              onChange={(e) => setEditData({ ...editData, deadline: e.target.value })}
            />
            <input
              className="input emoji-input"
              placeholder="Emoji"
              value={editData.emoji}
              onChange={(e) => setEditData({ ...editData, emoji: e.target.value })}
            />
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
              <button className="button primary" style={{ flex: 1 }} onClick={saveEdit}>
                Save
              </button>
              <button className="button secondary" style={{ flex: 1 }} onClick={() => setEditingGoal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}