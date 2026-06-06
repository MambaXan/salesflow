import React, { useState } from "react";

export interface Task {
  id: number;
  type: "email" | "linkedin" | "call" | "follow-up";
  title: string;
  contact: string;
  company: string;
  time: string;
  completed: boolean;
}

const TYPE_ICON: Record<Task["type"], string> = {
  email: "✉",
  linkedin: "in",
  call: "◎",
  "follow-up": "↩",
};

const TYPE_LABEL: Record<Task["type"], string> = {
  email: "Email",
  linkedin: "LinkedIn",
  call: "Call",
  "follow-up": "Follow-up",
};

const TEMPLATES: Record<Task["type"], (task: Task) => string> = {
  email: (t) =>
    `Hi ${t.contact},\n\nI came across ${t.company} and wanted to reach out — I think we could add real value for your team.\n\nWould you be open to a quick 15-minute call this week?\n\nBest,\nAlex`,
  linkedin: (t) =>
    `Hi ${t.contact}, I noticed your work at ${t.company} and wanted to connect. I'd love to share how we're helping similar teams — would you be open to a quick chat?`,
  call: (t) =>
    `Call script for ${t.contact} @ ${t.company}:\n\n1. Intro & rapport (30s)\n2. Pain point discovery: "What's your biggest challenge with outreach right now?"\n3. Brief pitch (60s)\n4. CTA: Book follow-up`,
  "follow-up": (t) =>
    `Hi ${t.contact},\n\nJust following up on my previous message — I wanted to make sure it didn't get lost in your inbox.\n\nStill happy to show you how we help teams like ${t.company} save hours every week.\n\nBest,\nAlex`,
};

interface TaskCardProps {
  task: Task;
  index: number;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function TaskCard({ task, index, onToggle, onDelete }: TaskCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyTemplate = async () => {
    const text = TEMPLATES[task.type](task);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for browsers that block clipboard without user gesture
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <li
      className={`task-item${task.completed ? " task-item--completed" : ""}`}
      style={{ animationDelay: `${index * 55}ms`, opacity: task.completed ? 0.6 : 1 }}
    >
      <div className={`task-item__type task-item__type--${task.type}`}>
        <span>{TYPE_ICON[task.type]}</span>
      </div>
      <div className="task-item__body">
        <div
          className="task-item__title"
          style={{ textDecoration: task.completed ? "line-through" : "none" }}
        >
          {task.title}
        </div>
        <div className="task-item__meta">
          <span className="task-item__contact">{task.contact}</span>
          <span className="task-item__sep">·</span>
          <span className="task-item__company">{task.company}</span>
          <span className="task-item__sep task-item__sep--hide-mobile">·</span>
          <span className="task-item__tag task-item__tag--hide-mobile">
            {TYPE_LABEL[task.type]}
          </span>
        </div>
      </div>
      <div className="task-item__time">{task.time}</div>
      <div className="task-item__actions">
        <button className="btn btn--ghost" onClick={handleCopyTemplate}>
          {copied ? "✓ Copied" : "Copy Template"}
        </button>
        <button
          className={`btn ${task.completed ? "btn--ghost" : "btn--primary"}`}
          onClick={() => onToggle(task.id)}
        >
          {task.completed ? "Undo" : "Done"}
        </button>
        <button
          className="btn btn--ghost"
          style={{ color: "#ff4d4f" }}
          onClick={() => onDelete(task.id)}
        >
          ✕
        </button>
      </div>
    </li>
  );
}