import React, { useState, useEffect } from "react";
import TaskCard, { Task } from "../components/TaskCard";

// URL бэкенда для личного кабинета
const API_URL = "http://127.0.0.1:8000/auth/tasks";
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
];

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddTaskForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Хелпер для получения заголовков авторизации
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token"); // Ищем токен из AuthContext
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };
  };

  // Инициализация данных тасков
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.log("No token found. Switching Dashboard to Demo Sandbox");
      setIsDemoMode(true);
      const local = localStorage.getItem("salesflow_tasks");
      setTasks(local ? JSON.parse(local) : DEMO_TASKS);
      return;
    }

    fetch(API_URL, {
      headers: getAuthHeaders(),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Auth failed or backend offline");
        return r.json();
      })
      .then((data: Task[]) => {
        setTasks(data);
        setIsDemoMode(false);
      })
      .catch((e) => {
        console.log("Error loading personal tasks, falling back to Sandbox", e);
        setIsDemoMode(true);
        const local = localStorage.getItem("salesflow_tasks");
        setTasks(local ? JSON.parse(local) : DEMO_TASKS);
      });
  }, []);

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
      // Для личного кабинета шлём PATCH запрос на бэкенд
      fetch(`http://127.0.0.1:8000/auth/tasks/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to toggle task on backend");
          return res.json();
        })
        .then((data) => {
          // Обновляем стейт на фронте, когда бэк подтвердил сохранение
          setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, completed: data.task.completed } : t))
          );
        })
        .catch((e) => console.error("Error toggling task:", e));
    }
  };

  const deleteTask = (id: number) => {
    if (isDemoMode) {
      const updated = tasks.filter((t) => t.id !== id);
      saveToLocal(updated);
    } else {
      // Локально удаляем из списка
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddTask = () => {
    if (!form.title.trim() || !form.contact.trim()) {
      alert("Task title and Contact name are required.");
      return;
    }

    setSubmitting(true);

    const taskPayload = {
      title: form.title.trim(),
      client_name: form.contact.trim(), // сопоставляем с бэкендом (client_name)
      company: form.company.trim() || "Independent",
      type: form.type,
      time: form.time.trim() || "Anytime",
    };

    if (isDemoMode) {
      const fakeNew: Task = {
        id: Date.now(),
        type: form.type,
        title: form.title.trim(),
        contact: form.contact.trim(),
        company: form.company.trim() || "Independent",
        time: form.time.trim() || "Anytime",
        completed: false,
      };
      saveToLocal([...tasks, fakeNew]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setSubmitting(false);
    } else {
      fetch(API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(taskPayload),
      })
        .then((response) => {
          if (!response.ok) throw new Error("Failed to save task");
          return response.json();
        })
        .then((data) => {
          if (data.task) {
            // Маппим прилетевший с бэка task на структуру фронтенда
            const formattedTask: Task = {
              id: data.task.id,
              type: data.task.type,
              title: data.task.title,
              contact: data.task.client_name,
              company: data.task.company,
              time: data.task.time,
              completed: data.task.completed,
            };
            setTasks((prevTasks) => [...prevTasks, formattedTask]);
            setForm(EMPTY_FORM);
            setShowForm(false);
          }
        })
        .catch((error) => console.error("Error adding task:", error))
        .finally(() => setSubmitting(false));
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercentage =
    tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <main className="main">
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
          },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ cursor: "default" }}>
            <span className="stat-card__value">{s.value}</span>
            <span className="stat-card__label">{s.label}</span>
            <span className="stat-card__sub">{s.sub}</span>
          </div>
        ))}
      </div>

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

        {showForm && (
          <div style={formContainerStyle}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <select
                name="type"
                value={form.type}
                onChange={handleFormChange}
                style={selectStyle}
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
                className="btn btn--primary"
                onClick={handleAddTask}
                disabled={submitting}
              >
                {submitting ? "Adding..." : "Add Task"}
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
            <li style={emptyStateStyle}>
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

const selectStyle: React.CSSProperties = {
  border: "1px solid #ebebea",
  borderRadius: "8px",
  padding: "8px 10px",
  fontSize: "13px",
  fontFamily: "inherit",
  background: "#f5f5f3",
  color: "#1a1a18",
  outline: "none",
  cursor: "pointer",
};

const formContainerStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ebebea",
  borderRadius: "14px",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  boxShadow: "0 4px 16px rgba(0,0,0,.07)",
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "40px",
  color: "#a8a8a2",
  fontSize: "14px",
  background: "#fff",
  borderRadius: "14px",
  border: "1px solid #ebebea",
};