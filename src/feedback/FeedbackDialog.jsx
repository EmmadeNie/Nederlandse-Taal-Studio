import { useState, useEffect } from "react";
import { FEEDBACK_CATEGORIES, addFeedback } from "./store";
import { useAuth } from "../auth/context";

/**
 * Modal dialog to add feedback for a content item (or the app in general).
 *
 * Props:
 *   itemType  - "word" | "verb" | "sentence" | "topic" | "exercise" | "app"
 *   itemId    - id of the content item (null for general app feedback)
 *   itemLabel - human-readable label shown in the dialog header
 *   onClose   - called when the dialog should close
 */
export default function FeedbackDialog({ itemType, itemId, itemLabel, onClose }) {
  const { profile } = useAuth();
  const [category, setCategory] = useState(
    itemType === "app" ? "app" : "taalfout"
  );
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canSubmit = message.trim().length > 0 && !saving;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await addFeedback({ itemType, itemId, itemLabel, category, message });
      setSaved(true);
      setTimeout(onClose, 700);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fb-overlay" onClick={onClose}>
      <div
        className="fb-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Feedback geven"
      >
        <div className="fb-dialog-header">
          <h3>Feedback geven</h3>
          <button className="fb-close" onClick={onClose} aria-label="Sluiten">
            ✕
          </button>
        </div>

        {itemLabel && (
          <div className="fb-item-ref">
            <span className="dim">Over:</span> <strong>{itemLabel}</strong>
          </div>
        )}

        {saved ? (
          <div className="fb-saved">✓ Bedankt, je feedback is opgeslagen!</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="fb-field fb-known-name">
              <span>
                Feedback van <strong>{profile?.display_name || profile?.email}</strong>
              </span>
            </div>

            <label className="fb-field">
              <span>Soort feedback</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {FEEDBACK_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="fb-field">
              <span>Opmerking</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Wat valt je op?"
                rows={4}
                autoFocus
              />
            </label>

            {error && <div className="auth-error">{error}</div>}

            <div className="fb-actions">
              <button type="button" className="fb-btn-secondary" onClick={onClose}>
                Annuleren
              </button>
              <button
                type="submit"
                className="fb-btn-primary"
                disabled={!canSubmit}
              >
                Opslaan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
