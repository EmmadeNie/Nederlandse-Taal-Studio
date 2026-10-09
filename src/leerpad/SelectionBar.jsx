import { useEffect, useState } from "react";
import { useI18n } from "../i18n/context";
import { leerpadLanes, listStudents, planLessons } from "./api";

/**
 * Bottom bar while lessons are selected on the lesprogramma: put them all on
 * one student's leerpad, in a lane of choice.
 */
export default function SelectionBar({ lessonIds, onClear }) {
  const { t } = useI18n();
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [lanes, setLanes] = useState([]);
  const [laneId, setLaneId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    listStudents().then(setStudents).catch(() => setStudents([]));
  }, []);

  const chooseStudent = async (id) => {
    setStudentId(id);
    setLanes([]);
    setLaneId("");
    setMessage(null);
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
      const { added, skipped } = await planLessons(lessonIds, studentId, laneId);
      const student = students.find((s) => s.id === studentId);
      const lane = lanes.find((l) => l.id === laneId);
      const planned = added
        ? t("select.planned", { n: added, name: student?.display_name || student?.email, lane: lane?.name })
        : "";
      setMessage({ text: [planned, skipped ? t("select.skipped", { n: skipped }) : ""].filter(Boolean).join(" ") });
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
      <select
        value={laneId}
        onChange={(e) => setLaneId(e.target.value)}
        disabled={!lanes.length}
        aria-label={t("lp.lane")}
      >
        {lanes.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
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
