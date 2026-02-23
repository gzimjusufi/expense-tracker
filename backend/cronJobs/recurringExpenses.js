import cron from "node-cron";
import Expense from "../models/Expense.js";
import User from "../models/user.js";
import { sendExpenseReminder, sendMonthlySummary } from "../utils/mailer.js"; // ✅ Use the shared mailer
import dotenv from "dotenv";

dotenv.config();

/* =========================
   🧮 HELPER: NEXT DUE DATE
========================= */
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

/* =========================
   🕛 CRON JOB 1: DAILY REMINDERS
========================= */
// Runs every day at midnight (00:00)
cron.schedule("0 0 * * *", async () => {
  try {
    const today = new Date();

    console.log("⏰ Running daily recurring expense check:", today.toDateString());

    // Find all recurring expenses that are due today or earlier
    const dueExpenses = await Expense.find({
      recurring: true,
      nextDueDate: { $lte: today },
    });

    for (let expense of dueExpenses) {
      const user = await User.findById(expense.userId);
      if (!user) continue;

      // Clone expense for the next cycle
      const newExpense = new Expense({
        userId: expense.userId,
        category: expense.category,
        amount: expense.amount,
        date: expense.nextDueDate,
        description: expense.description,
        recurring: expense.recurring,
        recurrence: expense.recurrence,
        nextDueDate: calculateNextDue(expense.recurrence, expense.nextDueDate),
      });
      await newExpense.save();

      // ✅ Send polished email reminder
      await sendExpenseReminder(user.email, "💡 Expense Reminder", {
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        nextDueDate: expense.nextDueDate,
      });

      // Update original expense’s next due date
      expense.nextDueDate = calculateNextDue(expense.recurrence, expense.nextDueDate);
      await expense.save();

      console.log(`📧 Reminder sent to ${user.email} for ${expense.category}`);
    }

    if (dueExpenses.length > 0) {
      console.log(`✅ Processed ${dueExpenses.length} recurring expenses.`);
    } else {
      console.log("ℹ️ No recurring expenses due today.");
    }
  } catch (err) {
    console.error("❌ Error processing recurring expenses:", err);
  }
});

/* =========================
   📊 CRON JOB 2: MONTHLY SUMMARY
========================= */
// Runs at midnight on the 1st day of every month
cron.schedule("0 0 1 * *", async () => {
  try {
    console.log("📊 Running monthly expense summary job...");

    const users = await User.find();

    for (let user of users) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      // Get user’s expenses for the last month
      const expenses = await Expense.find({
        userId: user._id,
        date: { $gte: startOfMonth, $lt: endOfMonth },
      });

      if (expenses.length === 0) continue;

      // Group by category
      const summary = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {});

      const categories = Object.entries(summary).map(([name, amount]) => ({
        name,
        amount,
      }));

      const total = categories.reduce((sum, c) => sum + c.amount, 0);

      // ✅ Send monthly summary email
      await sendMonthlySummary(user.email, user.username || user.name || "User", {
        month: new Date().toLocaleString("default", { month: "long", year: "numeric" }),
        total,
        categories,
      });

      console.log(`📊 Monthly summary sent to ${user.email}`);
    }

    console.log("✅ Monthly summary job completed successfully.");
  } catch (err) {
    console.error("❌ Error running monthly summary job:", err);
  }
});
