import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: function () {
      return !this.googleId;
    },
  },
  googleId: { type: String, unique: true, sparse: true },
  isVerified: { type: Boolean, default: false },
  monthlyBudget: { type: Number, default: 1000 },
  currency: { type: String, default: "USD" },
  avatar: { type: String, default: "" },
});

const User = mongoose.model("User", userSchema);

export default User;