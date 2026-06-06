import React from "react";

function StubPage({ title, icon }: { title: string; icon: string }) {
  return (
    <main className="main">
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "80px 40px",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "40px", opacity: 0.25 }}>{icon}</span>
        <h2
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: "26px",
            fontWeight: 400,
            color: "#1a1a18",
            letterSpacing: "-0.3px",
          }}
        >
          {title}
        </h2>
        <p style={{ fontSize: "14px", color: "#a8a8a2", maxWidth: "340px", lineHeight: 1.65 }}>
          This section is under construction. Check back soon — it's coming next.
        </p>
      </div>
    </main>
  );
}

export function Pipeline() {
  return <StubPage title="Pipeline" icon="◈" />;
}

export function Sequences() {
  return <StubPage title="Sequences" icon="✉" />;
}

export function Contacts() {
  return <StubPage title="Contacts" icon="◉" />;
}

export function Analytics() {
  return <StubPage title="Analytics" icon="⟁" />;
}