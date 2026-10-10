import { useState, useEffect } from "react";
import { addFeedback, categoriesFor } from "./store";
import { useAuth } from "../auth/context";
import { useI18n } from "../i18n/context";
import { CheckCircle, X } from "../icons";

/**
 * Modal dialog to add feedback for a content item (or the app in general).
 *
 * Props:
 *   itemType  - "word" | "verb" | "sentence" | "topic" | "exercise" | "lesson" | "zijpad" | "app"
 *   itemId    - id of the content item (null for general app feedback)
 *   itemLabel - human-readable label shown in the dialog header
 *   onClose   - called when the dialog should close
 */
export default function FeedbackDialog({ itemType, itemId, itemLabel, onClose }) {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [category, setCategory] = useState(
    itemType === "app" ? "app" : categoriesFor(itemType)[0]
  );
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Close on Escape
  useEffect(() => {
    // Capture first, so a lesson dialog behind this one stays open.
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
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
        aria-label={t("fb.title")}
      >
        <div className="fb-dialog-header">
          <h3>{t("fb.title")}</h3>
          <button className="fb-close" onClick={onClose} aria-label={t("common.close")}>
            <X />
          </button>
        </div>

        {itemLabel && (
          <div className="fb-item-ref">
            <span className="dim">{t("fb.about")}</span> <strong>{itemLabel}</strong>
          </div>
        )}

        {saved ? (
          <div className="fb-saved"><CheckCircle weight="fill" /> {t("fb.saved")}</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="fb-field fb-known-name">
              <span>
                {t("fb.from")} <strong>{profile?.display_name || profile?.email}</strong>
              </span>
            </div>

            <label className="fb-field">
              <span>{t("fb.kind")}</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categoriesFor(itemType).map((c) => (
                  <option key={c} value={c}>
                    {t(`fb.cat.${c}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="fb-field">
              <span>{t("fb.comment")}</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("fb.placeholder")}
                rows={4}
                autoFocus
              />
            </label>

            {error && <div className="auth-error">{error}</div>}

            <div className="fb-actions">
              <button type="button" className="fb-btn-secondary" onClick={onClose}>
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                className="fb-btn-primary"
                disabled={!canSubmit}
              >
                {t("common.save")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
