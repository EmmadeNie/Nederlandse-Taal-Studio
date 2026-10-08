import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/context";
import Markdown from "../components/Markdown";
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
  const canEdit = role === "docent";
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
      setError(e.message);
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
        <h2>Lesprogramma</h2>
        <span className="result-count">{lessons.length} lessen</span>
      </div>
      <p className="lp-intro">
        Het masterboard met alle lessen. Zet een les op het leerpad van een leerling;
        pas je de les hier aan, dan ziet die leerling dat meteen.
        {canEdit ? " Sleep lessen tussen lanes; het niveau blijft gewoon een label." : ""}
      </p>
      <BoardFilters
        search={search}
        setSearch={setSearch}
        level={level}
        setLevel={setLevel}
        placeholder="Zoek een les…"
      />
      {error && <div className="lp-error">{error}</div>}
      {loading ? (
        <p className="dim">Laden…</p>
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
              meta={linkCount(l.links.length)}
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
                label="+ Les toevoegen"
                placeholder="Titel van de les"
                onAdd={(title) => addLesson(lane, title)}
              />
            ))
          }
          emptyLaneText="Nog geen lessen in deze lane."
        />
      )}
      {openLesson && (
        <LessonDialog
          lesson={openLesson}
          lanes={lanes}
          canEdit={canEdit}
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

function LessonDialog({ lesson, lanes, canEdit, onClose, onSaved, onDeleted }) {
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
    api.studentsWithLesson(lesson.id).then(setStudents).catch(() => setStudents([]));
    if (canEdit) api.listStudents().then(setAllStudents).catch(() => {});
  }, [lesson.id, canEdit]);

  const save = async () => {
    if (!form.title.trim()) {
      setError("Geef de les een titel.");
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
      setError(e.message);
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`“${lesson.title}” uit het lesprogramma verwijderen?`)) return;
    setError(null);
    try {
      await api.deleteLesson(lesson.id);
      onDeleted(lesson.id);
    } catch (e) {
      setError(e.message);
    }
  };

  const plan = async () => {
    if (!planFor) return;
    setError(null);
    setMessage(null);
    try {
      await api.planLesson(lesson.id, planFor);
      const s = allStudents.find((x) => x.id === planFor);
      setMessage(`Staat nu op het leerpad van ${s?.display_name || s?.email}.`);
      setPlanFor("");
      setStudents(await api.studentsWithLesson(lesson.id));
    } catch (e) {
      setError(e.message);
    }
  };

  const planned = new Set((students || []).map((s) => s.id));

  return (
    <Dialog title={canEdit ? "Les bewerken" : lesson.title} onClose={onClose} wide>
      <div className="lp-source">
        <strong>Les in het lesprogramma. </strong>
        {students === null
          ? "…"
          : students.length
            ? `Staat op het leerpad van ${students.map((s) => s.name).join(", ")}. Wijzigingen zien zij meteen.`
            : "Staat nog op geen enkel leerpad."}
      </div>

      {canEdit && (
        <>
          <label className="fb-field">
            <span>Titel</span>
            <input value={form.title} onChange={(e) => set("title")(e.target.value)} />
          </label>
          <div className="lp-row">
            <label className="fb-field" style={{ flex: "1 1 120px" }}>
              <span>Niveau</span>
              <select value={form.level} onChange={(e) => set("level")(e.target.value)}>
                <option value="">Geen niveau</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="fb-field" style={{ flex: "1 1 120px" }}>
              <span>Lane</span>
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
            <span>Labels (komma-gescheiden)</span>
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
          Uitleg{" "}
          {canEdit && (
            <button type="button" className="fb-link" onClick={() => setPreview((p) => !p)}>
              {preview ? "bewerken" : "voorbeeld"}
            </button>
          )}
        </h4>
        {preview ? (
          form.explanation.trim() ? (
            <Markdown className="lp-explanation">{form.explanation}</Markdown>
          ) : (
            <p className="dim lp-empty">Geen uitleg.</p>
          )
        ) : (
          <label className="fb-field">
            <textarea
              rows={8}
              value={form.explanation}
              onChange={(e) => set("explanation")(e.target.value)}
              aria-label="Uitleg (Markdown)"
              placeholder="Uitleg in Markdown: **vet**, lijstjes, links…"
            />
          </label>
        )}
      </div>

      <div className="lp-section">
        <h4>Verwijzingen</h4>
        {canEdit ? (
          <LinksEditor value={form.links} onChange={set("links")} />
        ) : (
          <LinkList links={lesson.links} />
        )}
      </div>

      {canEdit && (
        <div className="lp-section">
          <h4>Op leerpad zetten</h4>
          {allStudents.length ? (
            <div className="lp-row">
              <select value={planFor} onChange={(e) => setPlanFor(e.target.value)} aria-label="Leerling">
                <option value="">Kies een leerling…</option>
                {allStudents.map((s) => (
                  <option key={s.id} value={s.id} disabled={planned.has(s.id)}>
                    {s.display_name || s.email}
                    {planned.has(s.id) ? " (staat er al op)" : ""}
                  </option>
                ))}
              </select>
              <button type="button" className="fb-btn-secondary" onClick={plan} disabled={!planFor}>
                Inplannen
              </button>
            </div>
          ) : (
            <p className="dim lp-empty">
              Nog geen leerlingen. Iemand wordt leerling zodra die voor het eerst inlogt.
            </p>
          )}
          {message && <div className="note-ok">{message}</div>}
        </div>
      )}

      {error && <div className="auth-error">{error}</div>}

      {canEdit && (
        <div className="lp-actions">
          <button className="fb-btn-primary" onClick={save} disabled={busy}>
            Opslaan
          </button>
          <button className="fb-btn-secondary" onClick={onClose}>
            Annuleren
          </button>
          <button className="lp-danger" onClick={remove}>
            Les verwijderen
          </button>
        </div>
      )}
    </Dialog>
  );
}
