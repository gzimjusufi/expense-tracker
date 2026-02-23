import dotenv from "dotenv";
import { sendExpenseReminder } from "./utils/mailer.js";

dotenv.config();

const user = {
  email: process.env.TEST_EMAIL || "youremail@example.com",
  username: "Gzim",
};

(async () => {
  console.log("🚀 Testing email send...");
  await sendExpenseReminder(
    user.email,
    "Login Notification",
    {
      category: "Login Notification",
      description: "You successfully logged into Expense Tracker via Google!",
      amount: 0,
      nextDueDate: new Date().toISOString(),
    }
  );
})();
