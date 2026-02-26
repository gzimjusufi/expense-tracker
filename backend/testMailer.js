import { sendVerificationEmail, sendWelcomeEmail, sendLoginNotification, sendExpenseReminder, sendMonthlySummary } from "./utils/mailer.js";

const TEST_EMAIL = "jusufigzim2@gmail.com"; // change this

console.log("Testing all email functions...");

await sendVerificationEmail(TEST_EMAIL, "test-token-123");
console.log("✅ Verification email sent");

await sendWelcomeEmail(TEST_EMAIL, "Test User");
console.log("✅ Welcome email sent");

await sendLoginNotification(TEST_EMAIL, "Test User");
console.log("✅ Login notification sent");

await sendExpenseReminder(TEST_EMAIL, "Login Notification", {
  category: "Food",
  description: "Test expense",
  amount: 50,
  nextDueDate: new Date().toISOString(),
});
console.log("✅ Expense reminder sent");

await sendMonthlySummary(TEST_EMAIL, "Test User", {
  total: 500,
  month: "February 2026",
  categories: [
    { name: "Food", amount: 200 },
    { name: "Transport", amount: 300 },
  ],
});
console.log("✅ Monthly summary sent");