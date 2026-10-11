import { useEffect, useState } from "react";
import { useI18n } from "../i18n/context";
import { leerpadLanes, listStudents, planLessons, plannedLessonIds } from "./api";

/**
 * Bottom bar while lessons are selected on the lesprogramma: put them all on
 * one student's leerpad, in a lane of choice. Choosing a student highlights the
 * lessons already on their leerpad (onPlanned gets the set of lesson ids).
 */
export default function SelectionBar({ lessonIds, onClear, onPlanned, plannedCount, levelOf }) {
  const { t } = useI18n();
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [lanes, setLanes] = useState([]);
  const [laneId, setLaneId] = useState("");
  const [byLevel, setByLevel] = useState(true); // each lesson into the lane of its level
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    listStudents().then(setStudents).catch(() => setStudents([]));
  }, []);

  const showPlanned = (id) =>
    id ? plannedLessonIds(id).then(onPlanned, () => onPlanned(null)) : onPlanned(null);

  const chooseStudent = async (id) => {
    setStudentId(id);
    setLanes([]);
    setLaneId("");
    setMessage(null);
    showPlanned(id);
    if (!id) return;
    try {
      const rows = await leerpadLanes(id);
      setLanes(rows);
      setLaneId(rows[0]?.id ?? "");
    } catch (e) {
      setMessage({ error: true, text: t(e.message) });
    }
  };

  const plan = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await planLessons(lessonIds, studentId, laneId, byLevel ? { levelOf } : {});
      const { added, skipped } = result;
      const student = students.find((s) => s.id === studentId);
      const planned = added
        ? t("select.planned", { n: added, name: student?.display_name || student?.email, lane: result.lanes.join(", ") })
        : "";
      if (byLevel) setLanes(await leerpadLanes(studentId)); // new level lanes
      setMessage({ text: [planned, skipped ? t("select.skipped", { n: skipped }) : ""].filter(Boolean).join(" ") });
      showPlanned(studentId); // the new ones are highlighted too
    } catch (e) {
      setMessage({ error: true, text: t(e.message) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="selection-bar" role="region" aria-label={t("select.barLabel")}>
      <strong>{t("select.count", { n: lessonIds.length })}</strong>
      <button className="fb-link" onClick={onClear} disabled={!lessonIds.length}>
        {t("select.clear")}
      </button>
      <span className="selection-bar-spacer" />
      <select value={studentId} onChange={(e) => chooseStudent(e.target.value)} aria-label={t("lp.student")}>
        <option value="">{t("lp.chooseStudent")}</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.display_name || s.email}
            {s.user_id ? "" : ` (${t("users.pending")})`}
          </option>
        ))}
      </select>
      <label className="selection-bylevel" title={t("select.byLevelHint")}>
        <input type="checkbox" checked={byLevel} onChange={(e) => setByLevel(e.target.checked)} /> {t("select.byLevel")}
      </label>
      <select
        value={laneId}
        onChange={(e) => setLaneId(e.target.value)}
        disabled={!lanes.length}
        aria-label={byLevel ? t("select.laneNoLevel") : t("lp.lane")}
        title={byLevel ? t("select.laneNoLevel") : undefined}
      >
        {lanes.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
      {studentId && plannedCount != null && (
        <span className="selection-planned">
          <span className="planned-swatch" aria-hidden="true" /> {t("select.alreadyPlanned", { n: plannedCount })}
        </span>
      )}
      <button
        className="fb-btn-primary"
        onClick={plan}
        disabled={busy || !lessonIds.length || !studentId || !laneId}
      >
        {t("select.plan")}
      </button>
      {message && (
        <span className={message.error ? "auth-error" : "note-ok"} role="status">
          {message.text}
        </span>
      )}
    </div>
  );
}
