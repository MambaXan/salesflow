import React, { useState, useEffect } from "react";
import { useToast } from "../сontext/ToastContext";

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
  value: string;
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

const DEMO_DEALS: Deal[] = [
  { id: 301, contact_name: "Marc Benioff", company: "Salesforce", value: 12500, date: "2026-06-01", status: "Lead" },
  { id: 302, contact_name: "Brian Chesky", company: "Airbnb", value: 45000, date: "2026-06-03", status: "Lead" },
  { id: 303, contact_name: "Patrick Collison", company: "Stripe", value: 25000, date: "2026-06-05", status: "Contacted" },
  { id: 304, contact_name: "Ryan Breslow", company: "Bolt", value: 18000, date: "2026-06-07", status: "Contacted" },
  { id: 305, contact_name: "Dylan Field", company: "Figma", value: 9500, date: "2026-06-08", status: "Meeting Scheduled" },
  { id: 306, contact_name: "Arash Ferdowsi", company: "Dropbox", value: 4200, date: "2026-06-09", status: "Closed Won" },
  { id: 307, contact_name: "Tobias Lütke", company: "Shopify", value: 64000, date: "2026-06-11", status: "Closed Won" }
];

function formatValue(v: number) {
  return "$" + v.toLocaleString("en-US");
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Pipeline() {
  const { addToast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddDealForm>(EMPTY_FORM);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsDemoMode(true);
      const local = localStorage.getItem("salesflow_deals");
      setDeals(local ? JSON.parse(local) : DEMO_DEALS);
      return;
    }

    fetch("http://127.0.0.1:8000/auth/pipeline", {
      headers: getAuthHeaders(),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Backend offline or unauthorized");
        return r.json();
      })
      .then((backendLeads: any[]) => {
        const mappedDeals: Deal[] = backendLeads.map((b: any) => ({
          id: b.id,
          contact_name: b.client_name,
          company: b.company,
          value: b.value,
          date: b.date,
          status: b.stage
        }));
        setDeals(mappedDeals);
        setIsDemoMode(false);
      })
      .catch((e) => {
        console.log("Switching Pipeline to Demo Mode", e);
        setIsDemoMode(true);
        const local = localStorage.getItem("salesflow_deals");
        setDeals(local ? JSON.parse(local) : DEMO_DEALS);
      });
  }, []);

  const saveToLocal = (newDeals: Deal[]) => {
    setDeals(newDeals);
    if (isDemoMode) {
      localStorage.setItem("salesflow_deals", JSON.stringify(newDeals));
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddDeal = (e: React.FormEvent) => {
    e.preventDefault();

    const newDealData = {
      contact_name: form.contact_name.trim(),
      company: form.company.trim(),
      value: Number(form.value) || 0,
      date: new Date().toISOString().split('T')[0],
      status: form.status
    };

    if (isDemoMode) {
      const fakeNew: Deal = { id: Date.now(), ...newDealData };
      saveToLocal([...deals, fakeNew]);
      addToast(`Deal for ${newDealData.company} added to sandbox!`, "success");
      setForm(EMPTY_FORM);
      setShowForm(false);
    } else {
      fetch("http://127.0.0.1:8000/auth/pipeline", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          client_name: newDealData.contact_name,
          company: newDealData.company,
          value: newDealData.value,
          stage: newDealData.status
        }),
      })
        .then(async (r) => {
          if (!r.ok) {
            const errorText = await r.text();
            console.error("Сервер ответил ошибкой:", errorText);
            throw new Error(`Код: ${r.status}. Текст: ${errorText}`);
          }
          return r.json();
        })
        .then((data) => {
          if (data.lead) {
            const addedDeal: Deal = {
              id: data.lead.id,
              contact_name: data.lead.client_name,
              company: data.lead.company,
              value: data.lead.value,
              date: data.lead.date,
              status: data.lead.stage
            };
            setDeals((prev) => [...prev, addedDeal]);
            addToast(`Deal for ${newDealData.company} successfully created!`, "success");
            setForm(EMPTY_FORM);
            setShowForm(false);
          }
        })
        .catch((e) => {
          console.error("Полный лог ошибки добавления сделки:", e);
          addToast("Failed to create deal. Check console.", "error");
        });
    }
  };

  const move = (id: number, dir: 1 | -1) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;
    const idx = STAGES.indexOf(deal.status);
    const next = STAGES[idx + dir];
    if (!next) return;

    if (isDemoMode) {
      const updated = deals.map((d) => (d.id === id ? { ...d, status: next } : d));
      saveToLocal(updated);
      
      if (next === "Closed Won") {
        addToast(`Boom! Deal with ${deal.company} won! 🎉`, "success");
      } else {
        addToast(`Moved to ${next}`);
      }
    } else {
      fetch(`http://127.0.0.1:8000/auth/pipeline/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ stage: next }),
      })
        .then((r) => {
          if (!r.ok) throw new Error("Failed to move deal");
          return r.json();
        })
        .then(() => {
          setDeals((prev) =>
            prev.map((d) => (d.id === id ? { ...d, status: next } : d))
          );
          if (next === "Closed Won") {
            addToast(`Boom! Deal with ${deal.company} won! 🎉`, "success");
          } else {
            addToast(`Moved to ${next}`);
          }
        })
        .catch((e) => {
          console.error("Error updating deal status:", e);
          addToast("Failed to update status", "error");
        });
    }
  };

  const totalValue = deals
    .filter((d) => d.status === "Closed Won")
    .reduce((s, d) => s + Number(d.value), 0);

  return (
    <main className="main pipeline-main">
      <header className="topbar">
        <div className="topbar__left">
          <h1 className="topbar__title">Pipeline</h1>
          <span className="topbar__date">
            {isDemoMode ? "🔮 Demo Sandbox" : "Deal tracker"} · {deals.length} deals
          </span>
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
      {isDemoMode && (
        <div className="demo-banner" style={{
          background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
          border: "1px solid #bfdbfe",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(59, 130, 246, 0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>🚀</span>
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1e40af" }}>
                Welcome to Salesflow Interactive Sandbox!
              </h4>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#1e3a8a", opacity: 0.8 }}>
                Try clicking the <strong>→ arrows</strong> on cards to advance deals, or add a fake new deal to see how seamlessly it tracks.
              </p>
            </div>
          </div>
          <button 
            className="btn" 
            onClick={() => {
              localStorage.removeItem("salesflow_deals");
              setDeals(DEMO_DEALS);
              addToast("Sandbox reset to default data!", "success");
            }}
            style={{
              background: "#ffffff",
              color: "#2563eb",
              border: "1px solid #bfdbfe",
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Reset Demo Data
          </button>
        </div>
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