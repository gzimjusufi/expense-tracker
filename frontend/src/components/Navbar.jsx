import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Navbar = ({ theme, user, setUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();

  const navStyle =
    theme === "dark"
      ? { backgroundColor: "#1a202c", color: "#fff" }
      : { backgroundColor: "#fff", color: "#000" };

  // Load per-user profile
useEffect(() => {
  if (user?.email) {
    const savedProfile = localStorage.getItem(`profile_${user.email}`);
    const profile = savedProfile ? JSON.parse(savedProfile) : {};
    setProfilePic(user?.avatar || profile.avatar || null);
    setFullName(user?.name || profile.name || "");
  }
}, [user]);

const handleLogout = () => {
  const currentTheme = localStorage.getItem("theme"); // preserve theme
  localStorage.removeItem("user_logged_in");
  localStorage.removeItem("token");
  if (currentTheme) localStorage.setItem("theme", currentTheme); // restore it
  setUser(null);
  navigate("/login");
};

  const links = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Expenses", path: "/expenses" },
    { name: "Goals", path: "/goals" },
    { name: "Reports", path: "/reports" },
    { name: "Calendar", path: "/calendar" },
    { name: "Settings", path: "/settings" },
  ];

  const profileImageStyle = {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    objectFit: "cover",
    marginRight: "10px",
    border: theme === "dark" ? "2px solid #fff" : "2px solid #000",
  };

  const profilePlaceholderStyle = {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    backgroundColor: theme === "dark" ? "#333" : "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "10px",
    fontSize: "18px",
    border: theme === "dark" ? "2px solid #fff" : "2px solid #000",
  };

  const nameStyle = {
    fontWeight: "bold",
    color: navStyle.color,
    marginRight: "10px",
    maxWidth: "120px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  return (
    <nav
      style={{
        ...navStyle,
        padding: "10px 20px",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <h1 style={{ fontWeight: "bold", fontSize: window.innerWidth < 600 ? "18px" : "24px" }}>Expense Tracker</h1>

        {/* Desktop Links */}
        <div className="d-none d-md-flex" style={{ alignItems: "center" }}>
          {links.map((link) => (
            <Link
              key={link.path}
              style={{ margin: "0 10px", color: navStyle.color }}
              to={link.path}
            >
              {link.name}
            </Link>
          ))}

          {user ? (
            <div style={{ display: "flex", alignItems: "center", marginLeft: "15px" }}>
              <Link to="/settings" style={{ display: "flex", alignItems: "center" }}>
                {profilePic ? (
                  <img src={profilePic} alt="Profile" style={profileImageStyle} />
                ) : (
                  <div style={profilePlaceholderStyle}>👤</div>
                )}
                {fullName && <span style={nameStyle}>{fullName}</span>}
              </Link>

              <button
                onClick={handleLogout}
                style={{
                  padding: "5px 10px",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: "#e74c3c",
                  color: "#fff",
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link style={{ margin: "0 10px", color: navStyle.color }} to="/login">
                Login
              </Link>
              <Link style={{ margin: "0 10px", color: navStyle.color }} to="/register">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Button */}
        <button className="d-md-none btn btn-outline-primary" onClick={() => setIsOpen(!isOpen)}>
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div style={{ marginTop: "10px", padding: "5px 0", borderTop: `1px solid ${theme === "dark" ? "#333" : "#eee"}` }}>
          {links.map((link) => (
            <Link
              key={link.path}
              style={{ display: "block", padding: "10px 5px", color: navStyle.color, borderBottom: `1px solid ${theme === "dark" ? "#333" : "#eee"}` }}
              to={link.path}
            >
              {link.name}
            </Link>
          ))}

          {user ? (
            <div style={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
              <Link to="/settings" style={{ display: "flex", alignItems: "center" }}>
                {profilePic ? (
                  <img src={profilePic} alt="Profile" style={profileImageStyle} />
                ) : (
                  <div style={profilePlaceholderStyle}>👤</div>
                )}
                {fullName && <span style={nameStyle}>{fullName}</span>}
              </Link>

              <button
                onClick={handleLogout}
                style={{
                  padding: "5px 10px",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: "#e74c3c",
                  color: "#fff",
                  width: "100%",
                  marginTop: "5px",
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link
                style={{ display: "block", padding: "10px 5px", color: navStyle.color, borderBottom: `1px solid ${theme === "dark" ? "#333" : "#eee"}` }}
                to="/login"
              >
                Login
              </Link>
              <Link
                style={{ display: "block", padding: "10px 5px", color: navStyle.color, borderBottom: `1px solid ${theme === "dark" ? "#333" : "#eee"}` }}
                to="/register"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
