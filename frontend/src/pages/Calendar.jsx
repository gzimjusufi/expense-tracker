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

  const dark = theme === "dark";

  const glassCard = {
    background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: "16px",
    border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
    boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.08)",
    padding: "20px",
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("https://expense-tracker-3dmz.onrender.com/api/expenses", {
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
      padding: window.innerWidth < 600 ? "10px" : "24px",
      background: dark
        ? "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)"
        : "linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f0f4ff 100%)",
      color: dark ? "#fff" : "#000",
      minHeight: "100vh",
      position: "relative",
    }}>

      {/* Ambient blobs */}
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
        <h2 style={{
          marginBottom: "24px",
          fontSize: "24px",
          fontWeight: "700",
          letterSpacing: "-0.02em",
        }}>
          📅 Expense Calendar
        </h2>

        <style>{`
          .rbc-calendar {
            background-color: transparent;
            color: ${dark ? "#fff" : "#000"};
            font-family: inherit;
          }
          .rbc-month-view {
            background-color: transparent;
            border: ${dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)"};
            border-radius: 12px;
            overflow: hidden;
          }
          .rbc-day-bg {
            background-color: ${dark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.7)"};
          }
          .rbc-day-bg + .rbc-day-bg {
            border-left: ${dark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.04)"};
          }
          .rbc-off-range-bg {
            background-color: ${dark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.03)"};
          }
          .rbc-today {
            background-color: ${dark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)"} !important;
          }
          .rbc-header {
            background-color: ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"};
            color: ${dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)"};
            padding: 10px 8px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            border-bottom: ${dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)"};
          }
          .rbc-date-cell {
            color: ${dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"};
            padding: 4px 8px;
            font-size: 13px;
          }
          .rbc-event {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border: none;
            border-radius: 6px;
            font-size: 11px;
            padding: 2px 6px;
            box-shadow: 0 2px 8px rgba(99,102,241,0.4);
          }
          .rbc-event:focus { outline: none; }
          .rbc-show-more {
            color: #6366f1;
            font-size: 11px;
            font-weight: 600;
          }
          .rbc-toolbar button {
            color: ${dark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)"};
            background-color: ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"};
            border: ${dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)"};
            border-radius: 8px;
            padding: 6px 14px;
            font-size: 13px;
            transition: all 0.2s;
          }
          .rbc-toolbar button:hover {
            background-color: ${dark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)"};
            border-color: rgba(99,102,241,0.4);
            color: #6366f1;
          }
          .rbc-toolbar button.rbc-active {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #fff;
            border-color: transparent;
            box-shadow: 0 4px 12px rgba(99,102,241,0.4);
          }
          .rbc-toolbar {
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 16px;
          }
          .rbc-toolbar-label {
            font-weight: 700;
            font-size: 16px;
            letter-spacing: -0.01em;
          }
          .rbc-month-row {
            border-top: ${dark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.04)"};
          }
          .rbc-row-segment { padding: 2px 4px; }
        `}</style>

        <div style={{
          ...glassCard,
          padding: "20px",
          height: window.innerWidth < 600 ? "420px" : "620px",
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
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: dark ? "rgba(20,20,40,0.95)" : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
            boxShadow: dark ? "0 24px 60px rgba(0,0,0,0.6)" : "0 24px 60px rgba(0,0,0,0.15)",
            color: dark ? "#fff" : "#000",
            padding: "28px",
            borderRadius: "20px",
            minWidth: "300px",
            maxWidth: "95vw",
            width: window.innerWidth < 600 ? "95vw" : "460px",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: "20px",
            }}>
              <div>
                <div style={{
                  fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em",
                  textTransform: "uppercase", opacity: 0.5, marginBottom: "4px",
                }}>Expenses</div>
                <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                  📅 {selectedDate}
                </h4>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  border: "none", borderRadius: "50%", width: "32px", height: "32px",
                  cursor: "pointer", color: dark ? "#fff" : "#000",
                  fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              {selectedExpenses.map((e, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px",
                  background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                  borderRadius: "12px",
                  border: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.05)",
                }}>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "14px" }}>{e.category}</div>
                    <div style={{ fontSize: "12px", opacity: 0.5, marginTop: "2px" }}>{e.description}</div>
                  </div>
                  <div style={{
                    fontWeight: "700", fontSize: "15px",
                    color: "#6366f1",
                  }}>
                    {formatCurrency(e.amount, currency)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 16px",
              background: dark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)",
              borderRadius: "12px",
              border: "1px solid rgba(99,102,241,0.3)",
              marginBottom: "16px",
            }}>
              <span style={{ fontWeight: "600", fontSize: "14px" }}>Total</span>
              <span style={{ fontWeight: "800", fontSize: "18px", color: "#6366f1" }}>
                {formatCurrency(totalForDay, currency)}
              </span>
            </div>

            <button
              onClick={() => setShowModal(false)}
              style={{
                width: "100%", padding: "12px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", border: "none", borderRadius: "12px",
                cursor: "pointer", fontWeight: "600", fontSize: "14px",
                boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
                transition: "opacity 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}