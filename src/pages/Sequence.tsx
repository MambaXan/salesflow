import React, { useState, useEffect } from "react";

interface Sequence {
  id: number;
  title: string;
  stepsCount: number;
  activeLeads: number;
  openRate: number;
  ctr: number;
  status: "Running" | "Paused";
}

const DEMO_SEQUENCES: Sequence[] = [
  {
    id: 201,
    title: "Inbound Leads - Tech Founders",
    stepsCount: 4,
    activeLeads: 142,
    openRate: 68,
    ctr: 22,
    status: "Running",
  },
  {
    id: 202,
    title: "Outbound - Tier 1 Enterprise",
    stepsCount: 3,
    activeLeads: 45,
    openRate: 52,
    ctr: 14,
    status: "Running",
  },
  {
    id: 203,
    title: "Follow-up: Post-Demo Dropouts",
    stepsCount: 5,
    activeLeads: 89,
    openRate: 71,
    ctr: 31,
    status: "Paused",
  },
];

export default function Sequences() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(true); // Для демо всегда true, пока нет эндпоинта

  useEffect(() => {
    // Сразу пишем логику под демо-режим, проверяя локальное хранилище
    const local = localStorage.getItem("salesflow_sequences");
    if (local) {
      setSequences(JSON.parse(local));
    } else {
      setSequences(DEMO_SEQUENCES);
      localStorage.setItem(
        "salesflow_sequences",
        JSON.stringify(DEMO_SEQUENCES)
      );
    }
  }, []);

  const saveToLocal = (updated: Sequence[]) => {
    setSequences(updated);
    localStorage.setItem("salesflow_sequences", JSON.stringify(updated));
  };

  // Переключение статуса цепочки (Запущена / Пауза)
  const toggleStatus = (id: number) => {
    const updated = sequences.map((s) => {
      if (s.id !== id) return s;
      return {
        ...s,
        status:
          s.status === "Running" ? ("Paused" as const) : ("Running" as const),
      };
    });
    saveToLocal(updated);
  };

  return (
    <main className="main sequences-main" style={{ padding: "24px" }}>
      <header className="topbar" style={{ marginBottom: "24px" }}>
        <div className="topbar__left">
          <h1 className="topbar__title">Email Sequences</h1>
          <span className="topbar__date">
            🔮 Demo Campaigns · {sequences.length} automation sequences
          </span>
        </div>
      </header>

      {/* ИНСТРУКЦИЯ ДЛЯ ЮЗЕРА */}
      <div
        className="demo-banner"
        style={{
          background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
          border: "1px solid #fed7aa",
          borderRadius: "12px",
          padding: "14px 20px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 2px 8px rgba(217, 119, 6, 0.03)",
        }}
      >
        <span style={{ fontSize: "24px" }}>✉️</span>
        <div>
          <h4
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 600,
              color: "#9a3412",
            }}
          >
            Email Automation Sandbox
          </h4>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "13px",
              color: "#7c2d12",
              opacity: 0.8,
            }}
          >
            Click the status badge (e.g. <strong>Running</strong>) on any email
            campaign to simulate pausing or resuming the outbound outreach.
          </p>
        </div>
      </div>

      {/* СПИСОК ЦЕПОЧЕК */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {sequences.map((seq) => (
          <div
            key={seq.id}
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div>
              <h3
                style={{
                  margin: "0 0 6px 0",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {seq.title}
              </h3>
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                <span>📋 {seq.stepsCount} steps</span>
                <span>👥 {seq.activeLeads} active leads</span>
              </div>
            </div>

            {/* МЕТРИКИ ЭФФЕКТИВНОСТИ */}
            <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                {/* Строка 108 */}
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                  }}
                >
                  OPEN RATE
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {seq.openRate}%
                </span>
              </div>
              <div style={{ textAlign: "center" }}>
                {/* Строка 112 */}
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                  }}
                >
                  CTR
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {seq.ctr}%
                </span>
              </div>

              {/* ПЕРЕКЛЮЧАТЕЛЬ СТАТУСА */}
              <button
                onClick={() => toggleStatus(seq.id)}
                style={{
                  background: seq.status === "Running" ? "#f0fdf4" : "#f3f4f6",
                  color: seq.status === "Running" ? "#16a34a" : "#4b5563",
                  border: `1px solid ${
                    seq.status === "Running" ? "#bbf7d0" : "#e5e7eb"
                  }`,
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  minWidth: "85px",
                  textAlign: "center",
                  transition: "all 0.2s",
                }}
              >
                {seq.status === "Running" ? "● Running" : "○ Paused"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
