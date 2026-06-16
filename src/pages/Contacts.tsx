import React, { useState, useEffect } from "react";

type ContactStatus = "Active" | "Replied" | "No Answer";

interface Contact {
  id: number;
  name: string;
  company: string;
  email: string;
  status: ContactStatus;
}

const STATUS_STYLE: Record<ContactStatus, { bg: string; color: string }> = {
  "Active":    { bg: "#eff4ff", color: "#2563eb" },
  "Replied":   { bg: "#f0fdf4", color: "#16a34a" },
  "No Answer": { bg: "#f5f5f3", color: "#6b6b66" },
};

const API = "http://127.0.0.1:8000/api/contacts";
const EMPTY = { name: "", company: "", email: "" };

// Дефолтные данные для демо-режима, чтобы юзер сразу видел красивую заполненную базу
const DEMO_CONTACTS: Contact[] = [
  { id: 101, name: "Marc Benioff", company: "Salesforce", email: "marc@salesforce.com", status: "Active" },
  { id: 102, name: "Brian Chesky", company: "Airbnb", email: "brian@airbnb.com", status: "Active" },
  { id: 103, name: "Patrick Collison", company: "Stripe", email: "patrick@stripe.com", status: "Replied" },
  { id: 104, name: "Dylan Field", company: "Figma", email: "dylan@figma.com", status: "Replied" },
  { id: 105, name: "Tobias Lütke", company: "Shopify", email: "tobi@shopify.com", status: "No Answer" },
  { id: 106, name: "Michael Scott", company: "Dunder Mifflin", email: "michael@dundermifflin.com", status: "No Answer" }
];

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Инициализация данных
  useEffect(() => {
    fetch(API)
      .then((r) => {
        if (!r.ok) throw new Error("Backend error");
        return r.json();
      })
      .then((data: Contact[]) => {
        setContacts(data);
        setIsDemoMode(false);
      })
      .catch((e) => {
        console.log("Backend offline, switching to Demo Mode (localStorage)", e);
        setIsDemoMode(true);
        // Загружаем из localStorage или берем дефолтные
        const local = localStorage.getItem("salesflow_contacts");
        if (local) {
          setContacts(JSON.parse(local));
        } else {
          setContacts(DEMO_CONTACTS);
          localStorage.setItem("salesflow_contacts", JSON.stringify(DEMO_CONTACTS));
        }
      });
  }, []);

  // Хелпер для сохранения изменений в демо-режиме
  const saveToLocal = (newContacts: Contact[]) => {
    setContacts(newContacts);
    if (isDemoMode) {
      localStorage.setItem("salesflow_contacts", JSON.stringify(newContacts));
    }
  };

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.company.trim() || !form.email.trim()) {
      setError("All fields are required.");
      return;
    }
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    if (!valid) { setError("Enter a valid email."); return; }

    const newContactData = {
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email.trim(),
      status: "Active" as ContactStatus,
    };

    if (isDemoMode) {
      // Локальное создание без бэка
      const fakeNew: Contact = { id: Date.now(), ...newContactData };
      saveToLocal([...contacts, fakeNew]);
      setForm(EMPTY);
      setShowForm(false);
      setError("");
    } else {
      // Обычный запрос на рабочий бэк
      try {
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newContactData),
        });
        const data = await res.json();
        setContacts((prev) => [...prev, data.contact]);
        setForm(EMPTY);
        setShowForm(false);
        setError("");
      } catch (e) {
        console.error("Error adding contact, falling back to local:", e);
        setError("Failed to save. Check your connection.");
      }
    }
  };

  const handleDelete = (id: number) => {
    if (isDemoMode) {
      const updated = contacts.filter((c) => c.id !== id);
      saveToLocal(updated);
    } else {
      fetch(`${API}/${id}`, { method: "DELETE" })
        .then(() => setContacts((prev) => prev.filter((c) => c.id !== id)))
        .catch((e) => console.error("Error deleting contact:", e));
    }
  };

  const cycleStatus = (id: number) => {
    const order: ContactStatus[] = ["Active", "Replied", "No Answer"];
    const updated = contacts.map((c) => {
      if (c.id !== id) return c;
      const idx = order.indexOf(c.status);
      return { ...c, status: order[(idx + 1) % order.length] };
    });

    if (isDemoMode) {
      saveToLocal(updated);
    } else {
      setContacts(updated);
    }
  };

  return (
    <main className="main">
      <header className="topbar">
        <div className="topbar__left">
          <h1 className="topbar__title">Contacts</h1>
          <span className="topbar__date">
            {isDemoMode ? "🔮 Demo Database (Sandbox)" : "Lead database"} · {contacts.length} contacts
          </span>
        </div>
        <div className="topbar__right" style={{ gap: "10px" }}>
          <input
            className="contacts-search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="btn btn--primary"
            style={{ fontSize: "13px", padding: "7px 14px" }}
            onClick={() => { setShowForm((v) => !v); setError(""); setForm(EMPTY); }}
          >
            {showForm ? "✕ Cancel" : "+ Add Contact"}
          </button>
        </div>
      </header>

      {showForm && (
        <div className="contacts-form">
          <input name="name"    placeholder="Full name *"   value={form.name}    onChange={handleChange} className="contacts-form__input" />
          <input name="company" placeholder="Company *"     value={form.company} onChange={handleChange} className="contacts-form__input" />
          <input name="email"   placeholder="Email *"       value={form.email}   onChange={handleChange} className="contacts-form__input" type="email"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button className="btn btn--primary" onClick={handleAdd}>Add</button>
            {error && <span className="contacts-form__error">⚠ {error}</span>}
          </div>
        </div>
      )}
      {isDemoMode && (
        <div className="demo-banner" style={{
          background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", // Сделаем его нежно-зеленым для разнообразия
          border: "1px solid #bbf7d0",
          borderRadius: "12px",
          padding: "14px 20px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(22, 163, 74, 0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>⚡</span>
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#166534" }}>
                Lead & Contact Database Sandbox
              </h4>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#14532d", opacity: 0.8 }}>
                Click on any <strong>Status badge</strong> (e.g. Active) inside the table to cycle through lead response stages on the fly.
              </p>
            </div>
          </div>
          <button 
            className="btn" 
            onClick={() => {
              localStorage.removeItem("salesflow_contacts");
              setContacts(DEMO_CONTACTS);
            }}
            style={{
              background: "#ffffff",
              color: "#16a34a",
              border: "1px solid #bbf7d0",
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Reset Table
          </button>
        </div>
      )}

      <div className="contacts-table-wrap">
        <table className="contacts-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const s = STATUS_STYLE[c.status] || STATUS_STYLE["Active"];
              return (
                <tr key={c.id} className="contacts-table__row">
                  <td className="contacts-table__name">{c.name}</td>
                  <td className="contacts-table__company">{c.company}</td>
                  <td className="contacts-table__email">{c.email}</td>
                  <td>
                    <button
                      className="contacts-status"
                      style={{ background: s.bg, color: s.color }}
                      onClick={() => cycleStatus(c.id)}
                      title="Click to cycle status"
                    >
                      {c.status}
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn btn--ghost contacts-delete"
                      onClick={() => handleDelete(c.id)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="contacts-table__empty">
                  No contacts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}