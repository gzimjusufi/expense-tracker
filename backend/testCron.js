import Expense from "./models/Expense.js";
import User from "./models/user.js";
import { sendExpenseReminder } from "./utils/mailer.js";
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
const dueExpenses = await Expense.find({
  recurring: true,
  nextDueDate: { $lte: today },
});

console.log(`Found ${dueExpenses.length} due recurring expenses`);

for (let expense of dueExpenses) {
  const user = await User.findById(expense.user);
  if (!user) continue;

  console.log(`Processing: ${expense.category} for ${user.email}`);

  await sendExpenseReminder(user.email, "💡 Expense Reminder", {
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    nextDueDate: expense.nextDueDate,
  });

  expense.nextDueDate = calculateNextDue(expense.recurrence, expense.nextDueDate);
  await expense.save();

  console.log(`✅ Done - next due: ${expense.nextDueDate}`);
}

await mongoose.disconnect();
console.log("Done!");