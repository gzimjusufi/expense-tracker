import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function ExpenseChart({ expenses }) {
  const data = expenses.reduce((acc, exp) => {
    const found = acc.find(item => item.category === exp.category);
    if (found) found.amount += exp.amount;
    else acc.push({ category: exp.category, amount: exp.amount });
    return acc;
  }, []);

  return (
    <div style={{ width:'80%', height:300, margin:'auto', marginTop:'2rem' }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="amount" fill="#4f46e5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
