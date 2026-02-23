import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function OAuthSuccess({ setUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // Save token in localStorage
      localStorage.setItem("token", token);

      // Verify token & get user
      fetch("http://localhost:5000/api/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          setUser(data.user);
          localStorage.setItem("user_logged_in", JSON.stringify(data.user));
          navigate("/dashboard"); // redirect to dashboard
        })
        .catch(() => {
          navigate("/login"); // fallback if verify fails
        });
    } else {
      navigate("/login"); // fallback if no token
    }
  }, [navigate, setUser]);

  return <div style={{ textAlign: "center", marginTop: "50px" }}>Logging in...</div>;
}

export default OAuthSuccess;
