import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

/* =========================
   🧼  HELPER FUNCTIONS
========================= */

function cleanText(value) {
  if (value == null) return "";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

/* =========================
   🧩  BASE TEMPLATE
========================= */

function baseTemplate(title, contentHTML) {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background-color:#f7f7f7;padding:30px;">
      <div style="max-width:600px;background:white;margin:0 auto;border-radius:10px;
      box-shadow:0 2px 8px rgba(0,0,0,0.1);overflow:hidden;">
        <div style="background-color:#4CAF50;padding:20px;text-align:center;color:white;">
          <h2 style="margin:0;">Expense Tracker</h2>
        </div>
        <div style="padding:25px;color:#333;">
          <h3 style="color:#4CAF50;">${cleanText(title)}</h3>
          ${contentHTML}
        </div>
        <div style="background-color:#f0f0f0;text-align:center;padding:10px;
        font-size:12px;color:#777;">
          <p>© ${new Date().getFullYear()} Expense Tracker. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}

/* =========================
   📬  SEND EMAIL HELPER
========================= */

async function sendEmail(to, subject, html, attachments = []) {
  const payload = {
    from: "Expense Tracker <onboarding@resend.dev>",
    to,
    subject,
    html,
  };
  if (attachments.length > 0) {
    payload.attachments = attachments.map(att => ({
      filename: att.filename,
      content: Buffer.isBuffer(att.content) 
        ? att.content.toString("base64") 
        : att.content,
    }));
  }
  const { error } = await resend.emails.send(payload);
  if (error) throw new Error(error.message);
}

/* =========================
   📬  SEND EXPENSE REMINDER
========================= */

export async function sendExpenseReminder(to, subject, data) {
  try {
    if (typeof subject === "object" && data === undefined) {
      data = subject;
      subject = (subject && subject.category) || "Expense Tracker Update";
    }

    const subjectLine =
      typeof subject === "string"
        ? subject
        : (subject && subject.category) || "Expense Tracker Update";

    let messageBody = "";

    if (data && typeof data === "object") {
      const { category, description, amount, nextDueDate } = data;
      messageBody = `
        <div style="line-height:1.6;font-size:15px;">
          <p><strong style="color:#4CAF50;">Category:</strong> ${cleanText(category) || "N/A"}</p>
          <p><strong style="color:#4CAF50;">Description:</strong> ${cleanText(description) || "No description provided."}</p>
          <p><strong style="color:#4CAF50;">Amount:</strong> ${amount ?? 0}</p>
          <p><strong style="color:#4CAF50;">Next Due Date:</strong> ${
            nextDueDate ? new Date(nextDueDate).toLocaleString() : "N/A"
          }</p>
        </div>
      `;
    } else if (typeof data === "string") {
      messageBody = `<p style="font-size:15px;">${data}</p>`;
    } else {
      messageBody = `<p style="font-size:15px;">You have a new update from Expense Tracker.</p>`;
    }

    const html = baseTemplate(subjectLine, messageBody);
    await sendEmail(to, subjectLine, html);
    console.log(`📧 Reminder email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending reminder:", err);
  }
}

/* =========================
   🎉  WELCOME EMAIL
========================= */

export async function sendWelcomeEmail(to, name) {
  try {
    const content = `
      <p style="font-size:15px;">🎉 Welcome to <strong>Expense Tracker</strong>, ${cleanText(name)}!</p>
      <p style="font-size:15px;">We're thrilled to have you join. Track your expenses and stay financially smart 💰.</p>
    `;
    const html = baseTemplate("Welcome to Expense Tracker!", content);
    await sendEmail(to, "👋 Welcome to Expense Tracker!", html);
    console.log(`✅ Welcome email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending welcome email:", err);
  }
}

/* =========================
   🔔  LOGIN NOTIFICATION
========================= */

export async function sendLoginNotification(to, name) {
  try {
    const content = `
      <p style="font-size:15px;">👋 Hi ${cleanText(name)}, you just logged into your <strong>Expense Tracker</strong> account.</p>
      <p style="font-size:15px;">If this was you — awesome! If not, please secure your account immediately.</p>
    `;
    const html = baseTemplate("New Login Detected", content);
    await sendEmail(to, "🔔 New Login Detected", html);
    console.log(`✅ Login notification sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending login email:", err);
  }
}

/* =========================
   📊  MONTHLY EXPENSE SUMMARY
========================= */

export async function sendMonthlySummary(to, name, summaryData) {
  try {
    const { total = 0, month, categories = [] } = summaryData || {};
    const categoryRows = categories.length
      ? categories.map((c) => `
          <tr>
            <td style="padding:8px 12px;">${cleanText(c.name)}</td>
            <td style="padding:8px 12px;text-align:right;">$${Number(c.amount).toFixed(2)}</td>
          </tr>`).join("")
      : `<tr><td colspan="2" style="padding:10px;text-align:center;">No expenses recorded this month.</td></tr>`;

    const content = `
      <p style="font-size:15px;">Hi ${cleanText(name)},</p>
      <p style="font-size:15px;">Here's a quick summary of your expenses for <strong>${month}</strong>:</p>
      <table style="width:100%;border-collapse:collapse;margin-top:15px;">
        <thead>
          <tr style="background-color:#f0f0f0;">
            <th style="text-align:left;padding:8px 12px;">Category</th>
            <th style="text-align:right;padding:8px 12px;">Amount</th>
          </tr>
        </thead>
        <tbody>${categoryRows}</tbody>
        <tfoot>
          <tr style="border-top:2px solid #4CAF50;font-weight:bold;">
            <td style="padding:10px 12px;">Total</td>
            <td style="padding:10px 12px;text-align:right;">$${Number(total).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <p style="margin-top:20px;font-size:15px;">Great job keeping track of your finances this month 💪.</p>
    `;
    const html = baseTemplate(`📊 ${month} Expense Summary`, content);
    await sendEmail(to, `📊 ${month} Expense Summary`, html);
    console.log(`✅ Monthly summary email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending monthly summary:", err);
  }
}

/* =========================
   ⚠️  BUDGET WARNING
========================= */

export async function sendBudgetWarning(to, name, spent, budget) {
  try {
    const percentage = Math.round((spent / budget) * 100);
    const content = `
      <p style="font-size:15px;">Hi ${cleanText(name)},</p>
      <p style="font-size:15px;">⚠️ You've used <strong>${percentage}%</strong> of your monthly budget.</p>
      <p style="font-size:15px;">
        <strong>Spent:</strong> $${spent.toFixed(2)}<br/>
        <strong>Budget:</strong> $${budget.toFixed(2)}<br/>
        <strong>Remaining:</strong> $${(budget - spent).toFixed(2)}
      </p>
      <p style="font-size:15px;">Consider slowing down your spending for the rest of the month!</p>
    `;
    const html = baseTemplate("⚠️ Budget Warning", content);
    await sendEmail(to, "⚠️ You've used 80% of your monthly budget", html);
    console.log(`✅ Budget warning sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending budget warning:", err);
  }
}

/* =========================
   🚨  BUDGET EXCEEDED
========================= */

export async function sendBudgetExceeded(to, name, spent, budget) {
  try {
    const overage = spent - budget;
    const content = `
      <p style="font-size:15px;">Hi ${cleanText(name)},</p>
      <p style="font-size:15px;">🚨 You've <strong>exceeded</strong> your monthly budget!</p>
      <p style="font-size:15px;">
        <strong>Spent:</strong> $${spent.toFixed(2)}<br/>
        <strong>Budget:</strong> $${budget.toFixed(2)}<br/>
        <strong>Over by:</strong> $${overage.toFixed(2)}
      </p>
      <p style="font-size:15px;">Please review your expenses and adjust your spending.</p>
    `;
    const html = baseTemplate("🚨 Budget Exceeded", content);
    await sendEmail(to, "🚨 You've exceeded your monthly budget!", html);
    console.log(`✅ Budget exceeded email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending budget exceeded email:", err);
  }
}

/* =========================
   📊  WEEKLY GOALS SUMMARY
========================= */

export async function sendWeeklyGoalsSummary(to, name, goals) {
  try {
    const goalRows = goals.map(g => {
      const progress = Math.min((g.savedAmount / g.targetAmount) * 100, 100).toFixed(1);
      return `
        <tr>
          <td style="padding:8px 12px;">${g.emoji} ${g.name}</td>
          <td style="padding:8px 12px;text-align:right;">$${g.savedAmount.toFixed(2)}</td>
          <td style="padding:8px 12px;text-align:right;">$${g.targetAmount.toFixed(2)}</td>
          <td style="padding:8px 12px;text-align:right;">${progress}%</td>
        </tr>
      `;
    }).join("");

    const content = `
      <p style="font-size:15px;">Hi ${cleanText(name)},</p>
      <p style="font-size:15px;">Here's your weekly savings goals update:</p>
      <table style="width:100%;border-collapse:collapse;margin-top:15px;">
        <thead>
          <tr style="background-color:#f0f0f0;">
            <th style="text-align:left;padding:8px 12px;">Goal</th>
            <th style="text-align:right;padding:8px 12px;">Saved</th>
            <th style="text-align:right;padding:8px 12px;">Target</th>
            <th style="text-align:right;padding:8px 12px;">Progress</th>
          </tr>
        </thead>
        <tbody>${goalRows}</tbody>
      </table>
      <p style="margin-top:20px;font-size:15px;">Keep saving! 💪</p>
    `;
    const html = baseTemplate("📊 Weekly Goals Summary", content);
    await sendEmail(to, "📊 Your Weekly Savings Goals Summary", html);
    console.log(`✅ Weekly goals summary sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending weekly goals summary:", err);
  }
}

/* =========================
   🎉  GOAL REACHED
========================= */

export async function sendGoalReached(to, name, goalName, amount) {
  try {
    const content = `
      <p style="font-size:15px;">Hi ${cleanText(name)},</p>
      <p style="font-size:15px;">🎉 Congratulations! You've reached your savings goal!</p>
      <p style="font-size:15px;">
        <strong>Goal:</strong> ${cleanText(goalName)}<br/>
        <strong>Amount Saved:</strong> $${Number(amount).toFixed(2)}
      </p>
      <p style="font-size:15px;">Keep up the great work! 💪</p>
    `;
    const html = baseTemplate("🎉 Goal Reached!", content);
    await sendEmail(to, `🎉 You've reached your savings goal: ${goalName}`, html);
    console.log(`✅ Goal reached email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending goal reached email:", err);
  }
}

/* =========================
   ⏰  GOAL DEADLINE REMINDER
========================= */

export async function sendGoalDeadlineReminder(to, name, goalName, remaining, deadline) {
  try {
    const content = `
      <p style="font-size:15px;">Hi ${cleanText(name)},</p>
      <p style="font-size:15px;">⏰ Your savings goal deadline is approaching!</p>
      <p style="font-size:15px;">
        <strong>Goal:</strong> ${cleanText(goalName)}<br/>
        <strong>Deadline:</strong> ${new Date(deadline).toLocaleDateString()}<br/>
        <strong>Still needed:</strong> $${Number(remaining).toFixed(2)}
      </p>
      <p style="font-size:15px;">Keep saving to reach your goal in time! 💰</p>
    `;
    const html = baseTemplate("⏰ Goal Deadline Approaching", content);
    await sendEmail(to, `⏰ Deadline approaching for your goal: ${goalName}`, html);
    console.log(`✅ Goal deadline reminder sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending goal deadline reminder:", err);
  }
}

/* =========================
   ✅  VERIFICATION EMAIL
========================= */

export const sendVerificationEmail = async (email, token) => {
  try {
    const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    const html = `
      <h2>Welcome to Expense Tracker!</h2>
      <p>Thanks for registering. To activate your account, please click the link below:</p>
      <a href="${url}" style="padding:10px 15px; background:#2ecc71; color:white; text-decoration:none; border-radius:5px;">
        Verify Email
      </a>
      <p>If you didn't register, you can ignore this email.</p>
    `;
    await sendEmail(email, "Verify your email", html);
    console.log(`✅ Verification email sent to ${email}`);
  } catch (err) {
    console.error("❌ Error sending verification email:", err);
  }
};

/* =========================
   📎  REPORT EMAIL
========================= */

export async function sendReportEmail(to, pdfBuffer, filename) {
  try {
    const html = baseTemplate("Your Expense Report", `
      <p style="font-size:15px;">Please find your expense report attached.</p>
      <p style="font-size:15px;">Generated by Expense Tracker 💰</p>
    `);
    await sendEmail(to, "📊 Your Expense Report", html, [
      {
        filename: filename || "expenses_report.pdf",
        content: pdfBuffer,
      }
    ]);
    console.log(`✅ Report email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending report email:", err);
    throw err;
  }
}