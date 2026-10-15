import { useState } from "react";
import { useAuth } from "../auth/context";
import { useI18n } from "../i18n/context";
import { Dialog } from "../leerpad/shared";
import { hiddenSentences, setHiddenSentences } from "../data";
import { Flag } from "../icons";
import { flagItem } from "./api";
import "./review.css";

/**
 * 🚩 on a sentence, word or verb, for the docent: "Weghalen" or "Aanpassen"
 * plus a remark. It lands under Opmerkingen bij zinnen en woorden (Feedback);
 * "weghalen" also takes it out of the exercises right away. Clicks stay inside
 * (cards around it open on click).
 */
export default function FlagButton({ item, sentence = item }) {
  const { t } = useI18n();
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);
  if (role !== "docent" || !sentence?.id) return null;

  const close = () => {
    setOpen(false);
    setKind(null);
    setComment("");
    setError(null);
  };
  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await flagItem({ itemId: sentence.id, kind, comment: comment.trim() });
      if (kind === "weghalen") setHiddenSentences([...hiddenSentences, sentence.id]);
      setDone(kind);
      close();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="flag-wrap" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={`flag-btn ${done ? "is-flagged" : ""}`}
        title={done ? t(`flag.done.${done}`) : t("flag.hint")}
        aria-label={t("flag.aria", { text: sentence.nl })}
        onClick={() => setOpen(true)}
      >
        <Flag weight={done ? "fill" : "regular"} aria-hidden="true" />
      </button>
      {open && (
        <Dialog title={sentence.id.startsWith("sentence.") ? t("flag.title") : t("flag.titleWord")} onClose={close}>
          <p className="flag-sentence">
            {sentence.article ? `${sentence.article} ` : ""}
            {sentence.nl}
            {!sentence.id.startsWith("sentence.") && sentence.en && <span className="dim"> · {sentence.en}</span>}
          </p>
          <div className="flag-kinds">
            {["weghalen", "aanpassen"].map((k) => (
              <button key={k} type="button" className="flag-kind" aria-pressed={kind === k} onClick={() => setKind(k)}>
                <strong>{t(`flag.kind.${k}`)}</strong>
                <span className="dim">{t(`flag.about.${k}`)}</span>
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            className="flag-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("flag.commentPlaceholder")}
            aria-label={t("review.comment")}
          />
          {error && <div className="auth-error">{error}</div>}
          <div className="fb-actions">
            <button type="button" className="fb-btn-secondary" onClick={close} disabled={busy}>
              {t("common.cancel")}
            </button>
            <button type="button" className="fb-btn-primary" onClick={send} disabled={busy || !kind}>
              {t("flag.send")}
            </button>
          </div>
        </Dialog>
      )}
    </span>
  );
}
