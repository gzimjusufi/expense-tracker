import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import session from "express-session";
import passport from "passport";
import { sendLoginNotification, sendExpenseReminder, sendVerificationEmail } from "./utils/mailer.js";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import "./cronJobs/recurringExpenses.js";

// Routes
import expenseRoutes from "./routes/ExpenseRoutes.js";
import budgetRoutes from "./routes/budget.js";

import User from "./models/user.js"; // User model

dotenv.config();

const app = express();

// =============================
// 🔹 CONFIGURATION
// =============================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI || !JWT_SECRET) {
  console.error("❌ MONGO_URI or JWT_SECRET missing in .env");
  process.exit(1);
}

// =============================
// 🔹 MIDDLEWARES
// =============================
app.use(cors());
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

// =============================
// 🔹 SESSION + PASSPORT
// =============================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboardcat",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// =============================
// 🔹 GOOGLE OAUTH CONFIG
// =============================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name: profile.displayName,
        email,
        googleId: profile.id,
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google to existing account
      user.googleId = profile.id;
      await user.save();
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// =============================
// 🔹 AUTH MIDDLEWARE
// =============================
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // attach user info to request
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// =============================
// 🔹 AUTH ROUTES
// =============================

// Register

app.get("/api/auth/verify-email", async (req, res) => {
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
    res.status(400).send("Token expired or invalid");
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let existing = await User.findOne({ email });

    if (existing && existing.googleId) {
      return res.status(400).json({ message: "Email already registered via Google. Please login with Google." });
    }

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    let hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const user = new User({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
    });

    await user.save();

    const verificationToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });
    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      message: "Account created! Please check your email to verify your account.",
    });
  } catch (err) {
    console.error("🔥 Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // ADD THIS CHECK:
    if (!user.isVerified && !user.googleId) {
      return res.status(403).json({ message: "Please verify your email before logging in" });
    }

    const isMatch = user.password ? await bcrypt.compare(password, user.password) : false;
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    // ✅ Send login email
await sendLoginNotification(user.email, user.name || "");
await sendExpenseReminder(user.email, "Login Notification", {
  category: "Login Notification",
  amount: 0,
  nextDueDate: new Date().toISOString(),
  description: "You successfully logged into Expense Tracker!",
});


    res.json({ token, user: { id: user._id, name: user.name, email } });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// Verify & get current user
app.get("/api/auth/verify", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error("❌ Verify error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// =============================
// 🔹 GOOGLE OAUTH ROUTES
// =============================
app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  async (req, res) => {
    try {
      // Create JWT
      const token = jwt.sign(
        { id: req.user._id, email: req.user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // ✅ Send email to user who just logged in via Google
await sendExpenseReminder(
  req.user.email,
  "Login Notification",
  { 
    category: "Login Notification", 
    amount: 0, 
    nextDueDate: new Date().toISOString(), 
    description: "You successfully logged into Expense Tracker via Google!" 
  }
);

      // Redirect to frontend with token
      res.redirect(`http://localhost:3000/oauth-success?token=${token}`);
    } catch (err) {
      console.error("❌ Google login email error:", err);
      res.redirect("/login");
    }
  }
);
// =============================
// 🔹 PROTECTED ROUTES
// =============================
app.use("/api/expenses", authMiddleware, expenseRoutes);
app.use("/api/budget", authMiddleware, budgetRoutes);

// Root test route
app.get("/", (req, res) => {
  res.send("🚀 Expense Tracker API is running...");
});

// =============================
// 🔹 MONGODB CONNECTION
// =============================
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// =============================
// 🔹 GLOBAL ERROR HANDLER
// =============================
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({ message: "Something went wrong on the server!" });
});

// =============================
// 🔹 HANDLE UNHANDLED PROMISES
// =============================
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  process.exit(1);
});
