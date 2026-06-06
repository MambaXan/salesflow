import React, { useState } from "react";

type Stage = "Lead" | "Contacted" | "Meeting Scheduled" | "Closed Won";

interface Deal {
  id: number;
  contact: string;
  company: string;
  value: number;
  lastAction: string;
  stage: Stage;
}

const STAGES: Stage[] = ["Lead", "Contacted", "Meeting Scheduled", "Closed Won"];

const INITIAL_DEALS: Deal[] = [
  { id: 1,  contact: "Sarah Chen",      company: "Notion",        value: 12000, lastAction: "2025-06-01", stage: "Lead" },
  { id: 2,  contact: "James Ford",      company: "Linear",        value: 8500,  lastAction: "2025-05-30", stage: "Lead" },
  { id: 3,  contact: "Maria Rossi",     company: "Figma",         value: 22000, lastAction: "2025-06-02", stage: "Contacted" },
  { id: 4,  contact: "Kevin Park",      company: "Vercel",        value: 5000,  lastAction: "2025-05-28", stage: "Contacted" },
  { id: 5,  contact: "Anya Patel",      company: "Stripe",        value: 31000, lastAction: "2025-06-03", stage: "Meeting Scheduled" },
  { id: 6,  contact: "Tom Nakamura",    company: "Supabase",      value: 9800,  lastAction: "2025-06-01", stage: "Meeting Scheduled" },
  { id: 7,  contact: "Elena Volkova",   company: "Loom",          value: 14500, lastAction: "2025-05-27", stage: "Closed Won" },
  { id: 8,  contact: "David Osei",      company: "Intercom",      value: 19000, lastAction: "2025-06-04", stage: "Closed Won" },
];

const STAGE_COLORS: Record<Stage, { bg: string; text: string; dot: string }> = {
  "Lead":               { bg: "#f5f5f3",  text: "#6b6b66",  dot: "#a8a8a2" },
  "Contacted":          { bg: "#eff4ff",  text: "#2563eb",  dot: "#2563eb" },
  "Meeting Scheduled":  { bg: "#fff7ed",  text: "#d97706",  dot: "#d97706" },
  "Closed Won":         { bg: "#f0fdf4",  text: "#16a34a",  dot: "#16a34a" },
};

function formatValue(v: number) {
  return "$" + v.toLocaleString("en-US");
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Pipeline() {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);

  const move = (id: number, dir: 1 | -1) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const idx = STAGES.indexOf(d.stage);
        const next = STAGES[idx + dir];
        return next ? { ...d, stage: next } : d;
      })
    );
  };

  const totalValue = deals
    .filter((d) => d.stage === "Closed Won")
    .reduce((s, d) => s + d.value, 0);

  return (
    <main className="main pipeline-main">
      <header className="topbar">
        <div className="topbar__left">
          <h1 className="topbar__title">Pipeline</h1>
          <span className="topbar__date">Deal tracker · {deals.length} deals</span>
        </div>
        <div className="topbar__right">
          <div className="topbar__badge" style={{ borderColor: "#bbf7d0", color: "#16a34a" }}>
            <span className="topbar__badge-dot" style={{ background: "#16a34a" }} />
            Won: {formatValue(totalValue)}
          </div>
        </div>
      </header>

      <div className="kanban">
        {STAGES.map((stage) => {
          const col = deals.filter((d) => d.stage === stage);
          const colValue = col.reduce((s, d) => s + d.value, 0);
          const colors = STAGE_COLORS[stage];
          return (
            <div key={stage} className="kanban__col">
              <div className="kanban__col-header">
                <div className="kanban__col-title">
                  <span
                    className="kanban__col-dot"
                    style={{ background: colors.dot }}
                  />
                  <span>{stage}</span>
                </div>
                <div className="kanban__col-meta">
                  <span className="kanban__col-count">{col.length}</span>
                  <span className="kanban__col-value">{formatValue(colValue)}</span>
                </div>
              </div>

              <div className="kanban__cards">
                {col.map((deal) => {
                  const stageIdx = STAGES.indexOf(deal.stage);
                  return (
                    <div key={deal.id} className="deal-card">
                      <div className="deal-card__header">
                        <div className="deal-card__avatar">
                          {deal.contact.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="deal-card__info">
                          <span className="deal-card__contact">{deal.contact}</span>
                          <span className="deal-card__company">{deal.company}</span>
                        </div>
                      </div>
                      <div className="deal-card__footer">
                        <div className="deal-card__value">{formatValue(deal.value)}</div>
                        <div className="deal-card__date">↻ {formatDate(deal.lastAction)}</div>
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