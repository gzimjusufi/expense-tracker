import Expense from "./models/Expense.js";
import User from "./models/user.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log("✅ Connected to MongoDB");

function calculateNextDue(recurrence, fromDate) {
  const date = new Date(fromDate);
  switch (recurrence) {
    case "daily": date.setDate(date.getDate() + 1); break;
    case "weekly": date.setDate(date.getDate() + 7); break;
    case "monthly": date.setMonth(date.getMonth() + 1); break;
    default: return null;
  }
  return date;
}

const today = new Date();
const dueExpenses = await Expense.find({ recurring: true, nextDueDate: { $lte: today } });
console.log(`Found ${dueExpenses.length} due recurring expenses`);

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

  expense.nextDueDate = calculateNextDue(expense.recurrence, expense.nextDueDate);
  await expense.save();

  console.log(`✅ Added: ${expense.category} | tags: ${newExpense.tags}`);
}

await mongoose.disconnect();
console.log("Done!");