import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/context";
import { useI18n } from "../i18n/context";
import Markdown from "../components/Markdown";
import LessonFiles from "./LessonFiles";
import Board, { AddCardForm } from "./Board";
import * as api from "./api";
import { BoardFilters, CardBody, Dialog, LinkList, LinksEditor } from "./shared";
import { LEVELS, linkCount, matchesFilter } from "./util";

/**
 * Lesprogramma: the master board. Lanes are free (like Trello); the CEFR
 * level is a label on each les. Docent edits, reviewers read.
 */
export default function LesprogrammaPage() {
  const { role } = useAuth();
  const { t } = useI18n();
  const canEdit = role === "docent";
  const isStudent = role === "leerling";
  const [lanes, setLanes] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api.loadProgram();
      setLanes(data.lanes);
      setLessons(data.lessons);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Run a write; on failure show the error and reload the true state.
  const run = async (fn) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(t(e.message));
      load();
    }
  };

  const moveLesson = (lesson, laneId, position) => {
    setLessons((ls) => ls.map((l) => (l.id === lesson.id ? { ...l, lane_id: laneId, position } : l)));
    run(() => api.updateLesson(lesson.id, { lane_id: laneId, position }));
  };

  const addLesson = (lane, title) =>
    run(async () => {
      const inLane = lessons.filter((l) => l.lane_id === lane.id);
      const created = await api.createLesson({
        lane_id: lane.id,
        title,
        position: inLane.length ? Math.max(...inLane.map((l) => l.position)) + 1 : 1,
      });
      setLessons((ls) => [...ls, created]);
      setOpenId(created.id);
    });

  const openLesson = lessons.find((l) => l.id === openId);

  return (
    <>
      <div className="lp-page-head">
        <h2>{t("nav.lesprogramma")}</h2>
        <span className="result-count">{t("lp.lessons", { n: lessons.length })}</span>
        {!canEdit && (
          <span className="lp-view-only" title={t("lp.viewOnlyHint")}>
            👁 {t("lp.viewOnly")}
          </span>
        )}
      </div>
      <p className="lp-intro">
        {isStudent ? t("lp.studentIntro") : t("lp.programIntro")}
        {canEdit ? " " + t("lp.programIntroDrag") : " " + t("lp.viewOnlyHint")}
      </p>
      <BoardFilters
        search={search}
        setSearch={setSearch}
        level={level}
        setLevel={setLevel}
        placeholder={t("lp.searchLesson")}
      />
      {error && <div className="lp-error">{error}</div>}
      {loading ? (
        <p className="dim">{t("common.loading")}</p>
      ) : (
        <Board
          lanes={lanes}
          cards={lessons}
          isCardVisible={(l) => matchesFilter(l, search, level)}
          renderCard={(l) => (
            <CardBody
              title={l.title}
              level={l.level}
              categories={l.categories}
              meta={
                <>
                  {linkCount(t, l.links.length)}
                  {l.attachments?.length > 0 && <span>{t("files.count", { n: l.attachments.length })}</span>}
                </>
              }
            />
          )}
          onOpenCard={(l) => setOpenId(l.id)}
          onMoveCard={canEdit ? moveLesson : undefined}
          onAddLane={
            canEdit &&
            ((name) =>
              run(async () => {
                const lane = await api.createLessonLane(name, lanes);
                setLanes((ls) => [...ls, lane]);
              }))
          }
          onRenameLane={
            canEdit &&
            ((lane, name) => {
              setLanes((ls) => ls.map((l) => (l.id === lane.id ? { ...l, name } : l)));
              run(() => api.renameLessonLane(lane.id, name));
            })
          }
          onMoveLane={
            canEdit &&
            ((lane, position) => {
              setLanes((ls) =>
                ls
                  .map((l) => (l.id === lane.id ? { ...l, position } : l))
                  .sort((a, b) => a.position - b.position)
              );
              run(() => api.moveLessonLane(lane.id, position));
            })
          }
          onDeleteLane={
            canEdit &&
            ((lane) => {
              setLanes((ls) => ls.filter((l) => l.id !== lane.id));
              run(() => api.deleteLessonLane(lane.id));
            })
          }
          laneFooter={
            canEdit &&
            ((lane) => (
              <AddCardForm
                label={t("lp.addLesson")}
                placeholder={t("lp.lessonTitle")}
                onAdd={(title) => addLesson(lane, title)}
              />
            ))
          }
          emptyLaneText={t("lp.emptyLessons")}
        />
      )}
      {openLesson && (
        <LessonDialog
          lesson={openLesson}
          lanes={lanes}
          canEdit={canEdit}
          isStudent={isStudent}
          onClose={() => setOpenId(null)}
          onSaved={(updated) => setLessons((ls) => ls.map((l) => (l.id === updated.id ? updated : l)))}
          onDeleted={(id) => {
            setLessons((ls) => ls.filter((l) => l.id !== id));
            setOpenId(null);
          }}
        />
      )}
    </>
  );
}

