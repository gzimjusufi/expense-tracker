import React from "react";
import { Link } from "react-router-dom";

function Landing() {
  const theme = localStorage.getItem("theme") || "light";
  const dark = theme === "dark";

  return (
    <div style={{
      background: dark
        ? "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)"
        : "linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f0f4ff 100%)",
      color: dark ? "#fff" : "#111",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
      textAlign: "center",
    }}>

      {/* Ambient blobs */}
      {dark ? (
        <>
          <div style={{
            position: "fixed", top: "-100px", left: "-100px", width: "500px", height: "500px",
            borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
            pointerEvents: "none", zIndex: 0,
          }} />
          <div style={{
            position: "fixed", bottom: "-100px", right: "-100px", width: "600px", height: "600px",
            borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
            pointerEvents: "none", zIndex: 0,
          }} />
        </>
      ) : (
        <>
          <div style={{
            position: "fixed", top: "-100px", left: "-100px", width: "500px", height: "500px",
            borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
            pointerEvents: "none", zIndex: 0,
          }} />
          <div style={{
            position: "fixed", bottom: "-100px", right: "-100px", width: "600px", height: "600px",
            borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)",
            pointerEvents: "none", zIndex: 0,
          }} />
        </>
      )}

      <div style={{ position: "relative", zIndex: 1, maxWidth: "560px" }}>

        {/* Icon */}
        <div style={{
          fontSize: "64px", marginBottom: "16px",
          filter: dark ? "drop-shadow(0 0 30px rgba(99,102,241,0.5))" : "none",
        }}>
          💸
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: window.innerWidth < 600 ? "28px" : "44px",
          fontWeight: "800",
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          marginBottom: "16px",
          background: dark
            ? "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)"
            : "linear-gradient(135deg, #111 0%, #444 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Expense Tracker
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: window.innerWidth < 600 ? "15px" : "18px",
          opacity: 0.6,
          maxWidth: "400px",
          margin: "0 auto 36px",
          lineHeight: 1.6,
        }}>
          Track your expenses, manage budgets, and generate reports — all in one place.
        </p>

        {/* Feature pills */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "8px",
          justifyContent: "center", marginBottom: "36px",
        }}>
          {["📊 Smart Reports", "🤖 AI Insights", "🎯 Budget Goals", "📅 Calendar View"].map((f, i) => (
            <div key={i} style={{
              padding: "6px 14px",
              background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
              borderRadius: "100px",
              fontSize: "13px",
              fontWeight: "500",
              backdropFilter: "blur(10px)",
            }}>
              {f}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/login" style={{
            padding: "14px 32px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            borderRadius: "12px",
            fontWeight: "700",
            fontSize: "15px",
            textDecoration: "none",
            boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
            transition: "opacity 0.2s",
            display: "inline-block",
          }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Sign In
          </Link>
          <Link to="/register" style={{
            padding: "14px 32px",
            background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
            color: dark ? "#fff" : "#111",
            border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.1)",
            borderRadius: "12px",
            fontWeight: "700",
            fontSize: "15px",
            textDecoration: "none",
            backdropFilter: "blur(10px)",
            transition: "opacity 0.2s",
            display: "inline-block",
          }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.7")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Landing;