import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import Header from "../components/Header";
import ExpenseList from "../components/ExpenseList";
import Insights from "../components/Insight";
import { formatCurrency } from "../services/currency";

const categoryColors = {
  Food: "#2ecc71",
  Groceries: "#3498db",
  Transport: "#9b59b6",
  Entertainment: "#f39c12",
  Bills: "#e67e22",
  Shopping: "#9b59a6",
  Other: "#95a5a6",
};

const glassCard = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  padding: "20px",
};

const lightCard = {
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: "16px",
  border: "1px solid rgba(0,0,0,0.07)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
  padding: "20px",
};

const inputBase = (dark) => ({
  padding: "10px 14px",
  borderRadius: "10px",
  border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
  backgroundColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
  color: dark ? "#fff" : "#000",
  outline: "none",
  fontSize: "14px",
});

export default function Dashboard({ theme, user, currency }) {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [budget, setBudget] = useState(localStorage.getItem("monthlyBudget") || "");

  const dark = theme === "dark";
  const isUserReady = !!user;
  const card = dark ? glassCard : lightCard;

  const fetchExpenses = async () => {
    if (!isUserReady) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://expense-tracker-3dmz.onrender.com/api/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(res.data);
      setFilteredExpenses(res.data);
      localStorage.setItem("cachedExpenses", JSON.stringify(res.data));
    } catch (err) {
      console.error("Error fetching expenses:", err);
      const cached = localStorage.getItem("cachedExpenses");
      if (cached) {
        const parsed = JSON.parse(cached);
        setExpenses(parsed);
        setFilteredExpenses(parsed);
      }
    }
  };

  const fetchBudget = async () => {
    if (!isUserReady) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://expense-tracker-3dmz.onrender.com/api/budget", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBudget(res.data.monthlyBudget);
      localStorage.setItem("cachedBudget", res.data.monthlyBudget);
    } catch (err) {
      const cached = localStorage.getItem("cachedBudget");
      if (cached) setBudget(Number(cached));
    }
  };

  useEffect(() => {
    if (isUserReady) {
      fetchExpenses();
      fetchBudget();
    }
  }, [isUserReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (budget) localStorage.setItem("monthlyBudget", budget);
  }, [budget]);

  const applyFilters = () => {
    let temp = [...expenses];
    if (categoryFilter) temp = temp.filter((e) => e.category === categoryFilter);
    if (fromDate) temp = temp.filter((e) => new Date(e.date) >= new Date(fromDate));
    if (toDate) temp = temp.filter((e) => new Date(e.date) <= new Date(toDate));
    setFilteredExpenses(temp);
  };

  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const monthlyExpenses = filteredExpenses
    .filter((e) => new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((acc, e) => acc + e.amount, 0);
  const highestExpense = filteredExpenses.reduce(
    (acc, e) => (e.amount > acc ? e.amount : acc), 0
  );

  const lastMonth = new Date().getMonth() - 1;
  const lastMonthExpenses = expenses
    .filter((e) => new Date(e.date).getMonth() === lastMonth)
    .reduce((acc, e) => acc + e.amount, 0);
  const monthChange = lastMonthExpenses > 0
    ? ((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
    : 0;
  const daysInMonth = new Date().getDate();
  const avgDailySpending = monthlyExpenses / daysInMonth;
  const currentMonth = new Date().getMonth();
  const categoryTotals = {};
  expenses
    .filter((e) => new Date(e.date).getMonth() === currentMonth)
    .forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const budgetProgress = budget ? Math.min((monthlyExpenses / budget) * 100, 100) : 0;
  let budgetStatus = "";
  let progressColor = "#2ecc71";
  if (budget) {
    if (monthlyExpenses >= budget) {
      budgetStatus = "⚠️ You have exceeded your budget!";
      progressColor = "#e74c3c";
    } else if (monthlyExpenses >= budget * 0.75) {
      budgetStatus = "⚠️ You're close to exceeding your budget!";
      progressColor = "#f39c12";
    } else {
      budgetStatus = "✅ You're within your budget.";
    }
  }

  const chartData = [];
  const months = [
    ...new Set(
      filteredExpenses.map((e) =>
        new Date(e.date).toLocaleString("default", { month: "short", year: "numeric" })
      )
    ),
  ];
  months.forEach((month) => {
    const monthData = { month };
    Object.keys(categoryColors).forEach((cat) => {
      monthData[`${cat}_oneTime`] = filteredExpenses
        .filter((e) => e.category === cat && !e.recurring &&
          new Date(e.date).toLocaleString("default", { month: "short", year: "numeric" }) === month)
        .reduce((sum, e) => sum + e.amount, 0);
      monthData[`${cat}_recurring`] = filteredExpenses
        .filter((e) => e.category === cat && e.recurring &&
          new Date(e.date).toLocaleString("default", { month: "short", year: "numeric" }) === month)
        .reduce((sum, e) => sum + e.amount, 0);
    });
    chartData.push(monthData);
  });

  const pageStyle = {
    background: dark
      ? "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)"
      : "linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f0f4ff 100%)",
    color: dark ? "#ffffff" : "#111111",
    minHeight: "100vh",
    padding: window.innerWidth < 600 ? "10px" : "24px",
  };

  const labelStyle = {
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    opacity: 0.5,
    marginBottom: "6px",
  };

  const valueStyle = {
    fontSize: "24px",
    fontWeight: "700",
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
  };

  const accentDot = (color) => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: color,
    display: "inline-block",
    marginRight: "6px",
    boxShadow: `0 0 8px ${color}`,
  });

  return (
    <div style={pageStyle}>
      {/* Ambient background blobs */}
      {dark && (
        <>
          <div style={{
            position: "fixed", top: "-100px", left: "-100px", width: "400px", height: "400px",
            borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            pointerEvents: "none", zIndex: 0,
          }} />
          <div style={{
            position: "fixed", bottom: "-100px", right: "-100px", width: "500px", height: "500px",
            borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
            pointerEvents: "none", zIndex: 0,
          }} />
        </>
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        <Header theme={theme} />
        <Insights expenses={filteredExpenses} budget={budget} theme={theme} currency={currency} />

        {/* Summary Cards */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
          {[
            { label: "Total Expenses", value: formatCurrency(totalExpenses, currency), color: "#6366f1", icon: "💸" },
            { label: "This Month", value: formatCurrency(monthlyExpenses, currency), color: "#10b981", icon: "📅" },
            { label: "Highest Expense", value: formatCurrency(highestExpense, currency), color: "#f59e0b", icon: "🔝" },
          ].map((item, i) => (
            <div key={i} style={{
              ...card,
              flex: "1 1 140px",
              borderTop: `2px solid ${item.color}`,
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: "-20px", right: "-20px",
                fontSize: "60px", opacity: 0.07, pointerEvents: "none",
              }}>{item.icon}</div>
              <div style={labelStyle}>{item.label}</div>
              <div style={{ ...valueStyle, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Stats Cards */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{ ...card, flex: "1 1 140px", borderLeft: `3px solid ${monthChange >= 0 ? "#e74c3c" : "#2ecc71"}` }}>
            <div style={labelStyle}>vs Last Month</div>
            <div style={{ ...valueStyle, color: monthChange >= 0 ? "#e74c3c" : "#2ecc71" }}>
              {monthChange >= 0 ? "📈" : "📉"} {Math.abs(monthChange).toFixed(1)}%
            </div>
            <div style={{ fontSize: "12px", opacity: 0.5, marginTop: "6px" }}>
              Last: {formatCurrency(lastMonthExpenses, currency)}
            </div>
          </div>

          <div style={{ ...card, flex: "1 1 140px", borderLeft: "3px solid #3b82f6" }}>
            <div style={labelStyle}>Daily Average</div>
            <div style={{ ...valueStyle, color: "#3b82f6" }}>{formatCurrency(avgDailySpending, currency)}</div>
            <div style={{ fontSize: "12px", opacity: 0.5, marginTop: "6px" }}>per day this month</div>
          </div>

          <div style={{ ...card, flex: "1 1 140px", borderLeft: `3px solid ${categoryColors[topCategory?.[0]] || "#95a5a6"}` }}>
            <div style={labelStyle}>Top Category</div>
            <div style={{ ...valueStyle, color: categoryColors[topCategory?.[0]] || "#95a5a6" }}>
            <span style={accentDot(categoryColors[topCategory?.[0]] || "#95a5a6")} />
            {topCategory ? topCategory[0] : "—"}
            </div>
            <div style={{ fontSize: "12px", opacity: 0.5, marginTop: "6px" }}>
              {topCategory ? formatCurrency(topCategory[1], currency) : "No data"}
            </div>
          </div>
        </div>

        {/* Budget Section */}
        <div style={{ ...card, marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ ...labelStyle, marginBottom: 0 }}>Monthly Budget</div>
            {budget && <div style={{ fontSize: "13px", fontWeight: "600", opacity: 0.7 }}>
              {formatCurrency(monthlyExpenses, currency)} / {formatCurrency(budget, currency)}
            </div>}
          </div>
          <input
            type="number"
            value={budget || ""}
            readOnly
            style={{
              ...inputBase(dark),
              width: "100%",
              marginBottom: "12px",
              boxSizing: "border-box",
            }}
          />
          {budget && (
            <>
              <div style={{
                backgroundColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                borderRadius: "100px",
                height: "8px",
                width: "100%",
                marginBottom: "8px",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${budgetProgress}%`,
                  background: `linear-gradient(90deg, ${progressColor}99, ${progressColor})`,
                  borderRadius: "100px",
                  transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: `0 0 10px ${progressColor}66`,
                }} />
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: progressColor, fontWeight: "500" }}>{budgetStatus}</p>
            </>
          )}
        </div>

        {/* Filters */}
        <div style={{ ...card, marginBottom: "20px" }}>
          <div style={{ ...labelStyle, marginBottom: "12px" }}>Filter Expenses</div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ ...inputBase(dark), flex: "1 1 150px" }}
            >
              <option value="">All Categories</option>
              {Object.keys(categoryColors).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ ...inputBase(dark), flex: "1 1 130px" }}
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ ...inputBase(dark), flex: "1 1 130px" }}
            />
            <button
              onClick={applyFilters}
              style={{
                flex: "1 1 80px",
                padding: "10px 20px",
                borderRadius: "10px",
                cursor: "pointer",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
                border: "none",
                fontWeight: "600",
                fontSize: "14px",
                boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
                transition: "opacity 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Apply
            </button>
          </div>
        </div>

        {/* Expense List */}
        <ExpenseList expenses={filteredExpenses} theme={theme} readOnly={true} currency={currency} />

        {/* Chart */}
        {chartData.length > 0 ? (
          <div style={{ ...card, marginTop: "20px" }}>
            <div style={{ ...labelStyle, marginBottom: "16px" }}>Spending by Category</div>
            <ResponsiveContainer width="100%" height={window.innerWidth < 600 ? 250 : 400}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
                <XAxis dataKey="month" stroke={dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} tick={{ fontSize: 12 }} />
                <YAxis stroke={dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: dark ? "rgba(20,20,40,0.95)" : "rgba(255,255,255,0.95)",
                    border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "12px",
                    color: dark ? "#fff" : "#000",
                    backdropFilter: "blur(20px)",
                  }}
                />
                {Object.keys(categoryColors).map((cat) => (
                  <React.Fragment key={cat}>
                    {chartData.some((d) => d[`${cat}_oneTime`] > 0) && (
                      <Bar dataKey={`${cat}_oneTime`} stackId={cat} fill={categoryColors[cat]} name={`${cat} (One-time)`} radius={[4, 4, 0, 0]} />
                    )}
                    {chartData.some((d) => d[`${cat}_recurring`] > 0) && (
                      <Bar dataKey={`${cat}_recurring`} stackId={cat} fill={`${categoryColors[cat]}80`} name={`${cat} (Recurring)`} />
                    )}
                  </React.Fragment>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ ...card, marginTop: "20px", textAlign: "center", opacity: 0.5, padding: "40px" }}>
            No expenses to display.
          </div>
        )}
      </div>
    </div>
  );
}