function LessonDialog({ lesson, lanes, canEdit, isStudent, onClose, onSaved, onDeleted }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    title: lesson.title,
    level: lesson.level || "",
    categories: lesson.categories.join(", "),
    explanation: lesson.explanation,
    links: lesson.links,
    lane_id: lesson.lane_id,
  });
  const [preview, setPreview] = useState(!canEdit);
  const [students, setStudents] = useState(null); // students with this lesson
  const [allStudents, setAllStudents] = useState([]);
  const [planFor, setPlanFor] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    // Who has this lesson is staff information; students only see the lesson.
    if (isStudent) return;
    api.studentsWithLesson(lesson.id).then(setStudents).catch(() => setStudents([]));
    if (canEdit) api.listStudents().then(setAllStudents).catch(() => {});
  }, [lesson.id, canEdit, isStudent]);

  const save = async () => {
    if (!form.title.trim()) {
      setError(t("lp.needTitle"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await api.updateLesson(lesson.id, {
        title: form.title.trim(),
        level: form.level || null,
        categories: form.categories.split(",").map((c) => c.trim()).filter(Boolean),
        explanation: form.explanation,
        links: form.links,
        lane_id: form.lane_id,
      });
      onSaved(updated);
      onClose();
    } catch (e) {
      setError(t(e.message));
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(t("lp.confirmDeleteLesson", { title: lesson.title }))) return;
    setError(null);
    try {
      await api.deleteLesson(lesson.id);
      onDeleted(lesson.id);
    } catch (e) {
      setError(t(e.message));
    }
  };

  const plan = async () => {
    if (!planFor) return;
    setError(null);
    setMessage(null);
    try {
      await api.planLesson(lesson.id, planFor);
      const s = allStudents.find((x) => x.id === planFor);
      setMessage(t("lp.planned", { name: s?.display_name || s?.email }));
      setPlanFor("");
      setStudents(await api.studentsWithLesson(lesson.id));
    } catch (e) {
      setError(t(e.message));
    }
  };

  const planned = new Set((students || []).map((s) => s.id));

  return (
    <Dialog title={canEdit ? t("lp.editLesson") : lesson.title} onClose={onClose} wide>
      {isStudent ? (
        <div className="lp-source">
          <strong>👁 {t("lp.viewOnly")}. </strong>
          {t("lp.viewOnlyHint")}
        </div>
      ) : (
        <div className="lp-source">
          <strong>{t("lp.lessonSource")}</strong>
          {students === null
            ? "…"
            : students.length
              ? t("lp.onPaths", { names: students.map((s) => s.name).join(", ") })
              : t("lp.onNoPath")}
        </div>
      )}

      {canEdit && (
        <>
          <label className="fb-field">
            <span>{t("lp.title")}</span>
            <input value={form.title} onChange={(e) => set("title")(e.target.value)} />
          </label>
          <div className="lp-row">
            <label className="fb-field" style={{ flex: "1 1 120px" }}>
              <span>{t("lp.level")}</span>
              <select value={form.level} onChange={(e) => set("level")(e.target.value)}>
                <option value="">{t("level.none")}</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="fb-field" style={{ flex: "1 1 120px" }}>
              <span>{t("lp.lane")}</span>
              <select value={form.lane_id} onChange={(e) => set("lane_id")(e.target.value)}>
                {lanes.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="fb-field">
            <span>{t("lp.labels")}</span>
            <input
              value={form.categories}
              onChange={(e) => set("categories")(e.target.value)}
              placeholder="Grammatica, Oefenen"
            />
          </label>
        </>
      )}

      <div className="lp-section">
        <h4>
          {t("lp.explanation")}{" "}
          {canEdit && (
            <button type="button" className="fb-link" onClick={() => setPreview((p) => !p)}>
              {preview ? t("lp.edit") : t("lp.preview")}
            </button>
          )}
        </h4>
        {preview ? (
          form.explanation.trim() ? (
            <Markdown className="lp-explanation">{form.explanation}</Markdown>
          ) : (
            <p className="dim lp-empty">{t("lp.noExplanation")}</p>
          )
        ) : (
          <label className="fb-field">
            <textarea
              rows={8}
              value={form.explanation}
              onChange={(e) => set("explanation")(e.target.value)}
              aria-label={t("lp.explanation")}
              placeholder={t("lp.explanationPh")}
            />
          </label>
        )}
      </div>

      <div className="lp-section">
        <h4>{t("lp.links")}</h4>
        {canEdit ? (
          <LinksEditor value={form.links} onChange={set("links")} />
        ) : (
          <LinkList links={lesson.links} />
        )}
      </div>

      <div className="lp-section">
        <h4>{t("files.title")}</h4>
        <LessonFiles
          lessonId={lesson.id}
          attachments={lesson.attachments}
          canEdit={canEdit}
          onChange={(attachments) => onSaved({ ...lesson, attachments })}
        />
      </div>

      {canEdit && (
        <div className="lp-section">
          <h4>{t("lp.plan")}</h4>
          {allStudents.length ? (
            <div className="lp-row">
              <select value={planFor} onChange={(e) => setPlanFor(e.target.value)} aria-label={t("lp.student")}>
                <option value="">{t("lp.chooseStudent")}</option>
                {allStudents.map((s) => (
                  <option key={s.id} value={s.id} disabled={planned.has(s.id)}>
                    {s.display_name || s.email}
                    {planned.has(s.id) ? t("lp.alreadyOn") : ""}
                  </option>
                ))}
              </select>
              <button type="button" className="fb-btn-secondary" onClick={plan} disabled={!planFor}>
                {t("lp.planButton")}
              </button>
            </div>
          ) : (
            <p className="dim lp-empty">
              {t("lp.noStudents")}
            </p>
          )}
          {message && <div className="note-ok">{message}</div>}
        </div>
      )}

      {error && <div className="auth-error">{error}</div>}

      {canEdit && (
        <div className="lp-actions">
          <button className="fb-btn-primary" onClick={save} disabled={busy}>
            {t("common.save")}
          </button>
          <button className="fb-btn-secondary" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button className="lp-danger" onClick={remove}>
            {t("lp.deleteLesson")}
          </button>
        </div>
      )}
    </Dialog>
  );
}
