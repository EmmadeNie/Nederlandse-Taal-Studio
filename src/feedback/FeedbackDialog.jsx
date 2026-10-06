import { useState, useEffect } from "react";
import {
  FEEDBACK_CATEGORIES,
  addFeedback,
  getReviewerName,
  setReviewerName,
} from "./store";

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
  const knownName = getReviewerName();
  const [name, setName] = useState(knownName);
  // Only show the name field if we don't know the reviewer yet, or they choose to change it.
  const [editingName, setEditingName] = useState(!knownName);
  const [category, setCategory] = useState(
    itemType === "app" ? "app" : "taalfout"
  );
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canSubmit = message.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (name.trim()) setReviewerName(name);
    addFeedback({ itemType, itemId, itemLabel, category, message });
    setSaved(true);
    setTimeout(onClose, 700);
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
            {editingName ? (
              <label className="fb-field">
                <span>Je naam</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bijv. Mama"
                  autoFocus
                />
              </label>
            ) : (
              <div className="fb-field fb-known-name">
                <span>
                  Feedback van <strong>{knownName}</strong>
                </span>
                <button
                  type="button"
                  className="fb-link"
                  onClick={() => {
                    setEditingName(true);
                    setName("");
                  }}
                >
                  Ik ben iemand anders
                </button>
              </div>
            )}

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
                autoFocus={!editingName}
              />
            </label>

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
