import express from "express";
import Goal from "../models/Goal.js";
import User from "../models/user.js";
import { sendGoalReached } from "../utils/mailer.js";

const router = express.Router();

// Get all goals
router.get("/", async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create goal
router.post("/", async (req, res) => {
  try {
    const { name, targetAmount, deadline, emoji } = req.body;
    if (!name || !targetAmount) return res.status(400).json({ message: "Name and target amount are required" });

    const goal = new Goal({
      user: req.user.id,
      name,
      targetAmount,
      deadline,
      emoji: emoji || "🎯",
    });
    await goal.save();
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add money to goal
router.put("/:id/add", async (req, res) => {
  try {
    const { amount } = req.body;
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $inc: { savedAmount: Number(amount) } },
      { new: true }
    );
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    // Send email if goal is reached
    if (goal.savedAmount >= goal.targetAmount) {
      const user = await User.findById(req.user.id);
      if (user) await sendGoalReached(user.email, user.name, goal.name, goal.savedAmount);
    }

    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Edit goal
router.put("/:id", async (req, res) => {
  try {
    const { name, targetAmount, deadline, emoji } = req.body;
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name, targetAmount, deadline, emoji },
      { new: true }
    );
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete goal
router.delete("/:id", async (req, res) => {
  try {
    await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: "Goal deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;