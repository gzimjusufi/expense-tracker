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

export default function Dashboard({ theme, user, currency }) {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [budget, setBudget] = useState(localStorage.getItem("monthlyBudget") || "");

  // Flag to check if user is ready
  const isUserReady = !!user;

  // Fetch expenses
  const fetchExpenses = async () => {
    if (!isUserReady) return; // wait for user
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://expense-tracker-production-854d.up.railway.app/api/expenses", {
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

  // Fetch budget
  const fetchBudget = async () => {
    if (!isUserReady) return; // wait for user
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://expense-tracker-production-854d.up.railway.app/api/budget", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBudget(res.data.monthlyBudget);
      localStorage.setItem("cachedBudget", res.data.monthlyBudget);
    } catch (err) {
      console.error("Error fetching budget:", err);
      const cached = localStorage.getItem("cachedBudget");
      if (cached) setBudget(Number(cached));
    }
  };

  // ✅ Single useEffect for fetching data when component mounts or user changes
  useEffect(() => {
    if (isUserReady) {
      fetchExpenses();
      fetchBudget();
    }
  }, [isUserReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save budget in localStorage whenever updated
  useEffect(() => {
    if (budget) localStorage.setItem("monthlyBudget", budget);
  }, [budget]);

  // Apply filters
  const applyFilters = () => {
    let temp = [...expenses];
    if (categoryFilter) temp = temp.filter((e) => e.category === categoryFilter);
    if (fromDate) temp = temp.filter((e) => new Date(e.date) >= new Date(fromDate));
    if (toDate) temp = temp.filter((e) => new Date(e.date) <= new Date(toDate));
    setFilteredExpenses(temp);
  };

  // Summary stats
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const monthlyExpenses = filteredExpenses
    .filter((e) => new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((acc, e) => acc + e.amount, 0);
  const highestExpense = filteredExpenses.reduce(
    (acc, e) => (e.amount > acc ? e.amount : acc),
    0
  );

// Add these calculations after highestExpense:

// Last month expenses
const lastMonth = new Date().getMonth() - 1;
const lastMonthExpenses = expenses
  .filter((e) => new Date(e.date).getMonth() === lastMonth)
  .reduce((acc, e) => acc + e.amount, 0);

// Month over month change
const monthChange = lastMonthExpenses > 0
  ? ((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
  : 0;

// Average daily spending this month
const daysInMonth = new Date().getDate();
const avgDailySpending = monthlyExpenses / daysInMonth;

// Top category this month
const currentMonth = new Date().getMonth();
const categoryTotals = {};
expenses
  .filter((e) => new Date(e.date).getMonth() === currentMonth)
  .forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  // Budget progress
  const budgetProgress = budget ? Math.min((monthlyExpenses / budget) * 100, 100) : 0;
  let budgetStatus = "";
  let progressColor = "#2ecc71"; // green
  if (budget) {
    if (monthlyExpenses >= budget) {
      budgetStatus = "⚠️ You have exceeded your budget!";
      progressColor = "#e74c3c"; // red
    } else if (monthlyExpenses >= budget * 0.75) {
      budgetStatus = "⚠️ You're close to exceeding your budget!";
      progressColor = "#f39c12"; // yellow
    } else {
      budgetStatus = "✅ You're within your budget.";
    }
  }

  // Chart data
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
      const oneTimeTotal = filteredExpenses
        .filter(
          (e) =>
            e.category === cat &&
            !e.recurring &&
            new Date(e.date).toLocaleString("default", { month: "short", year: "numeric" }) === month
        )
        .reduce((sum, e) => sum + e.amount, 0);

      const recurringTotal = filteredExpenses
        .filter(
          (e) =>
            e.category === cat &&
            e.recurring &&
            new Date(e.date).toLocaleString("default", { month: "short", year: "numeric" }) === month
        )
        .reduce((sum, e) => sum + e.amount, 0);

      monthData[`${cat}_oneTime`] = oneTimeTotal;
      monthData[`${cat}_recurring`] = recurringTotal;
    });
    chartData.push(monthData);
  });

  // Styles
  const pageStyle = {
    backgroundColor: theme === "dark" ? "#121212" : "#f5f5f5",
    color: theme === "dark" ? "#ffffff" : "#000000",
    minHeight: "100vh",
    padding: window.innerWidth < 600 ? "10px" : "20px",
    transition: "all 0.3s ease-in-out",
  };

  const cardStyle = {
    flex: 1,
    minWidth: "140px",
    padding: "15px",
    borderRadius: "8px",
    textAlign: "center",
    backgroundColor: theme === "dark" ? "#1e1e1e" : "#ffffff",
    boxShadow: theme === "dark" ? "0 2px 8px rgba(0,0,0,0.6)" : "0 2px 8px rgba(0,0,0,0.1)",
  };

  return (
    <div style={pageStyle}>
      <Header theme={theme} />
      <Insights expenses={filteredExpenses} budget={budget} theme={theme} currency={currency} />

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap", flexDirection: "row" }}>
        <div style={cardStyle}>
          <h4>Total Expenses</h4>
          <p>{formatCurrency(totalExpenses, currency)}</p>
        </div>
        <div style={cardStyle}>
          <h4>Monthly Expenses</h4>
          <p>{formatCurrency(monthlyExpenses, currency)}</p>
        </div>
        <div style={cardStyle}>
          <h4>Highest Expense</h4>
          <p>{formatCurrency(highestExpense, currency)}</p>
        </div>
      </div>

      {/* Stats Cards */}
<div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
  <div style={{ ...cardStyle, borderLeft: `4px solid ${monthChange >= 0 ? "#e74c3c" : "#2ecc71"}` }}>
    <h4>vs Last Month</h4>
    <p style={{ color: monthChange >= 0 ? "#e74c3c" : "#2ecc71", fontWeight: "bold", fontSize: "20px" }}>
      {monthChange >= 0 ? "📈" : "📉"} {Math.abs(monthChange).toFixed(1)}%
    </p>
    <small style={{ opacity: 0.7 }}>
      Last month: {formatCurrency(lastMonthExpenses, currency)}
    </small>
  </div>

  <div style={{ ...cardStyle, borderLeft: "4px solid #3498db" }}>
    <h4>Daily Average</h4>
    <p style={{ fontWeight: "bold", fontSize: "20px" }}>
      {formatCurrency(avgDailySpending, currency)}
    </p>
    <small style={{ opacity: 0.7 }}>per day this month</small>
  </div>

  <div style={{ ...cardStyle, borderLeft: `4px solid ${categoryColors[topCategory?.[0]] || "#95a5a6"}` }}>
    <h4>Top Category</h4>
    <p style={{ fontWeight: "bold", fontSize: "20px" }}>
      {topCategory ? topCategory[0] : "—"}
    </p>
    <small style={{ opacity: 0.7 }}>
      {topCategory ? formatCurrency(topCategory[1], currency) : "No data"}
    </small>
  </div>
</div>

      {/* Budget Section */}
      <div style={{ ...cardStyle, marginBottom: "20px", textAlign: "left" }}>
        <h4>Monthly Budget</h4>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <input
            type="number"
            value={budget || ""}
            readOnly
            style={{
              padding: "8px",
              borderRadius: "6px",
              border: theme === "dark" ? "1px solid #555" : "1px solid #ccc",
              backgroundColor: theme === "dark" ? "#333" : "#fff",
              color: theme === "dark" ? "#fff" : "#000",
              flex: 1,
              width: "100%",
            }}
          />
        </div>
        {budget && (
          <>
            <div
              style={{
                backgroundColor: "#e0e0e0",
                borderRadius: "8px",
                height: "18px",
                width: "100%",
                marginBottom: "6px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${budgetProgress}%`,
                  backgroundColor: progressColor,
                  borderRadius: "8px",
                  transition: "width 0.3s ease-in-out",
                }}
              ></div>
            </div>
            <p style={{ margin: "0", color: progressColor }}>{budgetStatus}</p>
          </>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            flex: "1 1 150px",
            padding: "5px",
            borderRadius: "6px",
            border: theme === "dark" ? "1px solid #555" : "1px solid #ccc",
            backgroundColor: theme === "dark" ? "#333" : "#fff",
            color: theme === "dark" ? "#fff" : "#000",
          }}
        >
          <option value="">All Categories</option>
          {Object.keys(categoryColors).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={{
            flex: "1 1 130px",
            padding: "5px",
            borderRadius: "6px",
            border: theme === "dark" ? "1px solid #555" : "1px solid #ccc",
            backgroundColor: theme === "dark" ? "#333" : "#fff",
            color: theme === "dark" ? "#fff" : "#000",
          }}
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          style={{
            flex: "1 1 130px",
            padding: "5px",
            borderRadius: "6px",
            border: theme === "dark" ? "1px solid #555" : "1px solid #ccc",
            backgroundColor: theme === "dark" ? "#333" : "#fff",
            color: theme === "dark" ? "#fff" : "#000",
          }}
        />
        <button
          onClick={applyFilters}
          style={{
            flex: "1 1 80px",
            padding: "6px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            backgroundColor: "#3498db",
            color: "#fff",
            border: "none",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#2980b9")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3498db")}
        >
          Apply
        </button>
      </div>

      {/* Expense List */}
      <ExpenseList expenses={filteredExpenses} theme={theme} readOnly={true} currency={currency} />

      {/* Chart */}
      {chartData.length > 0 ? (
        <div
          style={{
            backgroundColor: theme === "dark" ? "#1e1e1e" : "#fff",
            padding: "10px",
            borderRadius: "10px",
            marginTop: "20px",
          }}
        >
          <ResponsiveContainer width="100%" height={window.innerWidth < 600 ? 250 : 400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#333" : "#ccc"} />
              <XAxis dataKey="month" stroke={theme === "dark" ? "#fff" : "#000"} />
              <YAxis stroke={theme === "dark" ? "#fff" : "#000"} />
              <Tooltip />
              {Object.keys(categoryColors).map((cat) => {
                const oneTimeKey = `${cat}_oneTime`;
                const recurringKey = `${cat}_recurring`;

                return (
                  <React.Fragment key={cat}>
                    {chartData.some((data) => data[oneTimeKey] > 0) && (
                      <Bar
                        dataKey={oneTimeKey}
                        stackId={cat}
                        fill={categoryColors[cat]}
                        name={`${cat} (One-time)`}
                      />
                    )}
                    {chartData.some((data) => data[recurringKey] > 0) && (
                      <Bar
                        dataKey={recurringKey}
                        stackId={cat}
                        fill={`${categoryColors[cat]}80`}
                        name={`${cat} (Recurring)`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p>No expenses to display.</p>
      )}
    </div>
  );
}
