import React, { useMemo } from "react";
import { formatCurrency } from "../services/currency";

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

export default function Insight({ expenses, theme = "dark", monthlyBudget, currency = "USD" }) {
  const dark = theme === "dark";

  const card = {
    background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: "16px",
    border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
    boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.08)",
    padding: "20px",
    marginBottom: "16px",
  };

  const labelStyle = {
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    opacity: 0.5,
    marginBottom: "8px",
    display: "block",
  };

  const monthlyTotals = useMemo(() => {
    const totals = {};
    expenses.forEach((e) => {
      const key = monthKey(e.date);
      if (!key) return;
      totals[key] = (totals[key] || 0) + Number(e.amount || 0);
    });
    return totals;
  }, [expenses]);

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
    return intercept + slope * n;
  }, [monthlyTotals]);

  let budgetStatus = "";
  let progressColor = "#10b981";
  if (monthlyBudget && nextMonthPrediction) {
    if (nextMonthPrediction >= monthlyBudget) {
      budgetStatus = "⚠️ Predicted to exceed your budget next month!";
      progressColor = "#e74c3c";
    } else if (nextMonthPrediction >= monthlyBudget * 0.75) {
      budgetStatus = "⚠️ Predicted to be close to your budget next month!";
      progressColor = "#f59e0b";
    } else {
      budgetStatus = "✅ Predicted to be within your budget next month.";
      progressColor = "#10b981";
    }
  }

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
    <div style={{ marginBottom: "8px" }}>
      <div style={{ ...labelStyle, marginBottom: "12px" }}>🤖 AI-Powered Expense Insights</div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {/* Next Month Prediction */}
        {nextMonthPrediction && (
          <div style={{
            ...card,
            flex: "1 1 220px",
            borderLeft: `3px solid ${progressColor}`,
            marginBottom: 0,
          }}>
            <div style={labelStyle}>Next Month Prediction</div>
            <div style={{
              fontSize: "22px", fontWeight: "700",
              letterSpacing: "-0.02em", color: progressColor, marginBottom: "6px",
            }}>
              {formatCurrency(nextMonthPrediction, currency)}
            </div>
            <div style={{ fontSize: "13px", color: progressColor, fontWeight: "500" }}>
              {budgetStatus}
            </div>
          </div>
        )}

        {/* Spending Spikes */}
        <div style={{
          ...card,
          flex: "1 1 220px",
          borderLeft: spikes.length > 0 ? "3px solid #f59e0b" : "3px solid #10b981",
          marginBottom: 0,
        }}>
          <div style={labelStyle}>Spending Spikes</div>
          {spikes.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {spikes.map((s, idx) => (
                <div key={idx} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 12px",
                  background: dark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.08)",
                  borderRadius: "8px",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "13px" }}>{s.month}</div>
                    <div style={{ fontSize: "11px", opacity: 0.6 }}>
                      +{formatCurrency(s.increase, currency)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: "13px", fontWeight: "700", color: "#f59e0b",
                    background: "rgba(245,158,11,0.15)", padding: "4px 8px",
                    borderRadius: "6px",
                  }}>
                    +{s.percent.toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: "#10b981", fontWeight: "500" }}>
              ✅ No significant spending spikes detected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}