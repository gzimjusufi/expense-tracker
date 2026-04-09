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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "../services/currency";

const glassCard = (dark) => ({
  background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: "16px",
  border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
  boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.08)",
  padding: "20px",
  marginBottom: "20px",
});

const inputBase = (dark) => ({
  padding: "10px 14px",
  borderRadius: "10px",
  border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
  backgroundColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
  color: dark ? "#fff" : "#000",
  outline: "none",
  fontSize: "14px",
});

const buttonBase = (bg, color) => ({
  padding: "10px 18px",
  borderRadius: "10px",
  border: "none",
  fontWeight: "600",
  fontSize: "14px",
  cursor: "pointer",
  background: bg,
  color: color,
  transition: "opacity 0.2s",
});

// Attach token to requests
const authHeader = () => {
  const token = localStorage.getItem("token"); // or sessionStorage if you stored it there
  return { headers: { Authorization: `Bearer ${token}` } };
};
// -------------------------
// Utility helpers
// -------------------------

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
export default function Reports({ theme = "dark", currency: userCurrency = "USD" }) {
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
      const res = await axios.get("https://expense-tracker-3dmz.onrender.com/api/expenses", authHeader());
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
  "https://expense-tracker-3dmz.onrender.com/api/expenses/export/csv",
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
          formatCurrency(exp.amount, userCurrency),
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
    await axios.post("https://expense-tracker-3dmz.onrender.com/api/expenses/import/csv", formData, {
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

  const [showShareModal, setShowShareModal] = useState(false);
const [shareEmail, setShareEmail] = useState("");
const [shareSending, setShareSending] = useState(false);

const handleShareReport = async () => {
  if (!shareEmail) return alert("Please enter an email address!");
  setShareSending(true);
  try {
    // Generate PDF
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Expenses Report", 14, 15);

    const tableColumn = ["Date", "Category", "Description", "Amount"];
    const tableRows = filtered.map(exp => [
      exp.date ? new Date(exp.date).toLocaleDateString() : "N/A",
      exp.category || "N/A",
      exp.description || "-",
      formatCurrency(exp.amount, userCurrency),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 11, cellPadding: 4 },
      headStyles: { fillColor: [52, 152, 219], textColor: 255, halign: "center" },
    });

    const pdfBase64 = doc.output("datauristring").split(",")[1];

    await axios.post("https://expense-tracker-3dmz.onrender.com/api/expenses/share-report", {
      email: shareEmail,
      pdfBase64,
      filename: "expenses_report.pdf",
    }, authHeader());

    alert(`Report sent to ${shareEmail}!`);
    setShowShareModal(false);
    setShareEmail("");
  } catch (err) {
    console.error(err);
    alert("Failed to send report.");
  } finally {
    setShareSending(false);
  }
};

  // -------------------------
  // UI
  // -------------------------
  const pageStyle = {
  background: theme === "dark"
    ? "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)"
    : "linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f0f4ff 100%)",
  color: theme === "dark" ? "#fff" : "#111",
  minHeight: "100vh",
  padding: "24px",
};
  const dark = theme === "dark";

 return (
    <div style={pageStyle}>
 
      {/* Glow effects */}
      <div style={{
        position: "fixed", top: "-100px", left: "-100px",
        width: "300px", height: "300px", background: "#6366f1",
        filter: "blur(120px)", opacity: dark ? 0.2 : 0.08, zIndex: 0, pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "-100px", right: "-100px",
        width: "300px", height: "300px", background: "#34d399",
        filter: "blur(120px)", opacity: dark ? 0.2 : 0.08, zIndex: 0, pointerEvents: "none",
      }} />
 
      {/* CONTENT WRAPPER */}
      <div style={{ position: "relative", zIndex: 1 }}>
 
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <motion.h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "6px", letterSpacing: "-0.02em" }}>
            Reports Dashboard
          </motion.h2>
          <p style={{ opacity: 0.5, fontSize: "14px", marginBottom: "16px" }}>
            Detailed analysis of expenses with filters, comparisons, and export options.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {[
              { label: "Open Filters", onClick: () => setIsDrawerOpen(true), color: "#6366f1" },
              { label: "Share Report", onClick: () => setShowShareModal(true), color: "#8b5cf6" },
              { label: "Export CSV", onClick: handleExport, color: "#3b82f6" },
              { label: "Export PDF", onClick: handleExportPDF, color: "#ef4444" },
              { label: "Upload", onClick: handleImport, color: "#059669" },
              { label: "Reset", onClick: resetFilters, color: "#6b7280" },
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick} style={{
                padding: "8px 14px", borderRadius: "10px", border: "none",
                background: btn.color, color: "#fff", fontWeight: "600",
                fontSize: "13px", cursor: "pointer", transition: "opacity 0.2s",
                boxShadow: `0 4px 12px ${btn.color}44`,
              }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {btn.label}
              </button>
            ))}
            <label style={{ cursor: "pointer" }}>
              <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
              <span
                onClick={() => document.querySelector('input[type="file"]').click()}
                style={{
                  display: "inline-block", padding: "8px 14px", borderRadius: "10px",
                  background: "#16a34a", color: "#fff", fontWeight: "600",
                  fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 12px #16a34a44",
                }}
              >
                Import CSV
              </span>
            </label>
          </div>
        </div>
 
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total Spent", value: formatCurrency(totalSpent, userCurrency), color: "#6366f1", icon: "💸" },
            { label: "Avg per Month", value: formatCurrency(avgPerMonth, userCurrency), color: "#10b981", icon: "📅" },
            { label: "Top Category", value: topCat ? topCat.name : "—", sub: topCat ? formatCurrency(topCat.amount, userCurrency) : "", color: "#f59e0b", icon: "🏆" },
          ].map((item, i) => (
            <motion.div key={i} layout style={{
              ...glassCard(dark),
              borderTop: `2px solid ${item.color}`,
              position: "relative", overflow: "hidden", marginBottom: 0,
            }}>
              <div style={{ position: "absolute", top: "-10px", right: "-10px", fontSize: "50px", opacity: 0.07 }}>{item.icon}</div>
              <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.5, marginBottom: "6px" }}>
                {item.label}
              </div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: item.color }}>{item.value}</div>
              {item.sub && <div style={{ fontSize: "12px", opacity: 0.5, marginTop: "4px" }}>{item.sub}</div>}
            </motion.div>
          ))}
        </div>
 
        {/* Tabs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          {[
            { key: "summary", label: "Summary" },
            { key: "trends", label: "Trends" },
            { key: "comparison", label: "Comparison" },
            { key: "pie", label: "By Category" },
          ].map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: "8px 18px", borderRadius: "10px", border: "none",
              fontWeight: "600", fontSize: "13px", cursor: "pointer", transition: "all 0.2s",
              background: activeTab === t.key
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              color: activeTab === t.key ? "#fff" : dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
              boxShadow: activeTab === t.key ? "0 4px 12px rgba(99,102,241,0.4)" : "none",
            }}>
              {t.label}
            </button>
          ))}
        </div>
 
        {/* Active Filter Summary */}
        <motion.div layout style={{ ...glassCard(dark), marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { label: "Date Range", value: `${dateRange.start || "Any"} – ${dateRange.end || "Any"}` },
              { label: "Categories", value: selectedCategories.length > 0 ? selectedCategories.join(", ") : "All" },
              { label: "Total Spent", value: formatCurrency(totalSpent, userCurrency) },
              { label: "Avg per Month", value: formatCurrency(avgPerMonth, userCurrency) },
              { label: "Top Category", value: topCat ? `${topCat.name} (${formatCurrency(topCat.amount, userCurrency)})` : "—" },
            ].map((item, i) => (
              <React.Fragment key={i}>
                <div style={{ fontSize: "12px", opacity: 0.5 }}>{item.label}</div>
                <div style={{ fontSize: "13px", fontWeight: "600" }}>{item.value}</div>
              </React.Fragment>
            ))}
          </div>
        </motion.div>
 
        {/* Charts */}
        <motion.div layout style={{ display: "grid", gap: "20px", marginBottom: "24px" }}>
 
          {activeTab === "summary" && (
            <motion.div layout style={glassCard(dark)}>
              {monthlyTotals.length > 0 ? (
                <ResponsiveContainer width="100%" height={window.innerWidth < 600 ? 250 : 420}>
                  <BarChart data={monthlyTotals} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
                    <XAxis dataKey="month" stroke={dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
                    <YAxis stroke={dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
                    <Tooltip contentStyle={{ backgroundColor: dark ? "rgba(20,20,40,0.95)" : "#fff", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "12px", color: dark ? "#fff" : "#000" }} />
                    <Legend />
                    <Bar dataKey="total" name="Expenses" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p style={{ opacity: 0.5, textAlign: "center", padding: "40px 0" }}>No expense data to display.</p>}
            </motion.div>
          )}
 
          {activeTab === "trends" && (
            <motion.div layout style={glassCard(dark)}>
              {monthlyTotals.length > 0 ? (
                <ResponsiveContainer width="100%" height={window.innerWidth < 600 ? 250 : 420}>
                  <LineChart data={monthlyTotals} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
                    <XAxis dataKey="month" stroke={dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
                    <YAxis stroke={dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
                    <Tooltip contentStyle={{ backgroundColor: dark ? "rgba(20,20,40,0.95)" : "#fff", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "12px", color: dark ? "#fff" : "#000" }} />
                    <Legend />
                    <Line type="monotone" dataKey="total" name="Expenses" stroke="#60a5fa" strokeWidth={3} dot />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p style={{ opacity: 0.5, textAlign: "center", padding: "40px 0" }}>No expense data to display.</p>}
            </motion.div>
          )}
 
          {activeTab === "comparison" && (
            <motion.div layout style={glassCard(dark)}>
              {compareMode ? (
                compareData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={window.innerWidth < 600 ? 250 : 420}>
                    <BarChart data={compareData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
                      <XAxis dataKey="month" stroke={dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
                      <YAxis stroke={dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
                      <Tooltip contentStyle={{ backgroundColor: dark ? "rgba(20,20,40,0.95)" : "#fff", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "12px", color: dark ? "#fff" : "#000" }} />
                      <Legend />
                      <Bar dataKey="current" name="Period A" fill="#34d399" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="compare" name="Period B" fill="#f87171" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p style={{ opacity: 0.5, textAlign: "center", padding: "40px 0" }}>No comparison data. Adjust date ranges.</p>
              ) : <p style={{ opacity: 0.5, textAlign: "center", padding: "40px 0" }}>Enable Compare in Filters to view side-by-side periods.</p>}
            </motion.div>
          )}
 
          {activeTab === "pie" && (
            <motion.div layout style={glassCard(dark)}>
              {filtered.length > 0 ? (
                <ResponsiveContainer width="100%" height={window.innerWidth < 600 ? 300 : 450}>
                  <PieChart>
                    <Pie
                      data={Object.entries(filtered.reduce((acc, e) => {
                        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
                        return acc;
                      }, {})).map(([name, value]) => ({ name, value }))}
                      cx="50%" cy="50%"
                      outerRadius={window.innerWidth < 600 ? 80 : 150}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {["#6366f1", "#34d399", "#f87171", "#f59e0b", "#60a5fa", "#a78bfa", "#10b981"].map((color, index) => (
                        <Cell key={index} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value, userCurrency)} contentStyle={{ backgroundColor: dark ? "rgba(20,20,40,0.95)" : "#fff", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "12px", color: dark ? "#fff" : "#000" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p style={{ opacity: 0.5, textAlign: "center", padding: "40px 0" }}>No expense data to display.</p>}
            </motion.div>
          )}
 
        </motion.div>
 
        {/* Share Modal */}
        {showShareModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000,
          }}>
            <div style={{ ...glassCard(dark), minWidth: "350px", maxWidth: "95vw" }}>
              <h4 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "700" }}>📤 Share Report via Email</h4>
              <input
                type="email"
                placeholder="Enter email address"
                value={shareEmail}
                onChange={e => setShareEmail(e.target.value)}
                style={{ ...inputBase(dark), width: "100%", boxSizing: "border-box", marginBottom: "12px" }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={handleShareReport} disabled={shareSending} style={{
                  ...buttonBase("linear-gradient(135deg, #6366f1, #8b5cf6)", "#fff"),
                  flex: 1, boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
                }}>
                  {shareSending ? "Sending..." : "Send"}
                </button>
                <button onClick={() => setShowShareModal(false)} style={{
                  ...buttonBase(dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", dark ? "#fff" : "#000"),
                  flex: 1,
                }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
 
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
    </div>
  );
}