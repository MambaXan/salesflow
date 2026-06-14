import React from "react";
import FeedbackModal from "./FeedbackModal/FeedbackModal";
import "./FeedbackModal/FeedbackModal.scss"


export type PageKey = "Dashboard" | "Pipeline" | "Sequences" | "Contacts" | "Analytics";

export const NAV_ITEMS: { icon: string; label: PageKey }[] = [
  { icon: "⊞", label: "Dashboard" },
  { icon: "◈", label: "Pipeline" },
  { icon: "✉", label: "Sequences" },
  { icon: "◉", label: "Contacts" },
  { icon: "⟁", label: "Analytics" },
];

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  onOpenFeedback: () => void;
}

export default function Sidebar({ activePage, onNavigate, onOpenFeedback }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <span className="sidebar__logo-mark">S</span>
        <span className="sidebar__logo-text">Salesflow</span>
      </div>
      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={`sidebar__nav-item${activePage === item.label ? " sidebar__nav-item--active" : ""}`}
            onClick={() => onNavigate(item.label)}
          >
            <span className="sidebar__nav-icon">{item.icon}</span>
            <span className="sidebar__nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar__footer">
        <div className="sidebar__avatar">AL</div>
        <div className="sidebar__user">
          <span className="sidebar__user-name">Alex Lee</span>
          <span className="sidebar__user-role">Sales Rep</span>
        </div>
        <button className="feedback-sidebar-btn" onClick={onOpenFeedback}>
          💬 Feedback
        </button>
      </div>
    </aside>
  );
}