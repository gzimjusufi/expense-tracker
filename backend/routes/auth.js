import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import auth from "../middleware/auth.js";
import {
  sendExpenseReminder,
  sendWelcomeEmail,
  sendLoginNotification,
  sendVerificationEmail,
} from "../utils/mailer.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ========================= REGISTER =========================
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: "Please enter all fields" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const newUser = new User({ name: username, email, password: hashed, isVerified: false });
    await newUser.save();

    console.log("✅ User registered:", newUser.email);

    // Generate verification token (expires in 1 day)
    const verificationToken = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "1d" });

    // Send verification email
    await sendVerificationEmail(newUser.email, verificationToken);

    // Optional: Send welcome email + expense reminder
    await sendWelcomeEmail(newUser.email, newUser.username);
    await sendExpenseReminder(
      newUser.email,
      "Welcome to Expense Tracker 🎉",
      `Hi ${newUser.username}, your account has been successfully created!`
    );

    res.status(201).json({
      message: "User registered successfully. Please check your email to verify your account.",
    });
  } catch (err) {
    console.error("❌ Register error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ========================= EMAIL VERIFICATION =========================
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send("Missing token");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).send("Invalid token");
    if (user.isVerified) return res.send("Email already verified!");

    user.isVerified = true;
    await user.save();

    res.send("Email verified successfully! You can now log in.");
  } catch (err) {
    console.error("❌ Email verification error:", err.message);
    res.status(400).send("Token expired or invalid");
  }
});

// ========================= LOGIN =========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Please enter all fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Check email verification
    if (!user.isVerified)
      return res.status(403).json({ message: "Please verify your email before logging in" });

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    console.log("✅ User logged in:", user.email);

    // Send login notification
    await sendLoginNotification(user.email, user.username);
    await sendExpenseReminder(user.email, "Login Notification", {
      category: "Login Notification",
      amount: 0,
      nextDueDate: new Date().toISOString(),
      description: "You successfully logged into Expense Tracker!",
    });

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ========================= VERIFY TOKEN =========================
router.get("/verify", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("❌ Verify error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ========================= GOOGLE LOGIN =========================
router.post("/google-login", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ username: name, email, password: null, isVerified: true }); // Google users auto verified
      await user.save();
      console.log("✅ New Google user created:", email);

      await sendWelcomeEmail(user.email, user.username || name);
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    await sendLoginNotification(user.email, user.username || name);
    await sendExpenseReminder(user.email, "Login Notification", {
      category: "Login Notification",
      amount: 0,
      nextDueDate: new Date().toISOString(),
      description: "You successfully logged into Expense Tracker via Google!",
    });

    console.log("📧 Google login email sent to:", user.email);

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("❌ Google login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
