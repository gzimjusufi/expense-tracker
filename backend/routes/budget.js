// routes/budget.js
import express from "express";
import Budget from "../models/Budget.js";

const router = express.Router();

// =========================
// 📌 GET USER BUDGET
// =========================
router.get("/", async (req, res) => {
  try {
    // Look for budget for this specific user
    let budget = await Budget.findOne({ user: req.user.id });
    if (!budget) {
      // If not found, create default budget for this user
      budget = await Budget.create({ monthlyBudget: 1000, user: req.user.id });
    }
    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =========================
// 📌 UPDATE USER BUDGET
// =========================
router.put("/", async (req, res) => {
  try {
    const { monthlyBudget } = req.body;
    if (!monthlyBudget || isNaN(monthlyBudget)) {
      return res.status(400).json({ message: "Invalid budget amount" });
    }

    let budget = await Budget.findOne({ user: req.user.id });
    if (!budget) {
      // If budget does not exist for this user, create it
      budget = await Budget.create({ monthlyBudget, user: req.user.id });
    } else {
      budget.monthlyBudget = monthlyBudget;
      await budget.save();
    }

    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
