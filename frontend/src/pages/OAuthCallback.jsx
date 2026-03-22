import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function OAuthCallback({ setUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Parse token from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // Save token
      localStorage.setItem("token", token);

      // You may want to fetch the user profile with this token
      fetch("https://expense-tracker-3dmz.onrender.com/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
            setUser(data.user);
          }
          navigate("/dashboard");
        })
        .catch(() => navigate("/login"));
    } else {
      navigate("/login");
    }
  }, [navigate, setUser]);

  return <p>Logging you in...</p>;
}

export default OAuthCallback;
