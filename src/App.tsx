import React, { useState, useEffect, useCallback } from "react";
import "./App.scss";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: number;
  type: "email" | "linkedin" | "call" | "follow-up";
  title: string;
  contact: string;
  company: string;
  time: string;
  completed: boolean; // Добавили поле статуса для TypeScript
}

const TYPE_ICON: Record<Task["type"], string> = {
  email: "✉",
  linkedin: "in",
  call: "◎",
  "follow-up": "↩",
};

const TYPE_LABEL: Record<Task["type"], string> = {
  email: "Email",
  linkedin: "LinkedIn",
  call: "Call",
  "follow-up": "Follow-up",
};

const NAV_ITEMS = [
  { icon: "⊞", label: "Dashboard", active: true },
  { icon: "◈", label: "Pipeline", active: false },
  { icon: "✉", label: "Sequences", active: false },
  { icon: "◉", label: "Contacts", active: false },
  { icon: "⟁", label: "Analytics", active: false },
];

// ─── BetaModal ────────────────────────────────────────────────────────────────

interface BetaModalProps {
  onClose: () => void;
}

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xpqnbvzj";
type SubmitState = "idle" | "loading" | "success" | "error";

function BetaModal({ onClose }: BetaModalProps) {
  const [email, setEmail] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && submitState !== "loading") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, submitState]);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!valid) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setErrorMsg("");
    setSubmitState("loading");

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: trimmed }),
      });

      if (res.ok) {
        setSubmitState("success");
        setTimeout(() => onClose(), 3500);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as any)?.error ?? "Something went wrong. Please try again.");
        setSubmitState("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection.");
      setSubmitState("error");
    }
  };

  const isLoading = submitState === "loading";

  return (
    <div className="modal-overlay" onClick={isLoading ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {!isLoading && (
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
        <p className="modal__eyebrow">🔒 Private Beta</p>
        <h3 className="modal__title">This feature is coming next week!</h3>
        <p className="modal__body">
          Salesflow is currently in private beta. We're building a standalone,
          compliance-safe workspace to help SDRs ditch messy spreadsheets and
          automate manual task generation.
        </p>

        {submitState === "success" ? (
          <div className="modal__success">
            <span className="modal__success-icon">🎉</span>
            <span>Thanks! You're on the list. We'll reach out to you next week.</span>
          </div>
        ) : (
          <>
            <div className="modal__input-row">
              <input
                className={`modal__input${submitState === "error" ? " modal__input--error" : ""}`}
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg("");
                  setSubmitState("idle");
                }}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSubmit()}
                disabled={isLoading}
                autoFocus
              />
              <button
                className={`btn btn--modal${isLoading ? " btn--loading" : ""}`}
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? <span className="btn__spinner" /> : "Get Early Access"}
              </button>
            </div>
            {errorMsg ? (
              <p className="modal__error">{errorMsg}</p>
            ) : (
              <p className="modal__fine">No spam. Unsubscribe anytime.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // 1. Создаем стейт для тасков ВНУТРИ компонента App
  const [tasks, setTasks] = useState<Task[]>([]);

  // 2. Загружаем данные с бэкенда при старте
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/tasks")
      .then(response => response.json())
      .then((data: Task[]) => {
        setTasks(data);
      })
      .catch(error => console.error("Error fetching tasks:", error));
  }, []);

  // 3. Функция клика на "Done" — переключает статус на бэке и на фронте
  const toggleTask = (id: number) => {
    fetch(`http://127.0.0.1:8000/api/tasks/${id}`, {
      method: "PUT",
    })
      .then(response => response.json())
      .then(() => {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
          )
        );
      })
      .catch(error => console.error("Error toggling task:", error));
  };

  const deleteTask = (id: number) => {
    fetch(`http://127.0.0.1:8000/api/tasks/${id}`, {
      method: "DELETE",
    }) 
    .then(response => response.json())
    .then(() => {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    })
    .catch(error => console.error("Error deleting task:" error))
  }

  const openModal = useCallback(() => {
    setModalOpen(true);
    setMenuOpen(false);
  }, []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  // Считаем выполненные задачи для прогресс-бара
  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className="app">
      {/* ── Mobile top-bar ──────────────────────────────────── */}
      <header className="mobile-bar">
        <div className="mobile-bar__logo">
          <span className="mobile-bar__logo-mark">S</span>
          <span className="mobile-bar__logo-text">Salesflow</span>
        </div>
        <button
          className={`mobile-bar__hamburger${menuOpen ? " mobile-bar__hamburger--open" : ""}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {/* ── Mobile drawer ───────────────────────────────────── */}
      {menuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMenuOpen(false)}>
          <nav className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                className={`mobile-drawer__item${item.active ? " mobile-drawer__item--active" : ""}`}
                onClick={item.active ? () => setMenuOpen(false) : openModal}
              >
                <span className="mobile-drawer__icon">{item.icon}</span>
                <span>{item.label}</span>
                {!item.active && <span className="mobile-drawer__lock">🔒</span>}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* ── Sidebar (desktop) ───────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar__logo">
          <span className="sidebar__logo-mark">S</span>
          <span className="sidebar__logo-text">Salesflow</span>
        </div>
        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`sidebar__nav-item${item.active ? " sidebar__nav-item--active" : ""}`}
              onClick={item.active ? undefined : openModal}
            >
              <span className="sidebar__nav-icon">{item.icon}</span>
              <span className="sidebar__nav-label">{item.label}</span>
              {!item.active && <span className="sidebar__nav-lock">🔒</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar__footer">
          <div className="sidebar__avatar">AL</div>
          <div className="sidebar__user">
            <span className="sidebar__user-name">Alex Lee</span>
            <span className="sidebar__user-role">Sales Rep</span>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar__left">
            <h1 className="topbar__title">Today's Tasks</h1>
            <span className="topbar__date">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="topbar__right">
            <div className="topbar__progress">
              <span className="topbar__progress-label">
                {completedCount}/{tasks.length} done
              </span>
              <div className="topbar__progress-bar">
                <div
                  className="topbar__progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            <div className="topbar__badge">
              <span className="topbar__badge-dot" />
              Manual mode
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="stats">
          {[
            { label: "Emails sent", value: "3", sub: "today" },
            { label: "Replies", value: "1", sub: "pending" },
            { label: "Time spent", value: "2.4h", sub: "on outreach" },
            { label: "Time saved*", value: "—", sub: "with Salesflow AI", highlight: true },
          ].map((s) => (
            <button
              key={s.label}
              className={`stat-card${s.highlight ? " stat-card--highlight" : ""}`}
              onClick={openModal}
            >
              <span className="stat-card__value">{s.value}</span>
              <span className="stat-card__label">{s.label}</span>
              <span className="stat-card__sub">{s.sub}</span>
            </button>
          ))}
        </div>

        {/* Task list */}
        <section className="task-section">
          <div className="task-section__header">
            <h2 className="task-section__title">Manual outreach queue</h2>
            <span className="task-section__hint">✦ Click any action to unlock automation</span>
          </div>
          <ul className="task-list">
            {/* Рендерим задачи из динамического стейта tasks */}
            {tasks.map((task, i) => (
              <li
                key={task.id}
                className={`task-item${task.completed ? " task-item--completed" : ""}`} // добавляем класс, если выполнено
                style={{ animationDelay: `${i * 55}ms`, opacity: task.completed ? 0.6 : 1 }}
              >
                <div className={`task-item__type task-item__type--${task.type}`}>
                  <span>{TYPE_ICON[task.type]}</span>
                </div>
                <div className="task-item__body">
                  <div className="task-item__title" style={{ textDecoration: task.completed ? "line-through" : "none" }}>
                    {task.title}
                  </div>
                  <div className="task-item__meta">
                    <span className="task-item__contact">{task.contact}</span>
                    <span className="task-item__sep">·</span>
                    <span className="task-item__company">{task.company}</span>
                    <span className="task-item__sep task-item__sep--hide-mobile">·</span>
                    <span className="task-item__tag task-item__tag--hide-mobile">{TYPE_LABEL[task.type]}</span>
                  </div>
                </div>
                <div className="task-item__time">{task.time}</div>
                <div className="task-item__actions">
                  <button className="btn btn--ghost" onClick={openModal}>
                    Copy Template
                  </button>
                  {/* Кнопка Done теперь вызывает функцию тогла статуса на бэкенде */}
                  <button 
                    className={`btn ${task.completed ? "btn--ghost" : "btn--primary"}`} 
                    onClick={() => toggleTask(task.id)}
                  >
                    {task.completed ? "Undo" : "Done"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* ── Beta Modal ──────────────────────────────────────── */}
      {modalOpen && <BetaModal onClose={closeModal} />}
    </div>
  );
}