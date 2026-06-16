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

const STAGES: Stage[] = [
  "Lead",
  "Contacted",
  "Meeting Scheduled",
  "Closed Won",
];

const STAGE_COLORS: Record<Stage, string> = {
  Lead: "#a8a8a2",
  Contacted: "#2563eb",
  "Meeting Scheduled": "#d97706",
  "Closed Won": "#16a34a",
};

const API = "http://127.0.0.1:8000/api/deals";

export default function Analytics() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    fetch(API)
      .then((r) => {
        if (!r.ok) throw new Error("Backend offline");
        return r.json();
      })
      .then((data: Deal[]) => {
        setDeals(data);
        setIsDemoMode(false);
      })
      .catch((e) => {
        console.log("Backend offline, switching Analytics to Demo Mode", e);
        setIsDemoMode(true);
        const local = localStorage.getItem("salesflow_deals");
        if (local) {
          setDeals(JSON.parse(local));
        }
      });
  }, []);

  // --- РАСЧЕТ МЕТРИК ---
  const totalDeals = deals.length;

  // 1. Общая сумма закрытых сделок (Won)
  const wonDeals = deals.filter((d) => d.status === "Closed Won");
  const revenue = wonDeals.reduce((sum, d) => sum + Number(d.value), 0);

  // 2. Сумма сделок, которые еще в процессе (Pipeline Value)
  const activeDeals = deals.filter((d) => d.status !== "Closed Won");
  const pipelineValue = activeDeals.reduce(
    (sum, d) => sum + Number(d.value),
    0
  );

  // 3. Конверсия (Процент успешных сделок от общего числа)
  const conversionRate =
    totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;

  // 4. Средний чек закрытой сделки
  const averageDealValue =
    wonDeals.length > 0 ? Math.round(revenue / wonDeals.length) : 0;

  // Хелпер для красивого вывода валюты
  const formatValue = (v: number) => "$" + v.toLocaleString("en-US");

  return (
    <main className="main analytics-main" style={{ padding: "24px" }}>
      <header className="topbar" style={{ marginBottom: "24px" }}>
        <div className="topbar__left">
          <h1 className="topbar__title">Analytics</h1>
          <span className="topbar__date">
            {isDemoMode ? "🔮 Demo Live Insights" : "Real-time performance"}
          </span>
        </div>
      </header>

      {/* СЕТКА С КАРТОЧКАМИ МЕТРИК */}
      <div
        className="analytics-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        <div className="metric-card" style={cardStyle}>
          <span style={metricLabelStyle}>Total Revenue</span>
          <h2
            style={{
              margin: "8px 0 0 0",
              fontSize: "28px",
              fontWeight: 700,
              color: "#16a34a",
            }}
          >
            {formatValue(revenue)}
          </h2>
          <span style={metricSubStyle}>From {wonDeals.length} won deals</span>
        </div>

        <div className="metric-card" style={cardStyle}>
          <span style={metricLabelStyle}>Pipeline Value</span>
          <h2
            style={{
              margin: "8px 0 0 0",
              fontSize: "28px",
              fontWeight: 700,
              color: "#1e3a8a",
            }}
          >
            {formatValue(pipelineValue)}
          </h2>
          <span style={metricSubStyle}>
            {activeDeals.length} active opportunities
          </span>
        </div>

        <div className="metric-card" style={cardStyle}>
          <span style={metricLabelStyle}>Conversion Rate</span>
          <h2
            style={{
              margin: "8px 0 0 0",
              fontSize: "28px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            {conversionRate}%
          </h2>
          <span style={metricSubStyle}>Lead to Won ratio</span>
        </div>

        <div className="metric-card" style={cardStyle}>
          <span style={metricLabelStyle}>Avg Deal Size</span>
          <h2
            style={{
              margin: "8px 0 0 0",
              fontSize: "28px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            {formatValue(averageDealValue)}
          </h2>
          <span style={metricSubStyle}>Per successful contract</span>
        </div>
      </div>

      {/* КРАСИВАЯ СТИЛЬНАЯ ВОРОНКА ПРОДАЖ */}
      <div
        className="analytics-section"
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          padding: "24px",
          maxWidth: "700px",
        }}
      >
        <h3
          style={{
            margin: "0 0 20px 0",
            fontSize: "16px",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Sales Funnel Breakdown
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => d.status === stage);
            const stageValue = stageDeals.reduce(
              (sum, d) => sum + Number(d.value),
              0
            );

            // Вычисляем ширину полосы в зависимости от количества сделок на этапе относительно максимума
            const maxDeals = Math.max(
              ...STAGES.map((s) => deals.filter((d) => d.status === s).length),
              1
            );
            const widthPercent =
              totalDeals > 0
                ? Math.max((stageDeals.length / maxDeals) * 100, 8) // минимум 8% чтобы полоса не была нулевой видимости
                : 8;

            return (
              <div
                key={stage}
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                {/* Название этапа */}
                <div
                  style={{
                    width: "140px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#4b5563",
                  }}
                >
                  {stage}
                </div>

                {/* Интерактивная полоса прогресса */}
                <div
                  style={{
                    flex: 1,
                    background: "#f3f4f6",
                    borderRadius: "6px",
                    height: "32px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${widthPercent}%`,
                      background: STAGE_COLORS[stage],
                      height: "100%",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: "12px",
                      transition: "width 0.4s ease-out",
                    }}
                  >
                    {stageDeals.length > 0 && (
                      <span
                        style={{
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {stageDeals.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Общая сумма денег на этом этапе справа */}
                <div
                  style={{
                    width: "100px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#111827",
                    textAlign: "right",
                  }}
                >
                  {formatValue(stageValue)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

// --- СТИЛИ ДЛЯ ИНЛАЙНА ---
const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
};

const metricLabelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  color: "#6b7280",
};

const metricSubStyle: React.CSSProperties = {
  display: "block",
  marginTop: "6px",
  fontSize: "12px",
  color: "#9ca3af",
};
