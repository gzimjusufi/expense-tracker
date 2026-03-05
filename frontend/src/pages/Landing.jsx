import React from "react";
import { Link } from "react-router-dom";

function Landing() {
  const theme = localStorage.getItem("theme") || "light";

  return (
    <div
      className="d-flex flex-wrap flex-column justify-content-center align-items-center vh-100"
      style={{
        backgroundColor: theme === "dark" ? "#121212" : "#f5f5f5",
        color: theme === "dark" ? "#fff" : "#000",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <h1 className="mb-4" style={{ fontSize: window.innerWidth < 600 ? "24px" : "36px" }}>
        Welcome to Expense Tracker 💸
      </h1>
      <p className="mb-4" style={{ fontSize: window.innerWidth < 600 ? "14px" : "18px", maxWidth: "500px" }}>
        Track your expenses, manage budgets, and generate reports easily.
      </p>
      <div className="d-flex gap-2">
        <Link to="/login" className="btn btn-primary">
          Login
        </Link>
        <Link to="/register" className="btn btn-secondary">
          Register
        </Link>
      </div>
    </div>
  );
}

export default Landing;