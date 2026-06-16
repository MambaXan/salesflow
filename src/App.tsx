import React, { useState, useCallback, useEffect } from "react";
import { ToastProvider } from "./сontext/ToastContext";
import FeedbackModal from "./components/FeedbackModal/FeedbackModal";
import Analytics from "./pages/Analytics";
import Sequences from "./pages/Sequence";
import "./App.scss";

import Sidebar, { PageKey } from "./components/Sidebar";
import MobileBar from "./components/MobileBar";
import Dashboard from "./pages/Dashboard";
import Pipeline from "./pages/Pipeline";
import Contacts from "./pages/Contacts";

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const navigate = useCallback((page: PageKey) => {
    setActivePage(page);
    setMenuOpen(false);
  }, []);

  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":  return <Dashboard />;
      case "Pipeline":   return <Pipeline />;
      case "Sequences":  return <Sequences />;
      case "Contacts":   return <Contacts />;
      case "Analytics":  return <Analytics />;
    }
  };

  return (
    <ToastProvider>
      <div className="app">
        <MobileBar
          activePage={activePage}
          menuOpen={menuOpen}
          onToggleMenu={toggleMenu}
          onNavigate={navigate}
        />
        <Sidebar activePage={activePage} onNavigate={navigate} onOpenFeedback={() => setIsFeedbackOpen(true)}/>
        {renderPage()}
      </div>
      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />
    </ToastProvider>
  );
}