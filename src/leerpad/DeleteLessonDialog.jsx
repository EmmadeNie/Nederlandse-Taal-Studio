import { useEffect, useState } from "react";
import { useI18n } from "../i18n/context";
import { Dialog } from "./shared";
import * as api from "./api";

/**
 * Removing a lesson that is still on leerpaden: per student the lane (and
 * status) it is in, with "Weghalen" per step or for all at once. Only when it
 * is on no leerpad any more can the lesson itself go.
 */
export default function DeleteLessonDialog({ lesson, onClose, onDeleted }) {
  const { t } = useI18n();
  const [usage, setUsage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.lessonUsage(lesson.id).then(setUsage, (e) => setError(e.message));
  }, [lesson.id]);

  const removeSteps = async (rows) => {
    setBusy(true);
    setError(null);
    try {
      for (const r of rows) await api.deleteStep(r.stepId);
      setUsage(await api.lessonUsage(lesson.id));
    } catch (e) {
      setError(t(e.message));
    } finally {
      setBusy(false);
    }
  };

  const removeLesson = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.deleteLesson(lesson.id);
      onDeleted(lesson.id);
    } catch (e) {
      setError(t(e.message));
      setBusy(false);
    }
  };

  return (
    <Dialog title={t("del.title", { title: lesson.title })} onClose={onClose}>
      {usage === null ? (
        <p className="dim">{t("common.loading")}</p>
      ) : usage.length === 0 ? (
        <p>{t("del.free")}</p>
      ) : (
        <>
          <p>{t("del.inUse", { n: usage.length })}</p>
          <ul className="del-usage">
            {usage.map((r) => (
              <li key={r.stepId}>
                <span>
                  <strong>{r.name}</strong>
                  <span className="dim">
                    {" "}
                    · {t("del.lane", { lane: r.lane })}
                    {r.status ? ` · ${t(`status.${r.status}`)}` : ""}
                  </span>
                </span>
                <button type="button" className="fb-btn-secondary" disabled={busy} onClick={() => removeSteps([r])}>
                  {t("del.removeStep")}
                </button>
              </li>
            ))}
          </ul>
          {usage.length > 1 && (
            <button type="button" className="fb-btn-secondary" disabled={busy} onClick={() => removeSteps(usage)}>
              {t("del.removeAll", { n: usage.length })}
            </button>
          )}
        </>
      )}
      {error && <div className="auth-error">{error}</div>}
      <div className="fb-actions">
        <button type="button" className="fb-btn-secondary" onClick={onClose} disabled={busy}>
          {t("common.cancel")}
        </button>
        <button type="button" className="lp-danger" onClick={removeLesson} disabled={busy || usage === null || usage.length > 0}>
          {t("del.deleteLesson")}
        </button>
      </div>
    </Dialog>
  );
}
