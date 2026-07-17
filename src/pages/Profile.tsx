import React, { useEffect, useState } from "react";
import { useAuth } from "../сontext/AuthContext";

interface UserProfile {
  email: string;
  first_name: string;
  last_name: string;
  total_tasks: number;
  completed_tasks: number;
}

export default function Profile() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Состояние для редактирования
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch("http://127.0.0.1:8000/auth/me", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch profile");
        return res.json();
      })
      .then((data: UserProfile) => {
        setProfile(data);
        setFirstName(data.first_name);
        setLastName(data.last_name);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSaving(true);
    fetch("http://127.0.0.1:8000/auth/me", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ first_name: firstName, last_name: lastName }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Save failed");
        alert("Profile saved successfully!");
      })
      .catch((err) => console.error(err))
      .finally(() => setSaving(false));
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading account settings...</div>;
  }

  if (!profile) {
    return (
      <main className="main" style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={cardStyle}>
          <h2 style={{ marginBottom: "10px" }}>🔮 Demo Sandbox Profile</h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            You are currently playing inside the Sandbox without an account. Sign in to unlock permanent cloud storage.
          </p>
        </div>
      </main>
    );
  }

  // Высчитываем букву для аватара (если имя заполнено — берем первую букву имени, иначе — мыла)
  const avatarLetter = firstName ? firstName.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase();

  return (
    <main className="main" style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
      <header style={{ marginBottom: "30px" }}>
        <h1 className="topbar__title" style={{ fontSize: "28px" }}>Account Settings</h1>
        <p style={{ color: "#666", marginTop: "4px" }}>Manage your workspace and credentials</p>
      </header>

      <div style={cardStyle}>
        <div style={profileHeaderStyle}>
          <div style={avatarStyle}>{avatarLetter}</div>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px" }}>
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : profile.email}
            </h3>
            <span style={{ fontSize: "12px", color: "#666" }}>{profile.email}</span>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #ebebea", margin: "20px 0" }} />

        {/* Форма редактирования данных */}
        <h3 style={{ marginBottom: "14px", fontSize: "15px" }}>Personal Information</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>First Name</label>
              <input 
                type="text" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                style={inputStyle}
                placeholder="John"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Last Name</label>
              <input 
                type="text" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                style={inputStyle}
                placeholder="Doe"
              />
            </div>
          </div>
          <button 
            className="btn btn--primary" 
            onClick={handleSave} 
            disabled={saving}
            style={{ alignSelf: "flex-end", padding: "8px 20px", fontSize: "13px" }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #ebebea", margin: "20px 0" }} />

        <h3 style={{ marginBottom: "12px", fontSize: "15px" }}>Workspace Stats</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "30px" }}>
          <div style={miniStatStyle}>
            <span style={{ fontSize: "20px", fontWeight: "bold" }}>{profile.total_tasks}</span>
            <span style={{ fontSize: "12px", color: "#666" }}>Total tasks created</span>
          </div>
          <div style={miniStatStyle}>
            <span style={{ fontSize: "20px", fontWeight: "bold", color: "#2563eb" }}>{profile.completed_tasks}</span>
            <span style={{ fontSize: "12px", color: "#666" }}>Tasks completed</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#a8a8a2" }}>Connected to local FastAPI</span>
          <button className="btn" style={logoutBtnStyle} onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ebebea",
  borderRadius: "14px",
  padding: "30px",
  boxShadow: "0 4px 16px rgba(0,0,0,.04)",
};

const profileHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
};

const avatarStyle: React.CSSProperties = {
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  background: "#2563eb",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  fontWeight: "bold",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: "500",
  color: "#666",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #ebebea",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "13px",
  fontFamily: "inherit",
  background: "#f5f5f3",
  color: "#1a1a18",
  outline: "none",
};

const miniStatStyle: React.CSSProperties = {
  background: "#f5f5f3",
  border: "1px solid #ebebea",
  borderRadius: "8px",
  padding: "12px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const logoutBtnStyle: React.CSSProperties = {
  background: "#fee2e2",
  color: "#dc2626",
  border: "none",
  padding: "8px 16px",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer",
};