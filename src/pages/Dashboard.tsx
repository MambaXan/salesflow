import React, { useState, useEffect } from "react";
import TaskCard, { Task } from "../components/TaskCard";

const API = "http://127.0.0.1:8000/api/tasks";

const TASK_TYPES: Task["type"][] = ["email", "linkedin", "call", "follow-up"];

interface AddTaskForm {
  type: Task["type"];
  title: string;
  contact: string;
  company: string;
  time: string;
}

const EMPTY_FORM: AddTaskForm = {
  type: "email",
  title: "",
  contact: "",
  company: "",
  time: "",
};

// Вкусные дефолтные таски для демо-режима
const DEMO_TASKS: Task[] = [
  {
    id: 201,
    type: "email",
    title: "Write customized intro email with new offer",
    contact: "John Doe",
    company: "Stripe",
    time: "9:30 AM",
    completed: false,
  },
  {
    id: 202,
    type: "linkedin",
    title: "Send connection request with note about their tech stack",
    contact: "Sandra Adams",
    company: "Linear",
    time: "11:00 AM",
    completed: true,
  },
  {
    id: 203,
    type: "call",
    title: "Follow-up call regarding the proposal",
    contact: "Michael Scott",
    company: "Dunder Mifflin",
    time: "2:00 PM",
    completed: false,
  },
  {
    id: 204,
    type: "follow-up",
    title: "Ping via email if no answer on LinkedIn",
    contact: "Naval Ravikant",
    company: "Airchat",
    time: "4:30 PM",
    completed: false,
  },
];

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddTaskForm>(EMPTY_FORM);
  const [submitting] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Инициализация данных тасков
  useEffect(() => {
    fetch(API)
      .then((r) => {
        if (!r.ok) throw new Error("Backend offline");
        return r.json();
      })
      .then((data: Task[]) => {
        setTasks(data);
        setIsDemoMode(false);
      })
      .catch((e) => {
        console.log("Backend offline, switching Dashboard to Demo Mode", e);
        setIsDemoMode(true);

        const local = localStorage.getItem("salesflow_tasks");
        if (local) {
          setTasks(JSON.parse(local));
        } else {
          setTasks(DEMO_TASKS);
          localStorage.setItem("salesflow_tasks", JSON.stringify(DEMO_TASKS));
        }
      });
  }, []);

  // Хелпер для сохранения изменений в localStorage
  const saveToLocal = (newTasks: Task[]) => {
    setTasks(newTasks);
    if (isDemoMode) {
      localStorage.setItem("salesflow_tasks", JSON.stringify(newTasks));
    }
  };

  const toggleTask = (id: number) => {
    if (isDemoMode) {
      const updated = tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      );
      saveToLocal(updated);
    } else {
      fetch(`${API}/${id}`, { method: "PUT" })
        .then((r) => r.json())
        .then(() =>
          setTasks((prev) =>
            prev.map((t) =>
              t.id === id ? { ...t, completed: !t.completed } : t
            )
          )
        )
        .catch((e) => console.error("Error toggling task:", e));
    }
  };

  const deleteTask = (id: number) => {
    if (isDemoMode) {
      const updated = tasks.filter((t) => t.id !== id);
      saveToLocal(updated);
    } else {
      fetch(`${API}/${id}`, { method: "DELETE" })
        .then((r) => r.json())
        .then(() => setTasks((prev) => prev.filter((t) => t.id !== id)))
        .catch((e) => console.error("Error deleting task:", e));
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddTask = (taskData: any) => {
    if (!form.title.trim() || !form.contact.trim()) {
      alert("Task title and Contact name are required.");
      return;
    }

    if (isDemoMode) {
      const fakeNew: Task = {
        id: Date.now(),
        type: taskData.type,
        title: taskData.title.trim(),
        contact: taskData.contact.trim(),
        company: taskData.company.trim() || "Independent",
        time: taskData.time.trim() || "Anytime",
        completed: false,
      };
      saveToLocal([...tasks, fakeNew]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } else {
      fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.task) {
            setTasks((prevTasks) => [...prevTasks, data.task]);
            setForm(EMPTY_FORM);
            setShowForm(false);
          }
        })
        .catch((error) => console.error("Error adding task:", error));
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercentage =
    tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
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
            <span
              className="topbar__badge-dot"
              style={{ backgroundColor: isDemoMode ? "#eab308" : "#2563eb" }}
            />
            {isDemoMode ? "🔮 Demo Sandbox" : "Manual mode"}
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="stats">
        {[
          {
            label: "Emails sent",
            value: String(
              tasks.filter((t) => t.type === "email" && t.completed).length
            ),
            sub: "today",
          },
          { label: "Replies", value: "1", sub: "pending" },
          { label: "Time spent", value: "2.4h", sub: "on outreach" },
          {
            label: "Tasks total",
            value: String(tasks.length),
            sub: "in queue",
            highlight: false,
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`stat-card${s.highlight ? " stat-card--highlight" : ""}`}
            style={{ cursor: "default" }}
          >
            <span className="stat-card__value">{s.value}</span>
            <span className="stat-card__label">{s.label}</span>
            <span className="stat-card__sub">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Task section */}
      <section className="task-section">
        <div className="task-section__header">
          <h2 className="task-section__title">Manual outreach queue</h2>
          <button
            className="btn btn--ghost"
            style={{ fontSize: "12px", padding: "5px 12px" }}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "✕ Cancel" : "+ Add Task"}
          </button>
        </div>

        {/* Inline add form */}
        {showForm && (
          <div
            style={{
              background: "var(--surface, #fff)",
              border: "1px solid var(--border, #ebebea)",
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              boxShadow: "0 4px 16px rgba(0,0,0,.07)",
              animation: "taskIn 0.25s ease both",
            }}
          >
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <select
                name="type"
                value={form.type}
                onChange={handleFormChange}
                style={{
                  border: "1px solid #ebebea",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  background: "#f5f5f3",
                  color: "#1a1a18",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}
                  </option>
                ))}
              </select>
              <input
                name="time"
                placeholder="Time (e.g. 9:00 AM)"
                value={form.time}
                onChange={handleFormChange}
                style={inputStyle}
              />
            </div>
            <input
              name="title"
              placeholder="Task title *"
              value={form.title}
              onChange={handleFormChange}
              style={{ ...inputStyle, width: "100%" }}
            />
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input
                name="contact"
                placeholder="Contact name *"
                value={form.contact}
                onChange={handleFormChange}
                style={{ ...inputStyle, flex: 1 }}
              />
              <input
                name="company"
                placeholder="Company *"
                value={form.company}
                onChange={handleFormChange}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                className={`btn btn--primary${
                  submitting ? " btn--loading" : ""
                }`}
                onClick={() => handleAddTask(form)}
                disabled={submitting}
              >
                {submitting ? <span className="btn__spinner" /> : "Add Task"}
              </button>
            </div>
          </div>
        )}

        <ul className="task-list">
          {tasks.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              index={i}
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          ))}
          {tasks.length === 0 && (
            <li
              style={{
                textAlign: "center",
                padding: "40px",
                color: "#a8a8a2",
                fontSize: "14px",
                background: "#fff",
                borderRadius: "14px",
                border: "1px solid #ebebea",
              }}
            >
              No tasks yet — add your first one above.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid #ebebea",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "13px",
  fontFamily: "inherit",
  background: "#f5f5f3",
  color: "#1a1a18",
  outline: "none",
  minWidth: "0",
};
