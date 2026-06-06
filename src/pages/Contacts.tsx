import React, { useState } from "react";

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

const INITIAL_CONTACTS: Contact[] = [
  { id: 1, name: "Sarah Chen",    company: "Notion",    email: "schen@notion.so",       status: "Active" },
  { id: 2, name: "James Ford",    company: "Linear",    email: "j.ford@linear.app",      status: "Replied" },
  { id: 3, name: "Maria Rossi",   company: "Figma",     email: "m.rossi@figma.com",      status: "Active" },
  { id: 4, name: "Kevin Park",    company: "Vercel",    email: "kevin@vercel.com",        status: "No Answer" },
  { id: 5, name: "Anya Patel",    company: "Stripe",    email: "a.patel@stripe.com",     status: "Replied" },
  { id: 6, name: "Tom Nakamura",  company: "Supabase",  email: "tom@supabase.io",         status: "Active" },
  { id: 7, name: "Elena Volkova", company: "Loom",      email: "e.volkova@loom.com",     status: "No Answer" },
];

const EMPTY = { name: "", company: "", email: "" };

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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

  const handleAdd = () => {
    if (!form.name.trim() || !form.company.trim() || !form.email.trim()) {
      setError("All fields are required.");
      return;
    }
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    if (!valid) { setError("Enter a valid email."); return; }

    setContacts((prev) => [
      ...prev,
      { id: Date.now(), name: form.name.trim(), company: form.company.trim(), email: form.email.trim(), status: "Active" },
    ]);
    setForm(EMPTY);
    setShowForm(false);
    setError("");
  };

  const handleDelete = (id: number) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const cycleStatus = (id: number) => {
    const order: ContactStatus[] = ["Active", "Replied", "No Answer"];
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const idx = order.indexOf(c.status);
        return { ...c, status: order[(idx + 1) % order.length] };
      })
    );
  };

  return (
    <main className="main">
      <header className="topbar">
        <div className="topbar__left">
          <h1 className="topbar__title">Contacts</h1>
          <span className="topbar__date">Lead database · {contacts.length} contacts</span>
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
            onClick={() => { setShowForm((v) => !v); setError(""); }}
          >
            {showForm ? "✕ Cancel" : "+ Add Contact"}
          </button>
        </div>
      </header>

      {showForm && (
        <div className="contacts-form">
          <input name="name"    placeholder="Full name *"   value={form.name}    onChange={handleChange} className="contacts-form__input" />
          <input name="company" placeholder="Company *"     value={form.company} onChange={handleChange} className="contacts-form__input" />
          <input name="email"   placeholder="Email *"       value={form.email}   onChange={handleChange} className="contacts-form__input" type="email" />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button className="btn btn--primary" onClick={handleAdd}>Add</button>
            {error && <span className="contacts-form__error">⚠ {error}</span>}
          </div>
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
              const s = STATUS_STYLE[c.status];
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