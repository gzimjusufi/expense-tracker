import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// Attach token to requests
const authHeader = () => {
  const token = localStorage.getItem("token"); // or sessionStorage if you stored it there
  return { headers: { Authorization: `Bearer ${token}` } };
};
// -------------------------
// Utility helpers
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
  // Use YYYY-MM for stable sorting
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}`;
};

const monthLabel = (key) => {
  // key: YYYY-MM -> "Mon YYYY"
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString("default", { month: "short", year: "numeric" });
};

const withinRange = (dateStr, start, end) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d)) return false;
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  return (!s || d >= s) && (!e || d <= e);
};

// -------------------------
// Filter Drawer Component
// -------------------------
function FilterDrawer({
  theme,
  isOpen,
  onClose,
  categories,
  selectedCategories,
  setSelectedCategories,
  dateRange,
  setDateRange,
  compareMode,
  setCompareMode,
  compareRange,
  setCompareRange,
  onReset,
  onApply,
  savedFilters,
  onSaveFilter,
  onLoadFilter,
  onDeleteSaved,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[1090]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 250, damping: 30 }}
            className={`fixed top-0 left-0 h-full w-80 z-[1100] shadow-2xl p-5 overflow-y-auto ${
              theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Filters</h3>
              <button
                onClick={onClose}
                className="px-3 py-1 rounded-xl bg-gray-700 text-white hover:bg-gray-600"
              >
                Close
              </button>
            </div>

            {/* Categories */}
            <div className="mb-5">
              <label className="font-medium">Categories</label>
              <select
                multiple
                className={`w-full mt-2 border rounded-lg px-3 py-2 min-h-[140px] cursor-pointer ${
                  theme === "dark" ? "bg-gray-800 text-white" : "bg-white"
                }`}
                value={selectedCategories}
                onChange={(e) =>
                  setSelectedCategories(
                    Array.from(e.target.selectedOptions, (opt) => opt.value)
                  )
                }
              >
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="mb-5">
              <label className="font-medium">Date Range</label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className={`rounded-lg px-3 py-2 border ${
                    theme === "dark" ? "bg-gray-800 text-white" : "bg-white"
                  }`}
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className={`rounded-lg px-3 py-2 border ${
                    theme === "dark" ? "bg-gray-800 text-white" : "bg-white"
                  }`}
                />
              </div>
            </div>

            {/* Compare Toggle */}
            <div className="mb-5">
              <label className="font-medium">Compare Periods</label>
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`w-full mt-2 px-3 py-2 rounded-lg font-semibold ${
                  compareMode ? "bg-purple-600 text-white" : "bg-gray-600 text-white"
                }`}
              >
                {compareMode ? "Disable Compare" : "Enable Compare"}
              </button>
              {compareMode && (
                <div className="grid grid-cols-1 gap-2 mt-3">
                  <input
                    type="date"
                    value={compareRange.start}
                    onChange={(e) =>
                      setCompareRange({ ...compareRange, start: e.target.value })
                    }
                    className={`rounded-lg px-3 py-2 border ${
                      theme === "dark" ? "bg-gray-800 text-white" : "bg-white"
                    }`}
                  />
                  <input
                    type="date"
                    value={compareRange.end}
                    onChange={(e) =>
                      setCompareRange({ ...compareRange, end: e.target.value })
                    }
                    className={`rounded-lg px-3 py-2 border ${
                      theme === "dark" ? "bg-gray-800 text-white" : "bg-white"
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Saved Filters */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium">Saved Filters</label>
                <button
                  onClick={onSaveFilter}
                  className="px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700"
                >
                  Save Current
                </button>
              </div>
              {savedFilters.length === 0 ? (
                <p className="text-sm opacity-70">No saved filters yet.</p>
              ) : (
                <div className="space-y-2">
                  {savedFilters.map((f, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-2 rounded-lg border ${
                        theme === "dark" ? "bg-gray-800" : "bg-gray-50"
                      }`}
                    >
                      <button
                        className="text-left truncate pr-2 hover:underline"
                        title="Apply saved filter"
                        onClick={() => onLoadFilter(f.name)}
                      >
                        {f.name}
                      </button>
                      <button
                        onClick={() => onDeleteSaved(f.name)}
                        className="px-2 py-1 rounded bg-red-600 text-white text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onApply}
                className="rounded-lg px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Apply
              </button>
              <button
                onClick={onReset}
                className="rounded-lg px-4 py-2 bg-gray-600 text-white hover:bg-gray-700"
              >
                Reset
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// -------------------------
// Main Reports Component
// -------------------------
export default function Reports({ theme = "dark" }) {
  // Data
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filters
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [compareMode, setCompareMode] = useState(false);
  const [compareRange, setCompareRange] = useState({ start: "", end: "" });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Saved Filters (persist to localStorage)
  const [savedFilters, setSavedFilters] = useState(() => {
    try {
      const raw = localStorage.getItem("savedFilters");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Tabs
  const [activeTab, setActiveTab] = useState("summary"); // summary | trends | comparison

  // Chart data
  const [monthlyTotals, setMonthlyTotals] = useState([]);
  const [compareData, setCompareData] = useState([]);

  // Import
  const [file, setFile] = useState(null);

  // -------------------------
  // Fetch / Prepare
  // -------------------------
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/expenses", authHeader());
      const data = Array.isArray(res.data) ? res.data : [];
      setExpenses(data);
      const uniqueCategories = [...new Set(data.map((e) => e.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
  };

  // -------------------------
  // Derived metrics
  // -------------------------
  const { filtered, totalsByMonth } = useMemo(() => {
    const filteredList = expenses.filter((e) => {
      const inCats =
        selectedCategories.length === 0 || selectedCategories.includes(e.category);
      const inDate = withinRange(e.date, dateRange.start, dateRange.end);
      return inCats && (dateRange.start || dateRange.end ? inDate : true);
    });

    const totals = {};
    filteredList.forEach((e) => {
      const key = monthKey(e.date);
      if (!key) return;
      const amt = Number(e.amount) || 0;
      totals[key] = (totals[key] || 0) + amt;
    });

    return { filtered: filteredList, totalsByMonth: totals };
  }, [expenses, selectedCategories, dateRange]);

  const compareTotalsByMonth = useMemo(() => {
    if (!compareMode || !compareRange.start || !compareRange.end) return {};
    const list = expenses.filter((e) => {
      const inCats =
        selectedCategories.length === 0 || selectedCategories.includes(e.category);
      const inDate = withinRange(e.date, compareRange.start, compareRange.end);
      return inCats && inDate;
    });
    const totals = {};
    list.forEach((e) => {
      const key = monthKey(e.date);
      if (!key) return;
      const amt = Number(e.amount) || 0;
      totals[key] = (totals[key] || 0) + amt;
    });
    return totals;
  }, [expenses, selectedCategories, compareMode, compareRange]);

  // Build chart arrays whenever derived totals change
  useEffect(() => {
    const mainKeys = Object.keys(totalsByMonth).sort();
    const mainData = mainKeys.map((k) => ({ month: monthLabel(k), total: totalsByMonth[k] }));

    setMonthlyTotals(mainData);

    if (compareMode) {
      const cmpKeys = Object.keys(compareTotalsByMonth);
      const all = Array.from(new Set([...mainKeys, ...cmpKeys])).sort();
      const merged = all.map((k) => ({
        month: monthLabel(k),
        current: totalsByMonth[k] || 0,
        compare: compareTotalsByMonth[k] || 0,
      }));
      setCompareData(merged);
    } else {
      setCompareData([]);
    }
  }, [totalsByMonth, compareTotalsByMonth, compareMode]);

  // Summary KPIs
  const { totalSpent, avgPerMonth, topCat } = useMemo(() => {
    const spent = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const monthSet = new Set(Object.keys(totalsByMonth));
    const months = Math.max(monthSet.size, 1);
    const avg = spent / months;

    const byCat = {};
    filtered.forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + (Number(e.amount) || 0);
    });
    const top = Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1)[0];

    return {
      totalSpent: spent,
      avgPerMonth: avg,
      topCat: top ? { name: top[0], amount: top[1] } : null,
    };
  }, [filtered, totalsByMonth]);

  // -------------------------
  // Actions: export/import
  // -------------------------
  const handleExport = async () => {
    try {
      const response = await axios.get(
  "http://localhost:5000/api/expenses/export/csv",
  { responseType: "blob", ...authHeader() }
);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "expenses.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("CSV export failed", err);
      alert("Failed to export CSV");
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Expenses Report", 14, 15);

      const tableColumn = ["Date", "Category", "Description", "Amount"]; 
      const tableRows = [];

      filtered.forEach((exp) => {
        tableRows.push([
          exp.date ? new Date(exp.date).toLocaleDateString() : "N/A",
          exp.category || "N/A",
          exp.description || "-",
          currency(exp.amount),
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 25,
        styles: { fontSize: 11, cellPadding: 4 },
        headStyles: { fillColor: [52, 152, 219], textColor: 255, halign: "center" },
        bodyStyles: { valign: "middle" },
      });

      doc.save("expenses_report.pdf");
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF");
    }
  };

  const handleImport = async () => {
  if (!file) return alert("Please select a CSV file first!");
  const formData = new FormData();
  formData.append("file", file);
  try {
    await axios.post("http://localhost:5000/api/expenses/import/csv", formData, {
      ...authHeader(),
      headers: { 
        ...authHeader().headers,
        "Content-Type": "multipart/form-data" 
      },
    });
    alert("Expenses imported successfully!");
    fetchExpenses();
  } catch (err) {
    console.error(err);
    alert("Failed to import CSV");
  }
};


  // -------------------------
  // Actions: filters
  // -------------------------
  const applyFilters = () => {
    // No-op on purpose since we compute derived automatically,
    // but keeping for UX parity with drawer button.
    setIsDrawerOpen(false);
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setDateRange({ start: "", end: "" });
    setCompareMode(false);
    setCompareRange({ start: "", end: "" });
  };

  const saveCurrentFilter = () => {
    if (
      selectedCategories.length === 0 &&
      !dateRange.start &&
      !dateRange.end
    ) {
      alert("Please select filters before saving.");
      return;
    }
    const name = prompt("Enter a name for this filter:");
    if (!name) return;
    const next = [
      ...savedFilters.filter((f) => f.name !== name),
      {
        name,
        categories: [...selectedCategories],
        start: dateRange.start,
        end: dateRange.end,
      },
    ];
    setSavedFilters(next);
    localStorage.setItem("savedFilters", JSON.stringify(next));
  };

  const loadFilterByName = (name) => {
    const f = savedFilters.find((x) => x.name === name);
    if (!f) return;
    setSelectedCategories(f.categories || []);
    setDateRange({ start: f.start || "", end: f.end || "" });
  };

  const deleteSavedFilter = (name) => {
    const next = savedFilters.filter((f) => f.name !== name);
    setSavedFilters(next);
    localStorage.setItem("savedFilters", JSON.stringify(next));
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <div
      className={`min-h-screen p-6 transition-all duration-300 ${
        theme === "dark" ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <motion.h2 className="text-3xl font-bold mb-1">Reports Dashboard</motion.h2>
<p className="mb-2 text-gray-400">
  Track spending, explore trends, and compare periods.
</p>
<p className="mb-5 text-gray-400">
  Detailed analysis of expenses with filters, comparisons, and export options.
</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl shadow"
          >
            Open Filters
          </button>
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl shadow"
          >
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl shadow"
          >
            Export PDF
          </button>
          <label className="cursor-pointer">
            <span className="sr-only">Import CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <span
              onClick={() => document.querySelector('input[type="file"]').click()}
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-xl shadow"
            >
              Import CSV
            </span>
          </label>
          <button
            onClick={handleImport}
            className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-xl shadow"
          >
            Upload
          </button>
          <button
            onClick={resetFilters}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-xl shadow"
          >
            Reset
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          layout
          className={`rounded-2xl p-4 shadow ${
            theme === "dark" ? "bg-gray-900" : "bg-white"
          }`}
        >
          <div className="text-sm opacity-70">Total Spent (current filters)</div>
          <div className="text-2xl font-bold">{currency(totalSpent)}</div>
        </motion.div>

        <motion.div
          layout
          className={`rounded-2xl p-4 shadow ${
            theme === "dark" ? "bg-gray-900" : "bg-white"
          }`}
        >
          <div className="text-sm opacity-70">Average per Month</div>
          <div className="text-2xl font-bold">{currency(avgPerMonth)}</div>
        </motion.div>

        <motion.div
          layout
          className={`rounded-2xl p-4 shadow ${
            theme === "dark" ? "bg-gray-900" : "bg-white"
          }`}
        >
          <div className="text-sm opacity-70">Top Category</div>
          <div className="text-lg font-semibold">
            {topCat ? (
              <>
                {topCat.name} <span className="opacity-70">({currency(topCat.amount)})</span>
              </>
            ) : (
              <span className="opacity-60">—</span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {[
          { key: "summary", label: "Summary" },
          { key: "trends", label: "Trends" },
          { key: "comparison", label: "Comparison" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-xl font-semibold shadow ${
              activeTab === t.key
                ? "bg-indigo-600 text-white"
                : theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className={`rounded-2xl p-6 shadow ${theme === "dark" ? "bg-gray-900" : "bg-white"}`}>
        {activeTab === "summary" && (
          monthlyTotals.length > 0 ? (
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={monthlyTotals} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#333" : "#ddd"} />
                <XAxis dataKey="month" stroke={theme === "dark" ? "#fff" : "#111"} />
                <YAxis stroke={theme === "dark" ? "#fff" : "#111"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "dark" ? "#111827" : "#ffffff",
                    color: theme === "dark" ? "#fff" : "#111",
                    borderRadius: 8,
                    border: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
                  }}
                />
                <Legend />
                <Bar dataKey="total" name="Expenses" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="opacity-70 text-center">No expense data to display.</p>
          )
        )}

        {activeTab === "trends" && (
          monthlyTotals.length > 0 ? (
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={monthlyTotals} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#333" : "#ddd"} />
                <XAxis dataKey="month" stroke={theme === "dark" ? "#fff" : "#111"} />
                <YAxis stroke={theme === "dark" ? "#fff" : "#111"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "dark" ? "#111827" : "#ffffff",
                    color: theme === "dark" ? "#fff" : "#111",
                    borderRadius: 8,
                    border: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="total" name="Expenses" stroke="#60a5fa" strokeWidth={3} dot />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="opacity-70 text-center">No expense data to display.</p>
          )
        )}

        {activeTab === "comparison" && (
          compareMode ? (
            compareData.length > 0 ? (
              <ResponsiveContainer width="100%" height={420}>
                <BarChart data={compareData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#333" : "#ddd"} />
                  <XAxis dataKey="month" stroke={theme === "dark" ? "#fff" : "#111"} />
                  <YAxis stroke={theme === "dark" ? "#fff" : "#111"} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#111827" : "#ffffff",
                      color: theme === "dark" ? "#fff" : "#111",
                      borderRadius: 8,
                      border: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="current" name="Period A" fill="#34d399" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="compare" name="Period B" fill="#f87171" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="opacity-70 text-center">No comparison data. Adjust date ranges.</p>
            )
          ) : (
            <p className="opacity-70 text-center">Enable Compare in Filters to view side-by-side periods.</p>
          )
        )}
      </div>
      
      {/* Drawer */}
      <FilterDrawer
        theme={theme}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        categories={categories}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        dateRange={dateRange}
        setDateRange={setDateRange}
        compareMode={compareMode}
        setCompareMode={setCompareMode}
        compareRange={compareRange}
        setCompareRange={setCompareRange}
        onReset={resetFilters}
        onApply={applyFilters}
        savedFilters={savedFilters}
        onSaveFilter={saveCurrentFilter}
        onLoadFilter={loadFilterByName}
        onDeleteSaved={deleteSavedFilter}
      />
    </div>
  );
}