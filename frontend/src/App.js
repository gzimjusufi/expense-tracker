import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Login from "./pages/login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import OAuthCallback from "./pages/OAuthCallback";
import OAuthSuccess from "./pages/OAuthSuccess";
import VerifyEmail from "./pages/VerifyEmail";
import VerifyEmailRequest from "./pages/VerifyEmailRequest";
import InstallButton from "./components/InstallButton";
import CalendarPage from "./pages/Calendar";
import Goals from "./pages/Goals";
import Chatbot from "./components/Chatbot";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("user_logged_in");
  return token ? children : <Navigate to="/login" />;
};

const hideNavbarOn = ["/", "/login", "/register", "/verify-email", "/verify-email-request", "/oauth-callback", "/oauth-success"];

function Layout({ user, setUser, theme, setTheme, children }) {
  const location = useLocation();
  const showNavbar = !hideNavbarOn.includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar user={user} setUser={setUser} theme={theme} />}
      {children}
    </>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user_logged_in");
    return stored ? JSON.parse(stored) : null;
  });
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [currency, setCurrency] = useState(() => {
    const stored = localStorage.getItem("user_logged_in");
    return stored ? JSON.parse(stored)?.currency || "USD" : "USD";
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("https://expense-tracker-production-854d.up.railway.app/api/auth/verify", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.user?.currency) {
          setCurrency(data.user.currency);
          const stored = JSON.parse(localStorage.getItem("user_logged_in")) || {};
          localStorage.setItem("user_logged_in", JSON.stringify({ ...stored, currency: data.user.currency }));
        }
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
  localStorage.setItem("theme", theme);
}, [theme]);


  return (
    <Router>
      <InstallButton />
      <Layout user={user} setUser={setUser} theme={theme} setTheme={setTheme}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login setUser={setUser} setTheme={setTheme} setCurrency={setCurrency} />} />
          <Route path="/register" element={<Register setUser={setUser} setTheme={setTheme} setCurrency={setCurrency} />} />
          <Route path="/oauth-callback" element={<OAuthCallback setUser={setUser} />} />
          <Route path="/oauth-success" element={<OAuthSuccess setUser={setUser} />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-email-request" element={<VerifyEmailRequest />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard user={user} theme={theme} setTheme={setTheme} currency={currency} /></PrivateRoute>} />
          <Route path="/expenses" element={<PrivateRoute><Expenses user={user} theme={theme} currency={currency} /></PrivateRoute>} />
          <Route path="/goals" element={<PrivateRoute><Goals theme={theme} currency={currency} /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Reports user={user} theme={theme} currency={currency} /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings user={user} setUser={setUser} theme={theme} setTheme={setTheme} setCurrency={setCurrency} /></PrivateRoute>} />
          <Route path="/calendar" element={<PrivateRoute><CalendarPage theme={theme} currency={currency} /></PrivateRoute>} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        {user && <Chatbot theme={theme} currency={currency} />}
      </Layout>
    </Router>
  );
}

export default App;