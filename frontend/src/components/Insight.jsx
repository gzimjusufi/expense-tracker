import React, { useMemo } from "react";

// -------------------------
// Helpers
// -------------------------
const currency = (n) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(n || 0));

const monthKey = (dateStr) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}`;
};

const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString("default", { month: "short", year: "numeric" });
};

// -------------------------
// Insight Component
// -------------------------
export default function Insight({ expenses, theme = "dark", monthlyBudget }) {
  // Compute monthly totals
  const monthlyTotals = useMemo(() => {
    const totals = {};
    expenses.forEach((e) => {
      const key = monthKey(e.date);
      if (!key) return;
      totals[key] = (totals[key] || 0) + Number(e.amount || 0);
    });
    return totals;
  }, [expenses]);

  // Predict next month expenses (simple linear regression)
  const nextMonthPrediction = useMemo(() => {
    const keys = Object.keys(monthlyTotals).sort();
    if (keys.length < 2) return null;

    const values = keys.map((k) => monthlyTotals[k]);
    const n = values.length;
    const xSum = Array.from({ length: n }, (_, i) => i).reduce((a, b) => a + b, 0);
    const ySum = values.reduce((a, b) => a + b, 0);
    const xySum = values.reduce((sum, y, i) => sum + i * y, 0);
    const x2Sum = Array.from({ length: n }, (_, i) => i * i).reduce((a, b) => a + b, 0);

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;

    return intercept + slope * n; // Predict next month
  }, [monthlyTotals]);

  // Budget check
  let budgetStatus = "";
  let progressColor = "#2ecc71";
  if (monthlyBudget && nextMonthPrediction) {
    if (nextMonthPrediction >= monthlyBudget) {
      budgetStatus = "⚠️ Predicted to exceed your budget next month!";
      progressColor = "#e74c3c";
    } else if (nextMonthPrediction >= monthlyBudget * 0.75) {
      budgetStatus = "⚠️ Predicted to be close to your budget next month!";
      progressColor = "#f39c12";
    } else {
      budgetStatus = "✅ Predicted to be within your budget next month.";
      progressColor = "#2ecc71";
    }
  }

  // Detect unusual spikes (20% more than previous month)
  const spikes = useMemo(() => {
    const keys = Object.keys(monthlyTotals).sort();
    const results = [];
    for (let i = 1; i < keys.length; i++) {
      const prev = monthlyTotals[keys[i - 1]];
      const curr = monthlyTotals[keys[i]];
      if (curr > prev * 1.4) {
        results.push({
          month: monthLabel(keys[i]),
          increase: curr - prev,
          percent: ((curr - prev) / prev) * 100,
        });
      }
    }
    return results;
  }, [monthlyTotals]);

  return (
  <div
    style={{
      backgroundColor: theme === "dark" ? "#121212" : "#f5f5f5",
      color: theme === "dark" ? "#fff" : "#000",
      padding: "10px 15px",
      minHeight: "auto", // <-- changed from 100vh
    }}
  >
    <h2 style={{ marginBottom: 10 }}>AI-Powered Expense Insights</h2>

    {nextMonthPrediction && (
      <div
        style={{
          backgroundColor: theme === "dark" ? "#1e1e1e" : "#fff",
          padding: "10px",
          borderRadius: "10px",
          marginBottom: "15px",
          borderLeft: `5px solid ${progressColor}`,
        }}
      >
        <h4>Next Month Prediction</h4>
        <p>Predicted Expenses: {currency(nextMonthPrediction)}</p>
        <p style={{ color: progressColor }}>{budgetStatus}</p>
      </div>
    )}

    {spikes.length > 0 ? (
      <div
        style={{
          backgroundColor: theme === "dark" ? "#1e1e1e" : "#fff",
          padding: "10px",
          borderRadius: "10px",
          marginBottom: "15px",
        }}
      >
        <h4>Unusual Spending Spikes</h4>
        <ul>
          {spikes.map((s, idx) => (
            <li key={idx}>
              {s.month}: Spent {currency(s.increase)} more than previous month (
              {s.percent.toFixed(0)}%)
            </li>
          ))}
        </ul>
      </div>
    ) : (
      <p style={{ opacity: 0.7 }}>No significant spending spikes detected.</p>
    )}
  </div>
);
}
