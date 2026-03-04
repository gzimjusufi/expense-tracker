import express from "express";
import Expense from "../models/Expense.js";
import { Parser } from "json2csv";
import multer from "multer";
import User from "../models/user.js";
import { sendBudgetWarning, sendBudgetExceeded } from "../utils/mailer.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// =========================
// 📌 CREATE NEW EXPENSE
// =========================
router.post("/", async (req, res) => {
  try {
    const { category, amount, date, description, recurring, recurrence, tags } = req.body;

    if (!category || !amount || !date) {
      return res.status(400).json({ message: "Category, amount, and date are required" });
    }

    // Calculate next due date if recurring
    let nextDueDate = null;
    if (recurring) {
      nextDueDate = calculateNextDue(recurrence, date);
    }

    const expense = new Expense({
      category,
      amount: parseFloat(amount),
      date,
      description,
      recurring: recurring || false,
      recurrence: recurring ? recurrence : null,
      nextDueDate,
      tags: tags || [],
      user: req.user.id, // 🔹 USER SCOPED
    });

    await expense.save();

    // Check budget after saving expense
const user = await User.findById(req.user.id);
if (user && user.monthlyBudget) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const expenses = await Expense.find({
    user: req.user.id,
    date: { $gte: startOfMonth }
  });

  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budget = user.monthlyBudget;
  const percentage = (spent / budget) * 100;

  console.log(`💰 Budget check: spent=${spent}, budget=${budget}, percentage=${percentage}%`);

  if (percentage >= 100) {
    await sendBudgetExceeded(user.email, user.name, spent, budget);
  } else if (percentage >= 80) {
    await sendBudgetWarning(user.email, user.name, spent, budget);
  }
}

    // ✅ Immediately create today's instance if recurring
    if (recurring) {
      const existingExpense = await Expense.findOne({
        category,
        amount: parseFloat(amount),
        description,
        date: new Date(date),
        user: req.user.id, // 🔹 USER SCOPED
      });

      if (!existingExpense) {
        const todayExpense = new Expense({
          category,
          amount: parseFloat(amount),
          date: new Date(date),
          description,
          recurring,
          recurrence,
          nextDueDate: calculateNextDue(recurrence, date),
          user: req.user.id, // 🔹 USER SCOPED
        });

        await todayExpense.save();
      }
    }

    res.status(201).json(expense);
  } catch (err) {
    console.error("Error saving expense:", err);
    res.status(500).json({ message: "Failed to create expense" });
  }
});

// =========================
// 📌 GET ALL EXPENSES
// =========================
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 }); // 🔹 USER SCOPED
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =========================
// 📌 DELETE EXPENSE
// =========================
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user.id }); // 🔹 USER SCOPED
    if (!deleted) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =========================
// 📌 UPDATE EXPENSE
// =========================
router.put("/:id", async (req, res) => {
  try {
    const { category, amount, date, description, recurring, recurrence, tags } = req.body;

    if (!category || !amount || !date) {
      return res.status(400).json({ message: "Category, amount, and date are required" });
    }

    const nextDueDate = recurring && recurrence ? calculateNextDue(recurrence, date) : null;

    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id }, // 🔹 USER SCOPED
      {
        category,
        amount: parseFloat(amount),
        date,
        description,
        recurring,
        recurrence: recurring ? recurrence : null,
        nextDueDate,
        tags: tags || [],
      },
      { new: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json(updatedExpense);
  } catch (err) {
    console.error("Error updating expense:", err);
    res.status(500).json({ message: "Failed to update expense" });
  }
});

