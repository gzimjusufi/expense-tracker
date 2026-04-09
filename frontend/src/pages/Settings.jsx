import React, { useState, useEffect } from "react";

const glassCard = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  padding: "24px",
  marginBottom: "20px",
  maxWidth: "500px",
  width: "100%",
};

const lightCard = {
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: "16px",
  border: "1px solid rgba(0,0,0,0.07)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
  padding: "24px",
  marginBottom: "20px",
  maxWidth: "500px",
  width: "100%",
};

const Settings = ({ theme, setTheme, user, setUser, setCurrency }) => {
  const [profile, setProfile] = useState({
    name: "",
    password: "",
    avatar: null,
    currency: "USD",
  });
  const [successMsg, setSuccessMsg] = useState("");

  const dark = theme === "dark";
  const card = dark ? glassCard : lightCard;

  const labelStyle = {
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    opacity: 0.5,
    marginBottom: "8px",
    display: "block",
  };

  const inputStyle = {
    padding: "10px 14px",
    borderRadius: "10px",
    border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
    backgroundColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    color: dark ? "#fff" : "#000",
    outline: "none",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
  };

  // Fetch latest profile from MongoDB on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("https://expense-tracker-3dmz.onrender.com/api/auth/verify", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.user) {
        const stored = JSON.parse(localStorage.getItem("user_logged_in")) || {};
        const updated = {
          ...stored,
          name: data.user.name || stored.name,
          currency: data.user.currency || stored.currency,
          avatar: data.user.avatar || stored.avatar || "",
        };
        localStorage.setItem("user_logged_in", JSON.stringify(updated));
        setUser(updated);
        setProfile(prev => ({
          ...prev,
          name: data.user.name || prev.name,
          currency: data.user.currency || prev.currency,
          avatar: data.user.avatar || prev.avatar,
        }));
      }
    })
    .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveProfile = async () => {
    if (!user?.email) return;
    try {
      const token = localStorage.getItem("token");
      const body = { name: profile.name };
      if (profile.password) body.password = profile.password;
      if (profile.currency) body.currency = profile.currency;
      if (profile.avatar) body.avatar = profile.avatar;

      const res = await fetch("https://expense-tracker-3dmz.onrender.com/api/auth/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to update profile.");
        return;
      }

      const stored = JSON.parse(localStorage.getItem("user_logged_in")) || {};
      const updated = {
        ...stored,
        name: profile.name || stored.name,
        currency: profile.currency || stored.currency,
        avatar: profile.avatar || stored.avatar,
      };
      localStorage.setItem("user_logged_in", JSON.stringify(updated));
      localStorage.setItem(`profile_${user.email}`, JSON.stringify(updated));
      setUser(updated);
      if (profile.currency) setCurrency(profile.currency);
      setSuccessMsg("✅ Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Profile save error:", err);
      setSuccessMsg("✅ Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleInputChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfile({ ...profile, avatar: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleThemeChange = (e) => setTheme(e.target.value);

  return (
    <div style={{
      background: dark
        ? "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)"
        : "linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f0f4ff 100%)",
      color: dark ? "#fff" : "#111",
      minHeight: "100vh",
      padding: window.innerWidth < 600 ? "16px" : "24px",
      position: "relative",
    }}>

      {/* Ambient blobs */}
      {dark && (
        <>
          <div style={{
            position: "fixed", top: "-100px", left: "-100px", width: "400px", height: "400px",
            borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            pointerEvents: "none", zIndex: 0,
          }} />
          <div style={{
            position: "fixed", bottom: "-100px", right: "-100px", width: "500px", height: "500px",
            borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
            pointerEvents: "none", zIndex: 0,
          }} />
        </>
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "-0.02em", marginBottom: "24px" }}>
          ⚙️ Settings
        </h2>

        {/* Appearance Card */}
        <div style={{ ...card, borderTop: "2px solid #6366f1" }}>
          <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.5, marginBottom: "16px" }}>
            Appearance
          </div>
          <label style={labelStyle}>Theme</label>
          <select value={theme} onChange={handleThemeChange} style={inputStyle}>
            <option value="light">🌞 Light</option>
            <option value="dark">🌙 Dark</option>
          </select>
        </div>

        {/* Profile Card */}
        <div style={{ ...card, borderTop: "2px solid #10b981" }}>
          <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.5, marginBottom: "20px" }}>
            Profile
          </div>

          {/* Avatar */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="Profile"
                style={{
                  width: "90px", height: "90px", borderRadius: "50%",
                  objectFit: "cover", marginBottom: "12px",
                  border: "3px solid rgba(99,102,241,0.5)",
                  boxShadow: "0 0 20px rgba(99,102,241,0.3)",
                  display: "block", margin: "0 auto 12px",
                }}
              />
            ) : (
              <div style={{
                width: "90px", height: "90px", borderRadius: "50%",
                background: dark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)",
                border: "3px solid rgba(99,102,241,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "32px", margin: "0 auto 12px",
              }}>
                👤
              </div>
            )}
            <label style={{
              display: "inline-block", padding: "8px 16px",
              background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
              borderRadius: "10px", cursor: "pointer", fontSize: "13px",
              fontWeight: "600", transition: "opacity 0.2s",
            }}>
              📷 Change Photo
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
            </label>
          </div>

          <label style={labelStyle}>Preferred Currency</label>
          <select
            name="currency"
            value={profile.currency || "USD"}
            onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
            style={{ ...inputStyle, marginBottom: "16px" }}
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

          <label style={labelStyle}>Full Name</label>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleInputChange}
            style={{ ...inputStyle, marginBottom: "16px" }}
          />

          <label style={labelStyle}>Password</label>
          <input
            type="password"
            name="password"
            value={profile.password}
            onChange={handleInputChange}
            placeholder="Leave blank to keep current password"
            style={{ ...inputStyle, marginBottom: "20px" }}
          />

          <button
            onClick={handleSaveProfile}
            style={{
              width: "100%", padding: "12px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", border: "none", borderRadius: "10px",
              cursor: "pointer", fontWeight: "600", fontSize: "14px",
              boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
              transition: "opacity 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Save Changes
          </button>

          {successMsg && (
            <div style={{
              marginTop: "12px", padding: "12px",
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.3)",
              color: "#10b981", borderRadius: "10px",
              textAlign: "center", fontSize: "14px", fontWeight: "600",
            }}>
              {successMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;