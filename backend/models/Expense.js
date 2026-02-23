import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  description: { type: String },
  recurring: { type: Boolean, default: false },
  recurrence: {
    type: String,
    enum: ["daily", "weekly", "monthly"], 
  },
  nextDueDate: { type: Date },
});

const Expense = mongoose.model("Expense", ExpenseSchema);
export default Expense;
