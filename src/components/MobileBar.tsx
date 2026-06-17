import React from "react";
import { NAV_ITEMS, PageKey } from "./Sidebar";

interface MobileBarProps {
  activePage: PageKey;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onNavigate: (page: PageKey) => void;
}

export default function MobileBar({
  activePage,
  menuOpen,
  onToggleMenu,
  onNavigate,
}: MobileBarProps) {
  return (
    <>
      <header className="mobile-bar">
        <div className="mobile-bar__logo">
          <span className="mobile-bar__logo-mark">S</span>
          <span className="mobile-bar__logo-text">Salesflow</span>
        </div>
        <button
          className={`mobile-bar__hamburger${menuOpen ? " mobile-bar__hamburger--open" : ""}`}
          onClick={onToggleMenu}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {menuOpen && (
       <div className="mobile-drawer-overlay" onClick={onToggleMenu}>
       <nav className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
         {NAV_ITEMS.map((item) => (
           <button
             key={item.label}
             className={`mobile-drawer__item${activePage === item.label ? " mobile-drawer__item--active" : ""}`}
             onClick={(e) => {
               e.stopPropagation();        
               onNavigate(item.label); 
             }}
           >
             <span className="mobile-drawer__icon">{item.icon}</span>
             <span>{item.label}</span>
           </button>
         ))}
       </nav>
     </div>
      )}
    </>
  );
}