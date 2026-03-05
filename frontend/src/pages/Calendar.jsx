import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import axios from "axios";
import { formatCurrency } from "../services/currency";

const localizer = momentLocalizer(moment);

export default function CalendarPage({ theme, currency = "USD" }) {
  const [expenses, setExpenses] = useState([]);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("http://localhost:5000/api/expenses", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setExpenses(res.data))
      .catch(err => console.error(err));
  }, []);

  const events = expenses.map(exp => ({
    title: `${exp.category}: ${formatCurrency(exp.amount, currency)}`,
    start: new Date(exp.date),
    end: new Date(exp.date),
    resource: exp,
  }));

  const handleSelectEvent = (event) => {
    const date = moment(event.start).format("YYYY-MM-DD");
    const dayExpenses = expenses.filter(e =>
      moment(e.date).format("YYYY-MM-DD") === date
    );
    setSelectedExpenses(dayExpenses);
    setSelectedDate(moment(event.start).format("MMMM D, YYYY"));
    setShowModal(true);
  };

  const handleSelectSlot = (slot) => {
    const date = moment(slot.start).format("YYYY-MM-DD");
    const dayExpenses = expenses.filter(e =>
      moment(e.date).format("YYYY-MM-DD") === date
    );
    if (dayExpenses.length > 0) {
      setSelectedExpenses(dayExpenses);
      setSelectedDate(moment(slot.start).format("MMMM D, YYYY"));
      setShowModal(true);
    }
  };

  const totalForDay = selectedExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div style={{
      padding: "20px",
      backgroundColor: theme === "dark" ? "#121212" : "#f5f5f5",
      color: theme === "dark" ? "#fff" : "#000",
      minHeight: "100vh",
    }}>
      <h2 style={{ marginBottom: "20px" }}>📅 Expense Calendar</h2>

      <style>{`
  .rbc-calendar { background-color: ${theme === "dark" ? "#1e1e1e" : "#fff"}; color: ${theme === "dark" ? "#fff" : "#000"}; }
  .rbc-month-view { background-color: ${theme === "dark" ? "#1e1e1e" : "#fff"}; }
  .rbc-day-bg { background-color: ${theme === "dark" ? "#1e1e1e" : "#fff"}; }
  .rbc-off-range-bg { background-color: ${theme === "dark" ? "#121212" : "#f5f5f5"}; }
  .rbc-today { background-color: ${theme === "dark" ? "#2d3748" : "#eaf6ff"} !important; }
  .rbc-header { background-color: ${theme === "dark" ? "#2d2d2d" : "#f0f0f0"}; color: ${theme === "dark" ? "#fff" : "#000"}; padding: 8px; }
  .rbc-date-cell { color: ${theme === "dark" ? "#fff" : "#000"}; }
  .rbc-event { background-color: #6366f1; border: none; border-radius: 4px; }
  .rbc-show-more { color: #6366f1; }
  .rbc-toolbar button { color: ${theme === "dark" ? "#fff" : "#000"}; background-color: ${theme === "dark" ? "#2d2d2d" : "#f0f0f0"}; border: 1px solid ${theme === "dark" ? "#555" : "#ccc"}; }
  .rbc-toolbar button:hover { background-color: ${theme === "dark" ? "#3d3d3d" : "#e0e0e0"}; }
  .rbc-toolbar { flex-wrap: wrap; gap: 5px; }
  .rbc-toolbar-label { width: 100%; text-align: center; }
`}</style>

      <div style={{
        backgroundColor: theme === "dark" ? "#1e1e1e" : "#fff",
        padding: "20px",
        borderRadius: "10px",
        height: window.innerWidth < 600 ? "400px" : "600px",
      }}>

        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          style={{ height: "100%" }}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: theme === "dark" ? "#1e1e1e" : "#fff",
            color: theme === "dark" ? "#fff" : "#000",
            padding: "25px",
            borderRadius: "10px",
            minWidth: "300px",
            maxWidth: "95vw",
            width: window.innerWidth < 600 ? "95vw" : "500px",
          }}>
            <h4>📅 {selectedDate}</h4>
            <hr />
            {selectedExpenses.map((e, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 0", borderBottom: "1px solid #333"
              }}>
                <div>
                  <strong>{e.category}</strong>
                  <p style={{ margin: 0, fontSize: "13px", opacity: 0.7 }}>{e.description}</p>
                </div>
                <div style={{ fontWeight: "bold" }}>{formatCurrency(e.amount, currency)}</div>
              </div>
            ))}
            <hr />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
              <span>Total</span>
              <span>{formatCurrency(totalForDay, currency)}</span>
            </div>
            <button
              onClick={() => setShowModal(false)}
              style={{
                marginTop: "15px", width: "100%", padding: "10px",
                backgroundColor: "#3498db", color: "#fff",
                border: "none", borderRadius: "6px", cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}