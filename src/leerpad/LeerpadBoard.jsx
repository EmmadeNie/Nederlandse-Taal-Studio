import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/context";
import Markdown from "../components/Markdown";
import Board, { AddCardForm } from "./Board";
import * as api from "./api";
import { BoardFilters, CardBody, Chips, Dialog, LinkList, LinksEditor } from "./shared";
import { LEVELS, linkCount, matchesFilter, stepContent } from "./util";

/**
 * One student's leerpad. The student and the docent can create, rename and
 * delete lanes and drag steps around; only the docent plans lessons, adds
 * zijpaden, extras and notes. Reviewers only look.
 */
export default function LeerpadBoard({ studentId }) {
  const { role, user } = useAuth();
  const isDocent = role === "docent";
  const isOwner = user.id === studentId;
  const canArrange = isDocent || isOwner;

  const [lanes, setLanes] = useState([]);
  const [steps, setSteps] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [openId, setOpenId] = useState(null);
  const [pickerLane, setPickerLane] = useState(null);

  const load = useCallback(async () => {
    try {
      if (canArrange) await api.ensureLeerpad(studentId);
      const data = await api.loadLeerpad(studentId, { withNotes: isDocent });
      setLanes(data.lanes);
      setSteps(data.steps);
      setNotes(data.notes);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [studentId, canArrange, isDocent]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    load();
  }, [load]);

  const run = async (fn) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
      load();
    }
  };

  const moveStep = (step, laneId, position) => {
    setSteps((ss) => ss.map((s) => (s.id === step.id ? { ...s, lane_id: laneId, position } : s)));
    run(() => api.moveStep(step.id, laneId, position));
  };

  const nextPos = (laneId) => {
    const inLane = steps.filter((s) => s.lane_id === laneId);
    return inLane.length ? Math.max(...inLane.map((s) => s.position)) + 1 : 1;
  };

  const addStep = (fields) =>
    run(async () => {
      const created = await api.createStep({ student_id: studentId, ...fields });
      setSteps((ss) => [...ss, created]);
    });

  const openStep = steps.find((s) => s.id === openId);

  if (loading) return <p className="dim">Laden…</p>;

  return (
    <>
      <BoardFilters
        search={search}
        setSearch={setSearch}
        level={level}
        setLevel={setLevel}
        placeholder="Zoek een stap…"
      />
      {error && <div className="lp-error">{error}</div>}
      {lanes.length === 0 ? (
        <p className="dim">Dit leerpad is nog niet aangemaakt.</p>
      ) : (
        <Board
          lanes={lanes}
          cards={steps}
          isCardVisible={(s) => matchesFilter(stepContent(s), search, level)}
          cardClass={(s) => (s.lesson_id ? "" : "is-zijpad")}
          renderCard={(s) => {
            const c = stepContent(s);
            return (
              <CardBody
                title={c.title}
                level={c.level}
                categories={c.categories}
                kind={s.lesson_id ? null : "Zijpad"}
                meta={
                  <>
                    {linkCount(c.links.length + s.extras.length)}
                    {s.extras.length > 0 && <span>+{s.extras.length} extra</span>}
                    {isDocent && notes[s.id] && <span>📝 notitie</span>}
                  </>
                }
              />
            );
          }}
          onOpenCard={(s) => setOpenId(s.id)}
          onMoveCard={canArrange ? moveStep : undefined}
          onAddLane={
            canArrange &&
            ((name) =>
              run(async () => {
                const lane = await api.createLeerpadLane(studentId, name, lanes);
                setLanes((ls) => [...ls, lane]);
              }))
          }
          onRenameLane={
            canArrange &&
            ((lane, name) => {
              setLanes((ls) => ls.map((l) => (l.id === lane.id ? { ...l, name } : l)));
              run(() => api.renameLeerpadLane(lane.id, name));
            })
          }
          onDeleteLane={
            canArrange &&
            lanes.length > 1 &&
            ((lane) => {
              setLanes((ls) => ls.filter((l) => l.id !== lane.id));
              run(() => api.deleteLeerpadLane(lane.id));
            })
          }
          laneFooter={
            isDocent &&
            ((lane) => (
              <>
                <button className="board-add-btn" onClick={() => setPickerLane(lane)}>
                  + Les uit lesprogramma
                </button>
                <AddCardForm
                  label="+ Zijpad"
                  placeholder="Titel van het zijpad"
                  onAdd={(title) => addStep({ lane_id: lane.id, title, position: nextPos(lane.id) })}
                />
              </>
            ))
          }
          emptyLaneText={canArrange ? "Sleep een stap hierheen." : "Nog leeg."}
        />
      )}

      {pickerLane && (
        <LessonPicker
          lane={pickerLane}
          plannedIds={new Set(steps.map((s) => s.lesson_id).filter(Boolean))}
          onClose={() => setPickerLane(null)}
          onPick={(lesson) =>
            addStep({ lane_id: pickerLane.id, lesson_id: lesson.id, position: nextPos(pickerLane.id) })
          }
        />
      )}

      {openStep && (
        <StepDialog
          step={openStep}
          lanes={lanes}
          note={notes[openStep.id] || ""}
          isDocent={isDocent}
          canArrange={canArrange}
          nextPos={nextPos}
          onClose={() => setOpenId(null)}
          onChanged={(patch, note) => {
            setSteps((ss) => ss.map((s) => (s.id === openStep.id ? { ...s, ...patch } : s)));
            if (note !== undefined) setNotes((n) => ({ ...n, [openStep.id]: note }));
          }}
          onRemoved={() => {
            setSteps((ss) => ss.filter((s) => s.id !== openStep.id));
            setOpenId(null);
          }}
        />
      )}
    </>
  );
}

