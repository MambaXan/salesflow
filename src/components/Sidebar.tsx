import React from "react";
import { useAuth } from "../сontext/AuthContext";

// 1. Добавили "Profile" в доступные вкладки
export type PageKey =
  | "Dashboard"
  | "Pipeline"
  | "Contacts"
  | "Sequences"
  | "Analytics"
  | "Profile";

// 2. Добавили Profile в массив навигации (если хочешь видеть его в общем списке)
export const NAV_ITEMS: { label: PageKey; icon: string }[] = [
  { label: "Dashboard", icon: "📊" },
  { label: "Pipeline", icon: "🛣️" },
  { label: "Contacts", icon: "👥" },
  { label: "Sequences", icon: "📧" },
  { label: "Analytics", icon: "📈" },
];

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  onOpenFeedback: () => void;
  onOpenAuth: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  onOpenFeedback,
  onOpenAuth,
}) => {
  const { isAuthenticated, userEmail, logout } = useAuth();

  const getInitials = (email: string | null) => {
    if (!email) return "??";
    const namePart = email.split("@")[0];
    if (namePart.length >= 2) {
      return namePart.substring(0, 2).toUpperCase();
    }
    return namePart.substring(0, 1).toUpperCase();
  };

  return (
    <div className="sidebar">
      {/* Логотип */}
      <div className="sidebar__logo" onClick={() => onNavigate("Dashboard")} style={{ cursor: "pointer" }}>
        <span className="logo-icon">⚡</span>
        <span className="logo-text">Salesflow</span>
      </div>

      {/* Навигация */}
      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={`sidebar__nav-item ${
              activePage === item.label ? "active" : ""
            }`}
            onClick={() => onNavigate(item.label)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Футер */}
      <div className="sidebar__footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', padding: '10px' }}>
        {isAuthenticated ? (
          <div className="sidebar__user-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Клик по блоку пользователя теперь переводит на страницу Профиля */}
            <div 
              className={`sidebar__user-info ${activePage === "Profile" ? "active" : ""}`} 
              onClick={() => onNavigate("Profile")}
              style={{ 
                cursor: "pointer", 
                padding: "6px", 
                borderRadius: "8px",
                background: activePage === "Profile" ? "#f3f4f6" : "transparent"
              }}
            >
              <div className="sidebar__avatar">{getInitials(userEmail)}</div>
              <div className="sidebar__user">
                <span className="sidebar__user-name" title={userEmail || ''}>
                  {userEmail ? userEmail.split('@')[0] : 'User'}
                </span>
                <span className="sidebar__user-role">⚙️ Settings</span>
              </div>
            </div>
            
            <button 
              onClick={logout}
              style={{ width: '100%', padding: '8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              🚪 Sign Out
            </button>
          </div>
        ) : (
          <button 
            onClick={onOpenAuth}
            style={{ width: '100%', padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            🔑 Sign In
          </button>
        )}

        <button 
          onClick={onOpenFeedback}
          style={{ width: '100%', padding: '8px', background: '#1f2937', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
        >
          💬 Feedback
        </button>
      </div>
    </div>
  );
};

export default Sidebar;