// =========================
// 📌 BUDGET
// =========================
router.get("/budget", async (req, res) => {
  try {
    const lastExpense = await Expense.findOne({ user: req.user.id }).sort({ createdAt: -1 }); // 🔹 USER SCOPED
    if (lastExpense) return res.json({ monthlyBudget: lastExpense.budget || 1000 });
    return res.json({ monthlyBudget: 1000 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/budget", async (req, res) => {
  try {
    const { monthlyBudget } = req.body;
    if (!monthlyBudget || isNaN(monthlyBudget)) {
      return res.status(400).json({ message: "Invalid budget amount" });
    }
    await Expense.updateMany({ user: req.user.id }, { $set: { budget: monthlyBudget } }); // 🔹 USER SCOPED
    res.json({ monthlyBudget, message: "Budget updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =========================
// 📌 EXPORT EXPENSES AS CSV
// =========================
router.get("/export/csv", async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 }); // 🔹 USER SCOPED
    if (!expenses.length) return res.status(404).json({ message: "No expenses found" });

    const fields = ["category", "amount", "date", "description", "recurring", "recurrence"];
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(expenses);

    res.header("Content-Type", "text/csv");
    res.attachment("expenses.csv");
    res.send(csv);
  } catch (err) {
    console.error("Error exporting CSV:", err);
    res.status(500).json({ message: "Failed to export CSV" });
  }
});

// =========================
// 📌 IMPORT EXPENSES VIA CSV
// =========================
router.post("/import/csv", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const csvData = req.file.buffer.toString("utf-8");
    const lines = csvData.split("\n");

    const importedExpenses = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].replace(/\r/g, "").trim(); // fix Windows line endings
        console.log(`Row ${i}:`, JSON.stringify(line)); // ADD THIS
      if (!line) continue; // skip empty lines

      const row = line.split(",").map(val => val.replace(/^"|"$/g, "").trim());
      if (row.length < 3) continue;

      const date = new Date(row[2]);
      if (isNaN(date.getTime())) continue; // skip invalid dates

      const recurrence = row[5] ? row[5].trim() : null;
      const validRecurrences = ["daily", "weekly", "monthly", null];
      const safeRecurrence = validRecurrences.includes(recurrence) ? recurrence : null;

      importedExpenses.push({
        category: row[0].trim(),
        amount: parseFloat(row[1]),
        date,
        description: row[3] ? row[3].trim() : "",
        recurring: row[4] === "true",
        recurrence: safeRecurrence,
        nextDueDate: row[4] === "true" && safeRecurrence ? calculateNextDue(safeRecurrence, row[2]) : null,
        user: req.user.id,
      });
    }

    await Expense.insertMany(importedExpenses);
    res.status(201).json({ message: "Expenses imported successfully", imported: importedExpenses.length });
  } catch (err) {
    console.error("Error importing CSV:", err);
    res.status(500).json({ message: "Failed to import CSV" });
  }
});

// =========================
// 📌 UPCOMING RECURRING EXPENSES
// =========================
router.get("/upcoming", async (req, res) => {
  try {
    const today = new Date();
    const upcoming = await Expense.find({
      recurring: true,
      nextDueDate: { $gte: today },
      user: req.user.id, // 🔹 USER SCOPED
    }).sort({ nextDueDate: 1 });
    res.json(upcoming);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =========================
// 📌 FILTER EXPENSES
// =========================
router.get("/filter", async (req, res) => {
  try {
    const { categories, startDate, endDate } = req.query;

    const query = { user: req.user.id }; // 🔹 USER SCOPED

    if (categories) {
      const categoryArray = categories.split(",");
      query.category = { $in: categoryArray };
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error("Error filtering expenses:", err);
    res.status(500).json({ message: "Failed to filter expenses" });
  }
});

// =========================
// 📌 COMPARE EXPENSES
// =========================
router.get("/compare", async (req, res) => {
  try {
    const { start1, end1, start2, end2 } = req.query;

    if (!start1 || !end1 || !start2 || !end2) {
      return res.status(400).json({ message: "All start and end dates are required" });
    }

    const period1 = await Expense.find({
      date: { $gte: new Date(start1), $lte: new Date(end1) },
      user: req.user.id, // 🔹 USER SCOPED
    });

    const period2 = await Expense.find({
      date: { $gte: new Date(start2), $lte: new Date(end2) },
      user: req.user.id, // 🔹 USER SCOPED
    });

    const sum1 = period1.reduce((acc, exp) => acc + exp.amount, 0);
    const sum2 = period2.reduce((acc, exp) => acc + exp.amount, 0);

    res.json({
      period1: { start: start1, end: end1, total: sum1, count: period1.length },
      period2: { start: start2, end: end2, total: sum2, count: period2.length },
    });
  } catch (err) {
    console.error("Error comparing expenses:", err);
    res.status(500).json({ message: "Failed to compare expenses" });
  }
});

// =========================
// 🔹 HELPER: Calculate Next Due Date
// =========================
function calculateNextDue(recurrence, fromDate) {
  const date = new Date(fromDate);
  switch (recurrence) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      return null;
  }
  return date;
}

export default router;
