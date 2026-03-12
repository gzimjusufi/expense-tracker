import React, { useState, useEffect } from "react";

const Settings = ({ theme, setTheme, user, setCurrency }) => {
  const [profile, setProfile] = useState({
    name: "",
    password: "",
    avatar: null,
    currency: "USD",
  });

  // Load per-user profile on mount or when user changes
useEffect(() => {
  if (user?.email) {
    const savedProfile = localStorage.getItem(`profile_${user.email}`);
    const data = savedProfile ? JSON.parse(savedProfile) : {};
    setProfile({
      name: data.name || user?.name || user?.username || "",
      password: "",
      avatar: user?.avatar || data.avatar || null,
      currency: data.currency || user?.currency || "USD",
    });
  }
}, [user]);

const handleSaveProfile = async () => {
  if (!user?.email) return;

  const existingProfile = JSON.parse(localStorage.getItem(`profile_${user.email}`)) || {};

  const updatedProfile = {
    name: profile.name,
    avatar: profile.avatar,
    password: profile.password || existingProfile.password || "",
    currency: profile.currency || "USD",
  };

  localStorage.setItem(`profile_${user.email}`, JSON.stringify(updatedProfile));

  try {
    const token = localStorage.getItem("token");
    const body = { name: profile.name };
    if (profile.password) body.password = profile.password;
    if (profile.currency) body.currency = profile.currency;
    if (profile.avatar) body.avatar = profile.avatar;

    const res = await fetch("https://expense-tracker-production-854d.up.railway.app/api/auth/update-profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Failed to update profile.");
      return;
    }

    const stored = JSON.parse(localStorage.getItem("user_logged_in")) || {};
localStorage.setItem("user_logged_in", JSON.stringify({ 
  ...stored, 
  currency: profile.currency || stored.currency,
  avatar: profile.avatar || stored.avatar,
}));
if (profile.currency) setCurrency(profile.currency);

    alert("Profile updated successfully!");
  } catch (err) {
    alert("Server error. Could not update profile.");
  }
};
  // Input handlers
  const handleInputChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatar: reader.result }); // Base64
      };
      reader.readAsDataURL(file);
    }
  };

  // Theme handler
  const handleThemeChange = (e) => setTheme(e.target.value);

  // Styles
  const pageStyle = {
    backgroundColor: theme === "dark" ? "#121212" : "#f5f5f5",
    color: theme === "dark" ? "#fff" : "#000",
    minHeight: "100vh",
    padding: window.innerWidth < 600 ? "15px" : "30px",
  };

  const cardStyle = {
    background: theme === "dark" ? "#1e1e1e" : "#fff",
    borderRadius: "14px",
    padding: "25px",
    maxWidth: "500px",
    width: "100%",
    marginBottom: "25px",
    boxShadow:
      theme === "dark"
        ? "0 8px 25px rgba(0,0,0,0.6)"
        : "0 8px 25px rgba(0,0,0,0.1)",
  };

  const labelStyle = { fontSize: "14px", marginBottom: "6px", display: "block" };

  const inputStyle = {
    padding: "10px",
    borderRadius: "8px",
    border: theme === "dark" ? "1px solid #444" : "1px solid #ccc",
    backgroundColor: theme === "dark" ? "#2a2a2a" : "#fff",
    color: theme === "dark" ? "#fff" : "#000",
    width: "100%",
  };

  const selectStyle = {
    padding: "10px",
    borderRadius: "8px",
    border: theme === "dark" ? "1px solid #444" : "1px solid #ccc",
    backgroundColor: theme === "dark" ? "#2a2a2a" : "#fff",
    color: theme === "dark" ? "#fff" : "#000",
    width: "100%",
  };

  const buttonStyle = {
    padding: "12px",
    background: theme === "dark" ? "#1abc9c" : "#3182ce",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
    marginTop: "15px",
  };

  return (
    <div style={pageStyle}>
      <h2>Settings</h2>

      {/* Theme Card */}
      <div style={cardStyle}>
        <h3>Appearance</h3>
        <label style={labelStyle}>Theme</label>
        <select value={theme} onChange={handleThemeChange} style={selectStyle}>
          <option value="light">🌞 Light</option>
          <option value="dark">🌙 Dark</option>
        </select>
      </div>

      {/* Profile Card */}
      <div style={cardStyle}>
        <h3>Profile</h3>

        {/* Avatar */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt="Profile"
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: "10px",
              }}
            />
          ) : (
            <div
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                backgroundColor: theme === "dark" ? "#333" : "#e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                marginBottom: "10px",
              }}
            >
              👤
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleAvatarChange} />
        </div>

        <label style={labelStyle}>Preferred Currency</label>
<select
  name="currency"
  value={profile.currency || "USD"}
  onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
  style={inputStyle}
>
  <option value="USD">🇺🇸 USD - US Dollar</option>
  <option value="EUR">🇪🇺 EUR - Euro</option>
  <option value="GBP">🇬🇧 GBP - British Pound</option>
  <option value="MKD">🇲🇰 MKD - Macedonian Denar</option>
  <option value="CHF">🇨🇭 CHF - Swiss Franc</option>
  <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
  <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
  <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
</select>
<br /><br />

        <label style={labelStyle}>Full Name</label>
        <input
          type="text"
          name="name"
          value={profile.name}
          onChange={handleInputChange}
          style={inputStyle}
        />

        <br />
        <br />

        <label style={labelStyle}>Password</label>
        <input
          type="password"
          name="password"
          value={profile.password}
          onChange={handleInputChange}
          placeholder="Leave blank to keep current password"
          style={inputStyle}
        />

        <button style={buttonStyle} onClick={handleSaveProfile}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default Settings;
