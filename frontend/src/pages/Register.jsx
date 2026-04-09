import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const theme = localStorage.getItem("theme") || "light";
  const dark = theme === "dark";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
  }, [navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("https://expense-tracker-3dmz.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed.");
        return;
      }
      setSuccess("Account created! Please check your email to verify your account.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError("Server error. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
    backgroundColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    color: dark ? "#fff" : "#000",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
    marginBottom: "12px",
  };

  return (
    <div style={{
      background: dark
        ? "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)"
        : "linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f0f4ff 100%)",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
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

      <div style={{
        background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "20px",
        border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
        boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.08)",
        padding: "36px",
        width: "100%",
        maxWidth: "400px",
        position: "relative",
        zIndex: 1,
        color: dark ? "#fff" : "#111",
      }}>

        {/* Logo / Title */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>💸</div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "-0.02em", margin: 0 }}>
            Create account
          </h2>
          <p style={{ fontSize: "14px", opacity: 0.5, marginTop: "6px" }}>
            Start tracking your expenses today
          </p>
        </div>

        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: "10px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            color: "#ef4444", fontSize: "13px", marginBottom: "16px", textAlign: "center",
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: "10px 14px", borderRadius: "10px",
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
            color: "#10b981", fontSize: "13px", marginBottom: "16px", textAlign: "center",
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <label style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.5, display: "block", marginBottom: "6px" }}>
            Full Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
          />

          <label style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.5, display: "block", marginBottom: "6px" }}>
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          <label style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.5, display: "block", marginBottom: "6px" }}>
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ ...inputStyle, marginBottom: "20px" }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px",
              background: loading ? "rgba(16,185,129,0.5)" : "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff", border: "none", borderRadius: "10px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "600", fontSize: "14px",
              boxShadow: loading ? "none" : "0 4px 15px rgba(16,185,129,0.4)",
              transition: "opacity 0.2s",
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.opacity = "0.85")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div style={{ margin: "20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ flex: 1, height: "1px", background: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
          <span style={{ fontSize: "12px", opacity: 0.4 }}>or</span>
          <div style={{ flex: 1, height: "1px", background: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
        </div>

        <a
          href="https://expense-tracker-3dmz.onrender.com/api/auth/google"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            width: "100%", padding: "12px",
            background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.9)",
            color: dark ? "#fff" : "#444",
            border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
            borderRadius: "10px", cursor: "pointer",
            fontWeight: "600", fontSize: "14px",
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            boxSizing: "border-box",
          }}
        >
          🔵 Continue with Google
        </a>

        <p style={{ marginTop: "20px", textAlign: "center", fontSize: "14px", opacity: 0.6 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#6366f1", fontWeight: "600", textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;