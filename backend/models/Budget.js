import mongoose from "mongoose";

const BudgetSchema = new mongoose.Schema(
  {
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    monthlyBudget: {
      type: Number,
      required: true,
      default: 1000, // Default budget value
    },
  },
  { timestamps: true }
);

export default mongoose.model("Budget", BudgetSchema);
