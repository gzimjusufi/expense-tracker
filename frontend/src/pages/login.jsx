import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

function Login({ setUser, setTheme, setCurrency }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = localStorage.getItem("theme") || "light";

  // Auto-login if token already exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user_logged_in");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      const storedTheme = localStorage.getItem("theme") || "light";
      setTheme(storedTheme);
      navigate("/dashboard");
    }
  }, [navigate, setUser, setTheme]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("https://expense-tracker-3dmz.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.message?.includes("verify")) {
          navigate("/verify-email-request");
        } else {
          setError(data.message || "Login failed.");
        }
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user_logged_in", JSON.stringify(data.user));
      setUser(data.user);
      setCurrency(data.user.currency || "USD");

      const storedTheme = localStorage.getItem("theme") || "light";
      setTheme(storedTheme);
      document.body.className =
        storedTheme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black";

      navigate("/dashboard");
    } catch (err) {
      setError("Server error. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

    const inputStyle = {
    width: "100%",
    margin: "10px 0",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: theme === "dark" ? "#2a2a2a" : "#fff",
    color: theme === "dark" ? "#fff" : "#000",
  };

  return (
    <div
      style={{
      maxWidth: "400px",
      margin: window.innerWidth < 600 ? "20px auto" : "50px auto",
      padding: "20px",
      border: "1px solid #ddd",
      borderRadius: "10px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
      backgroundColor: theme === "dark" ? "#1e1e1e" : "#fff",
      color: theme === "dark" ? "#fff" : "#000",

      }}
    >
      <h2 style={{ textAlign: "center" }}>Login</h2>
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
        
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: loading ? "#aaa" : "#3498db",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
            marginTop: "10px",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div style={{ marginTop: "15px", textAlign: "center" }}>
  <hr style={{ marginBottom: "15px" }} />
  
    <a href="https://expense-tracker-3dmz.onrender.com/api/auth/google"
    style={{
      display: "inline-block",
      width: "100%",
      padding: "12px",
      background: "#fff",
      color: "#444",
      border: "1px solid #ddd",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "bold",
      textDecoration: "none",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    }}
  >
    🔵 Continue with Google
  </a>
</div>
      <p style={{ marginTop: "15px", textAlign: "center" }}>
        Don't have an account?{" "}
        <Link to="/register" style={{ color: "#3498db" }}>
          Register
        </Link>
      </p>
    </div>
  );
}

export default Login;