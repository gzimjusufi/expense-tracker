import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ExpenseChart({ expenses, theme }) {
  const dark = theme === "dark";

  const data = expenses.reduce((acc, exp) => {
    const found = acc.find(item => item.category === exp.category);
    if (found) found.amount += exp.amount;
    else acc.push({ category: exp.category, amount: exp.amount });
    return acc;
  }, []);

  if (data.length === 0) return null;

  return (
    <div style={{
      background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRadius: "16px",
      border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
      boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.08)",
      padding: "20px",
      marginTop: "20px",
    }}>
      <div style={{
        fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em",
        textTransform: "uppercase", opacity: 0.5, marginBottom: "16px",
      }}>
        Spending by Category
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
          <XAxis dataKey="category" stroke={dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} tick={{ fontSize: 12 }} />
          <YAxis stroke={dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{
            backgroundColor: dark ? "rgba(20,20,40,0.95)" : "rgba(255,255,255,0.95)",
            border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
            borderRadius: "12px",
            color: dark ? "#fff" : "#000",
            backdropFilter: "blur(20px)",
          }} />
          <Bar dataKey="amount" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}