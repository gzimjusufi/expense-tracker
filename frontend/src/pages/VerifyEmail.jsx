import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function VerifyEmail() {
  const [status, setStatus] = useState("pending"); // pending | success | error
  const navigate = useNavigate();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get("token");

    if (!token) {
      setStatus("error");
      return;
    }

    axios
      .get(`https://expense-tracker-3dmz.onrender.com/api/auth/verify-email?token=${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div style={{ maxWidth: "500px", margin: "50px auto", textAlign: "center" }}>
      <h2>Email Verification</h2>

      {status === "pending" && <p>Verifying your email...</p>}
      {status === "success" && (
        <p style={{ color: "green" }}>
          Email verified successfully! <button onClick={() => navigate("/login")}>Login</button>
        </p>
      )}
      {status === "error" && (
        <p style={{ color: "red" }}>
          Verification failed. Token expired or invalid.
        </p>
      )}
    </div>
  );
}

export default VerifyEmail;
