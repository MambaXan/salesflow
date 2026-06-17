import React, { useState } from "react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      const response = await fetch("https://formspree.io/f/xpqnbvzj", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>
          ✕
        </button>

        <span className="modal__eyebrow">Join the Waitlist</span>
        <h3 className="modal__title">Get Early Access to Salesflow</h3>

        {status !== "success" ? (
          <>
            <p className="modal__body">
              Leave your email below. We'll invite you to the private beta as
              soon as the next slot opens.
            </p>

            <form onSubmit={handleSubmit} className="modal__input-row">
              <input
                type="email"
                required
                placeholder="name@company.com"
                className={`modal__input ${
                  status === "error" ? "modal__input--error" : ""
                }`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                disabled={status === "loading"}
              />
              <button
                type="submit"
                className={`btn btn--modal ${
                  status === "loading" ? "btn--loading" : ""
                }`}
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <span className="btn__spinner" />
                ) : (
                  "Request Invite"
                )}
              </button>
            </form>

            {status === "error" && (
              <span className="modal__error">
                Something went wrong. Please try again.
              </span>
            )}
          </>
        ) : (
          <div className="modal__success">
            <span className="modal__success-icon">🎉</span>
            <div>
              <strong>You're on the list!</strong>
              <p style={{ fontSize: "12px", margin: 0, opacity: 0.8 }}>
                We will reach out to you shortly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
