import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function OAuthSuccess({ setUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const currency = params.get("currency") || "USD";

    if (token) {
      localStorage.setItem("token", token);

      fetch("https://expense-tracker-3dmz.onrender.com/api/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          const userWithCurrency = { ...data.user, currency };
          setUser(userWithCurrency);
          localStorage.setItem("user_logged_in", JSON.stringify(userWithCurrency));
          navigate("/dashboard");
        })
        .catch(() => {
          navigate("/login");
        });
    } else {
      navigate("/login");
    }
  }, [navigate, setUser]);

  return <div style={{ textAlign: "center", marginTop: "50px" }}>Logging in...</div>;
}

export default OAuthSuccess;