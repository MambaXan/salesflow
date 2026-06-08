import React, { useState, useEffect } from "react";

type Stage = "Lead" | "Contacted" | "Meeting Scheduled" | "Closed Won";

interface Deal {
  id: number;
  contact_name: string;
  company: string;
  value: number;
  date: string;
  status: Stage;
}

interface AddDealForm {
  contact_name: string;
  company: string;
  value: string; // Строка для инпута, потом приведем к числу
  status: Stage;
}

const STAGES: Stage[] = ["Lead", "Contacted", "Meeting Scheduled", "Closed Won"];

const STAGE_COLORS: Record<Stage, { bg: string; text: string; dot: string }> = {
  "Lead":               { bg: "#f5f5f3",  text: "#6b6b66",  dot: "#a8a8a2" },
  "Contacted":          { bg: "#eff4ff",  text: "#2563eb",  dot: "#2563eb" },
  "Meeting Scheduled":  { bg: "#fff7ed",  text: "#d97706",  dot: "#d97706" },
  "Closed Won":         { bg: "#f0fdf4",  text: "#16a34a",  dot: "#16a34a" },
};

const EMPTY_FORM: AddDealForm = {
  contact_name: "",
  company: "",
  value: "",
  status: "Lead",
};

const API = "http://127.0.0.1:8000/api/deals";

function formatValue(v: number) {
  return "$" + v.toLocaleString("en-US");
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Pipeline() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddDealForm>(EMPTY_FORM);

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((data: Deal[]) => setDeals(data))
      .catch((e) => console.error("Error fetching deals:", e));
  }, []);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddDeal = (e: React.FormEvent) => {
    e.preventDefault();

    const dealData = {
      contact_name: form.contact_name,
      company: form.company,
      value: form.value, // Бэк распарсит строку в число, либо передаст как есть
      date: new Date().toISOString().split('T')[0], // Сегодняшняя дата ГГГГ-ММ-ДД
      status: form.status
    };

    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dealData),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.deal) {
          setDeals((prev) => [...prev, data.deal]);
          setForm(EMPTY_FORM);
          setShowForm(false);
        }
      })
      .catch((e) => console.error("Error adding deal:", e));
  };

  const move = (id: number, dir: 1 | -1) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;
    const idx = STAGES.indexOf(deal.status);
    const next = STAGES[idx + dir];
    if (!next) return;

    fetch(`${API}/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
      .then((r) => r.json())
      .then(() =>
        setDeals((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: next } : d))
        )
      )
      .catch((e) => console.error("Error updating deal status:", e));
  };

  const totalValue = deals
    .filter((d) => d.status === "Closed Won")
    .reduce((s, d) => s + Number(d.value), 0);

  return (
    <main className="main pipeline-main">
      <header className="topbar">
        <div className="topbar__left">
          <h1 className="topbar__title">Pipeline</h1>
          <span className="topbar__date">Deal tracker · {deals.length} deals</span>
        </div>
        <div className="topbar__right" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div className="topbar__badge" style={{ borderColor: "#bbf7d0", color: "#16a34a" }}>
            <span className="topbar__badge-dot" style={{ background: "#16a34a" }} />
            Won: {formatValue(totalValue)}
          </div>
          <button className="btn btn--primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ New Deal"}
          </button>
        </div>
      </header>

      {/* ФОРМА СОЗДАНИЯ СДЕЛКИ */}
      {showForm && (
        <form onSubmit={handleAddDeal} className="task-form" style={{ marginBottom: "24px", maxWidth: "500px" }}>
          <div className="task-form__group">
            <label className="task-form__label">Contact Name</label>
            <input
              type="text"
              name="contact_name"
              className="task-form__input"
              value={form.contact_name}
              onChange={handleFormChange}
              required
              placeholder="e.g. John Doe"
            />
          </div>
          <div className="task-form__group">
            <label className="task-form__label">Company</label>
            <input
              type="text"
              name="company"
              className="task-form__input"
              value={form.company}
              onChange={handleFormChange}
              required
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div className="task-form__group">
            <label className="task-form__label">Deal Value ($)</label>
            <input
              type="number"
              name="value"
              className="task-form__input"
              value={form.value}
              onChange={handleFormChange}
              required
              placeholder="e.g. 5000"
            />
          </div>
          <div className="task-form__group">
            <label className="task-form__label">Stage</label>
            <select
              name="status"
              className="task-form__select"
              value={form.status}
              onChange={handleFormChange}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn--primary">Add Deal</button>
        </form>
      )}

      <div className="kanban">
        {STAGES.map((stage) => {
          const col = deals.filter((d) => d.status === stage);
          const colValue = col.reduce((s, d) => s + Number(d.value), 0);
          const colors = STAGE_COLORS[stage];
          return (
            <div key={stage} className="kanban__col">
              <div className="kanban__col-header">
                <div className="kanban__col-title">
                  <span className="kanban__col-dot" style={{ background: colors.dot }} />
                  <span>{stage}</span>
                </div>
                <div className="kanban__col-meta">
                  <span className="kanban__col-count">{col.length}</span>
                  <span className="kanban__col-value">{formatValue(colValue)}</span>
                </div>
              </div>

              <div className="kanban__cards">
                {col.map((deal) => {
                  const stageIdx = STAGES.indexOf(deal.status);
                  const avatarText = deal.contact_name 
                    ? deal.contact_name.split(" ").map((n) => n[0]).join("").toUpperCase()
                    : "?";
                  return (
                    <div key={deal.id} className="deal-card">
                      <div className="deal-card__header">
                        <div className="deal-card__avatar">{avatarText}</div>
                        <div className="deal-card__info">
                          <span className="deal-card__contact">{deal.contact_name}</span>
                          <span className="deal-card__company">{deal.company}</span>
                        </div>
                      </div>
                      <div className="deal-card__footer">
                        <div className="deal-card__value">{formatValue(Number(deal.value))}</div>
                        <div className="deal-card__date">↻ {formatDate(deal.date)}</div>
                      </div>
                      <div className="deal-card__actions">
                        <button
                          className="deal-card__move"
                          disabled={stageIdx === 0}
                          onClick={() => move(deal.id, -1)}
                          title="Move back"
                        >
                          ←
                        </button>
                        <button
                          className="deal-card__move deal-card__move--fwd"
                          disabled={stageIdx === STAGES.length - 1}
                          onClick={() => move(deal.id, 1)}
                          title="Move forward"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  );
                })}
                {col.length === 0 && (
                  <div className="kanban__empty">No deals</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}