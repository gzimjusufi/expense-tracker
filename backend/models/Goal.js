import mongoose from "mongoose";

const GoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  savedAmount: { type: Number, default: 0 },
  deadline: { type: Date },
  emoji: { type: String, default: "🎯" },
  createdAt: { type: Date, default: Date.now },
});

const Goal = mongoose.model("Goal", GoalSchema);
export default Goal;