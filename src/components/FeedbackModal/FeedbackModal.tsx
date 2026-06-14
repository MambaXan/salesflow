import React, { useState } from "react";
import "./FeedbackModal.scss"; 
import { useToast } from "../../сontext/ToastContext";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { addToast } = useToast();
  const [text, setText] = useState("");
  const [type, setType] = useState<"idea" | "bug">("idea");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSending(true);

    setTimeout(() => {
      const savedFeedback = JSON.parse(localStorage.getItem("salesflow_feedback") || "[]");
      savedFeedback.push({
        id: Date.now(),
        type,
        text: text.trim(),
        date: new Date().toISOString()
      });
      localStorage.setItem("salesflow_feedback", JSON.stringify(savedFeedback));

      addToast(
        type === "idea" 
          ? "Thanks for your feedback! Idea captured ✨" 
          : "Bug report submitted. We are on it! 🛠️", 
        "success"
      );

      setText("");
      setIsSending(false);
      onClose(); // Закрываем
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="feedback-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-modal__header">
          <h3>Share Feedback</h3>
          <button className="feedback-modal__close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="feedback-modal__form">
          <div className="feedback-modal__tabs">
            <button
              type="button"
              className={`feedback-modal__tab ${type === "idea" ? "active" : ""}`}
              onClick={() => setType("idea")}
            >
              💡 Idea / Suggestion
            </button>
            <button
              type="button"
              className={`feedback-modal__tab ${type === "bug" ? "active" : ""}`}
              onClick={() => setType("bug")}
            >
              🪲 Report a Bug
            </button>
          </div>

          <textarea
            className="feedback-modal__textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={type === "idea" ? "What feature is missing? How can we improve?" : "Describe what went wrong..."}
            required
            rows={4}
          />

          <button type="submit" className="btn btn--primary" disabled={isSending}>
            {isSending ? "Sending..." : "Submit Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}