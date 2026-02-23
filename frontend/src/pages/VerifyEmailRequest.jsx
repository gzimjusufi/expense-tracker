import React from "react";
import { useLocation, Link } from "react-router-dom";

function VerifyEmailRequest() {
  const location = useLocation();
  const email = location.state?.email;

  if (!email) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>Verification Error</h2>
        <p>Email not provided. Please register again.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "500px", margin: "50px auto", textAlign: "center" }}>
      <h2>Verify Your Email</h2>
      <p>
        A verification email has been sent to <strong>{email}</strong>. <br />
        Please check your inbox and click the link to activate your account.
      </p>
      <p>Once verified, you can log in to access your dashboard.</p>
    </div>
  );
}

export default VerifyEmailRequest;
