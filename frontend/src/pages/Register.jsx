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

  // Redirect if already logged in
useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) navigate("/dashboard");
}, [navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
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
      margin: "50px auto",
      padding: "20px",
      border: "1px solid #ddd",
      borderRadius: "10px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
      backgroundColor: theme === "dark" ? "#1e1e1e" : "#fff",
      color: theme === "dark" ? "#fff" : "#000",
      }}
    >
      <h2 style={{ textAlign: "center" }}>Register</h2>
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
      {success && <p style={{ color: "green", textAlign: "center" }}>{success}</p>}

      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ width: "100%", margin: "10px 0", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", margin: "10px 0", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", margin: "10px 0", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: loading ? "#aaa" : "#2ecc71",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
            marginTop: "10px",
          }}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <div style={{ marginTop: "15px", textAlign: "center" }}>
  <hr style={{ marginBottom: "15px" }} />
  
    <a href="http://localhost:5000/api/auth/google"
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

      <p style={{ marginTop: "10px", textAlign: "center" }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "#3498db" }}>Login</Link>
      </p>
    </div>
  );
}

export default Register;