function LessonPicker({ lane, plannedIds, onClose, onPick }) {
  const [lessons, setLessons] = useState(null);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    api.loadProgram().then((d) => setLessons(d.lessons)).catch(() => setLessons([]));
  }, []);

  const shown = (lessons || []).filter((l) => matchesFilter(l, search, level)).slice(0, 60);

  return (
    <Dialog title={`Les toevoegen aan “${lane.name}”`} onClose={onClose} wide>
      <BoardFilters
        search={search}
        setSearch={setSearch}
        level={level}
        setLevel={setLevel}
        placeholder="Zoek in het lesprogramma…"
      />
      {lessons === null ? (
        <p className="dim">Laden…</p>
      ) : (
        <div className="lp-picker">
          {shown.map((l) => (
            <button
              key={l.id}
              disabled={plannedIds.has(l.id)}
              onClick={() => {
                onPick(l);
                onClose();
              }}
            >
              <CardBody
                title={l.title}
                level={l.level}
                categories={l.categories}
                kind={plannedIds.has(l.id) ? "staat er al op" : null}
              />
            </button>
          ))}
          {shown.length === 0 && <p className="dim lp-empty">Geen lessen gevonden.</p>}
        </div>
      )}
    </Dialog>
  );
}

function StepDialog({ step, lanes, note, isDocent, canArrange, nextPos, onClose, onChanged, onRemoved }) {
  const content = stepContent(step);
  const isZijpad = !step.lesson_id;
  const [laneId, setLaneId] = useState(step.lane_id);
  const [extras, setExtras] = useState(step.extras);
  const [noteText, setNoteText] = useState(note);
  const [zijpad, setZijpad] = useState({
    title: step.title || "",
    level: step.level || "",
    explanation: step.explanation || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const patch = {};
      if (laneId !== step.lane_id) {
        const position = nextPos(laneId);
        await api.moveStep(step.id, laneId, position);
        Object.assign(patch, { lane_id: laneId, position });
      }
      if (isDocent) {
        const fields = { extras };
        if (isZijpad) {
          if (!zijpad.title.trim()) throw new Error("Geef het zijpad een titel.");
          Object.assign(fields, {
            title: zijpad.title.trim(),
            level: zijpad.level || null,
            explanation: zijpad.explanation,
          });
        }
        await api.updateStep(step.id, fields);
        Object.assign(patch, fields);
        if (noteText !== note) await api.saveStepNote(step.id, noteText);
      }
      onChanged(patch, isDocent ? noteText : undefined);
      onClose();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`“${content.title}” van dit leerpad halen?`)) return;
    try {
      await api.deleteStep(step.id);
      onRemoved();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Dialog title={content.title} onClose={onClose} wide>
      <Chips level={content.level} categories={content.categories} kind={isZijpad ? "Zijpad" : "Stap"} />
      {isDocent && (
        <div className="lp-source">
          {isZijpad ? (
            <>
              <strong>Zijpad. </strong>Bestaat alleen op dit leerpad, niet in het lesprogramma.
            </>
          ) : (
            <>
              <strong>Stap, gekoppeld aan een les. </strong>Titel, labels, uitleg en verwijzingen komen uit het
              lesprogramma. Lane, extra&apos;s en notitie horen bij deze leerling.
            </>
          )}
        </div>
      )}

      {isZijpad && isDocent ? (
        <>
          <div className="lp-row">
            <label className="fb-field" style={{ flex: "3 1 200px" }}>
              <span>Titel</span>
              <input value={zijpad.title} onChange={(e) => setZijpad({ ...zijpad, title: e.target.value })} />
            </label>
            <label className="fb-field" style={{ flex: "1 1 100px" }}>
              <span>Niveau</span>
              <select value={zijpad.level} onChange={(e) => setZijpad({ ...zijpad, level: e.target.value })}>
                <option value="">Geen</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="fb-field">
            <span>Uitleg</span>
            <textarea
              rows={5}
              value={zijpad.explanation}
              onChange={(e) => setZijpad({ ...zijpad, explanation: e.target.value })}
              placeholder="Wat moet de leerling doen?"
            />
          </label>
        </>
      ) : (
        content.explanation.trim() && (
          <div className="lp-section">
            <h4>Uitleg</h4>
            <Markdown className="lp-explanation">{content.explanation}</Markdown>
          </div>
        )
      )}

      <div className="lp-section">
        <h4>Verwijzingen</h4>
        <LinkList links={content.links} extras={isDocent ? [] : step.extras} />
        {isDocent && (
          <>
            <h4>Extra&apos;s voor deze leerling</h4>
            <LinksEditor value={extras} onChange={setExtras} addLabel="+ Extra" />
          </>
        )}
      </div>

      {canArrange && (
        <label className="fb-field">
          <span>Lane</span>
          <select value={laneId} onChange={(e) => setLaneId(e.target.value)}>
            {lanes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {isDocent && (
        <label className="fb-field">
          <span>Notitie (alleen voor docenten)</span>
          <textarea
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Bijv. twijfelt nog bij hebben/zijn"
          />
        </label>
      )}

      {error && <div className="auth-error">{error}</div>}

      {canArrange ? (
        <div className="lp-actions">
          <button className="fb-btn-primary" onClick={save} disabled={busy}>
            Opslaan
          </button>
          <button className="fb-btn-secondary" onClick={onClose}>
            Annuleren
          </button>
          {isDocent && (
            <button className="lp-danger" onClick={remove}>
              Van leerpad halen
            </button>
          )}
        </div>
      ) : null}
    </Dialog>
  );
}
