import cron from "node-cron";
import Expense from "../models/Expense.js";
import User from "../models/user.js";
import Goal from "../models/Goal.js";
import { sendExpenseReminder, sendMonthlySummary, sendGoalDeadlineReminder, sendWeeklyGoalsSummary } from "../utils/mailer.js";
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
cron.schedule("0 0 * * *", async () => {
  try {
    const today = new Date();
    console.log("⏰ Running daily recurring expense check:", today.toDateString());

    const dueExpenses = await Expense.find({
      recurring: true,
      nextDueDate: { $lte: today },
    });

    for (let expense of dueExpenses) {
      const user = await User.findById(expense.user);
      if (!user) continue;

      const newExpense = new Expense({
        user: expense.user,
        category: expense.category,
        amount: expense.amount,
        date: expense.nextDueDate,
        description: expense.description,
        recurring: false,
        recurrence: null,
        nextDueDate: null,
        tags: expense.tags || [],
      });
      await newExpense.save();

      await sendExpenseReminder(user.email, "💡 Expense Reminder", {
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        nextDueDate: expense.nextDueDate,
      });

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

      const expenses = await Expense.find({
        user: user._id,
        date: { $gte: startOfMonth, $lt: endOfMonth },
      });

      if (expenses.length === 0) continue;

      const summary = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {});

      const categories = Object.entries(summary).map(([name, amount]) => ({ name, amount }));
      const total = categories.reduce((sum, c) => sum + c.amount, 0);

      await sendMonthlySummary(user.email, user.name || "User", {
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

/* =========================
   ⏰ CRON JOB 3: GOAL DEADLINE REMINDERS
========================= */
cron.schedule("0 9 * * *", async () => {
  try {
    console.log("⏰ Checking goal deadlines...");
    const today = new Date();
    const in7Days = new Date();
    in7Days.setDate(today.getDate() + 7);

    const goals = await Goal.find({
      deadline: { $gte: today, $lte: in7Days },
      $expr: { $lt: ["$savedAmount", "$targetAmount"] }
    });

    for (let goal of goals) {
      const user = await User.findById(goal.user);
      if (!user) continue;
      const remaining = goal.targetAmount - goal.savedAmount;
      await sendGoalDeadlineReminder(user.email, user.name, goal.name, remaining, goal.deadline);
      console.log(`⏰ Deadline reminder sent to ${user.email} for goal: ${goal.name}`);
    }
  } catch (err) {
    console.error("❌ Error checking goal deadlines:", err);
  }
});

/* =========================
   📊 CRON JOB 4: WEEKLY GOALS SUMMARY
========================= */
cron.schedule("0 9 * * 1", async () => {
  try {
    console.log("📊 Sending weekly goal summaries...");
    const users = await User.find();

    for (let user of users) {
      const goals = await Goal.find({ user: user._id });
      if (goals.length === 0) continue;

      await sendWeeklyGoalsSummary(user.email, user.name, goals);
      console.log(`📊 Weekly goal summary sent to ${user.email}`);
    }

    console.log("✅ Weekly goal summaries sent successfully.");
  } catch (err) {
    console.error("❌ Error sending weekly goal summaries:", err);
  }
});