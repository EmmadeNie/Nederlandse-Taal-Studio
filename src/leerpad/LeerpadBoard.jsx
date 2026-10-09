import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/context";
import { useI18n } from "../i18n/context";
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
  const { t } = useI18n();
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
      setError(t(e.message));
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

  if (loading) return <p className="dim">{t("common.loading")}</p>;

  return (
    <>
      <BoardFilters
        search={search}
        setSearch={setSearch}
        level={level}
        setLevel={setLevel}
        placeholder={t("lp.searchStep")}
      />
      {error && <div className="lp-error">{error}</div>}
      {lanes.length === 0 ? (
        <p className="dim">{t("lp.notCreated")}</p>
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
                kind={s.lesson_id ? null : t("kind.zijpad")}
                meta={
                  <>
                    {linkCount(t, c.links.length + s.extras.length)}
                    {s.extras.length > 0 && <span>{t("lp.extraCount", { n: s.extras.length })}</span>}
                    {isDocent && notes[s.id] && <span>{t("lp.hasNote")}</span>}
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
          onMoveLane={
            canArrange &&
            ((lane, position) => {
              setLanes((ls) =>
                ls
                  .map((l) => (l.id === lane.id ? { ...l, position } : l))
                  .sort((a, b) => a.position - b.position)
              );
              run(() => api.moveLeerpadLane(lane.id, position));
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
                  {t("lp.fromProgram")}
                </button>
                <AddCardForm
                  label={t("lp.addZijpad")}
                  placeholder={t("lp.zijpadTitle")}
                  onAdd={(title) => addStep({ lane_id: lane.id, title, position: nextPos(lane.id) })}
                />
              </>
            ))
          }
          emptyLaneText={canArrange ? t("board.dropHere") : t("board.empty")}
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
  const { t } = useI18n();
  const [lessons, setLessons] = useState(null);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    api.loadProgram().then((d) => setLessons(d.lessons)).catch(() => setLessons([]));
  }, []);

  const shown = (lessons || []).filter((l) => matchesFilter(l, search, level)).slice(0, 60);

  return (
    <Dialog title={t("picker.title", { lane: lane.name })} onClose={onClose} wide>
      <BoardFilters
        search={search}
        setSearch={setSearch}
        level={level}
        setLevel={setLevel}
        placeholder={t("picker.search")}
      />
      {lessons === null ? (
        <p className="dim">{t("common.loading")}</p>
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
                kind={plannedIds.has(l.id) ? t("kind.alreadyOn") : null}
              />
            </button>
          ))}
          {shown.length === 0 && <p className="dim lp-empty">{t("picker.none")}</p>}
        </div>
      )}
    </Dialog>
  );
}

function StepDialog({ step, lanes, note, isDocent, canArrange, nextPos, onClose, onChanged, onRemoved }) {
  const { t } = useI18n();
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
          if (!zijpad.title.trim()) throw new Error("step.needTitle");
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
      setError(t(e.message));
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(t("step.confirmRemove", { title: content.title }))) return;
    try {
      await api.deleteStep(step.id);
      onRemoved();
    } catch (e) {
      setError(t(e.message));
    }
  };

  return (
    <Dialog title={content.title} onClose={onClose} wide>
      <Chips level={content.level} categories={content.categories} kind={isZijpad ? t("kind.zijpad") : t("kind.stap")} />
      {isDocent && (
        <div className="lp-source">
          {isZijpad ? (
            <>
              <strong>{t("step.zijpadSource")}</strong>
              {t("step.zijpadSourceText")}
            </>
          ) : (
            <>
              <strong>{t("step.stapSource")}</strong>
              {t("step.stapSourceText")}
            </>
          )}
        </div>
      )}

      {isZijpad && isDocent ? (
        <>
          <div className="lp-row">
            <label className="fb-field" style={{ flex: "3 1 200px" }}>
              <span>{t("lp.title")}</span>
              <input value={zijpad.title} onChange={(e) => setZijpad({ ...zijpad, title: e.target.value })} />
            </label>
            <label className="fb-field" style={{ flex: "1 1 100px" }}>
              <span>{t("lp.level")}</span>
              <select value={zijpad.level} onChange={(e) => setZijpad({ ...zijpad, level: e.target.value })}>
                <option value="">{t("step.levelNone")}</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="fb-field">
            <span>{t("lp.explanation")}</span>
            <textarea
              rows={5}
              value={zijpad.explanation}
              onChange={(e) => setZijpad({ ...zijpad, explanation: e.target.value })}
              placeholder={t("step.zijpadPh")}
            />
          </label>
        </>
      ) : (
        content.explanation.trim() && (
          <div className="lp-section">
            <h4>{t("lp.explanation")}</h4>
            <Markdown className="lp-explanation">{content.explanation}</Markdown>
          </div>
        )
      )}

      <div className="lp-section">
        <h4>{t("lp.links")}</h4>
        <LinkList links={content.links} extras={isDocent ? [] : step.extras} />
        {isDocent && (
          <>
            <h4>{t("step.extras")}</h4>
            <LinksEditor value={extras} onChange={setExtras} addLabel={t("links.addExtra")} />
          </>
        )}
      </div>

      {canArrange && (
        <label className="fb-field">
          <span>{t("lp.lane")}</span>
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
          <span>{t("step.note")}</span>
          <textarea
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={t("step.notePh")}
          />
        </label>
      )}

      {error && <div className="auth-error">{error}</div>}

      {canArrange ? (
        <div className="lp-actions">
          <button className="fb-btn-primary" onClick={save} disabled={busy}>
            {t("common.save")}
          </button>
          <button className="fb-btn-secondary" onClick={onClose}>
            {t("common.cancel")}
          </button>
          {isDocent && (
            <button className="lp-danger" onClick={remove}>
              {t("step.remove")}
            </button>
          )}
        </div>
      ) : null}
    </Dialog>
  );
}
