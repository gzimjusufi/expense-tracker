import React from "react";
import { Link } from "react-router-dom";

function Landing() {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100">
      <h1 className="mb-4">Welcome to Expense Tracker 💸</h1>
      <p className="mb-4">Track your expenses, manage budgets, and generate reports easily.</p>
      <div>
        <Link to="/login" className="btn btn-primary me-2">
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
