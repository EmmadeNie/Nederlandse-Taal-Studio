import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/context";
import { useI18n } from "../i18n/context";
import Markdown from "../components/Markdown";
import { InternalLinkContext, lessonIdFromHref } from "../components/internalLinks";
import { navigate } from "../hooks/useRoute";
import RichEditor from "../editor/RichEditor";
import LessonFiles from "./LessonFiles";
import { WordListsView } from "./WordList";
import { hasWordList, toLists, wordsForLists } from "./wordLists";
import { SentenceListsView } from "./SentenceList";
import { GrammarView } from "./LessonGrammar";
import { VerbsView } from "./LessonVerbs";
import { lessonVerbs } from "./verbIds";
import { grammarCount } from "./grammarTopics";
import SaveStatus from "./SaveStatus";
import { useAutosave } from "./useAutosave";
import { hasSentenceList, sentencesForLists } from "./sentenceLists";
import Board, { AddCardForm } from "./Board";
import FeedbackButton from "../feedback/FeedbackButton";
import * as api from "./api";
import { BoardFilters, CardBody, Chips, Dialog, LinkList, LinksEditor, MetaItem } from "./shared";
import { ICONS } from "../icons";
import { LEVELS, linkCount, matchesFilter, stepContent } from "./util";

/**
 * One student's leerpad. The student and the docent can create, rename and
 * delete lanes and drag steps around; only the docent plans lessons, adds
 * zijpaden, extras and notes. Reviewers only look.
 */
export default function LeerpadBoard({ studentId }) {
  const { role, profile } = useAuth();
  const { t } = useI18n();
  const isDocent = role === "docent";
  const isOwner = profile.id === studentId;
  const canArrange = isDocent || isOwner;

  const [lanes, setLanes] = useState([]);
  const [steps, setSteps] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [label, setLabel] = useState("");
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
        label={label}
        setLabel={setLabel}
        placeholder={t("lp.searchStep")}
      />
      {error && <div className="lp-error">{error}</div>}
      {lanes.length === 0 ? (
        <p className="dim">{t("lp.notCreated")}</p>
      ) : (
        <Board
          lanes={lanes}
          cards={steps}
          isCardVisible={(s) => matchesFilter(stepContent(s), search, level, label)}
          cardClass={(s) => (s.lesson_id ? "" : "is-zijpad")}
          renderCard={(s) => {
            const c = stepContent(s);
            return (
              <CardBody
                title={c.title}
                level={c.level}
                labelIds={c.labelIds}
                categories={c.categories}
                kind={s.lesson_id ? null : t("kind.zijpad")}
                meta={
                  <>
                    <MetaItem icon={ICONS.link}>{linkCount(t, s.extras.length)}</MetaItem>
                    <MetaItem icon={ICONS.topics}>
                      {grammarCount(c.topicIds) > 0 && t("lg.count", { n: grammarCount(c.topicIds) })}
                    </MetaItem>
                    <MetaItem icon={ICONS.verbs}>
                      {lessonVerbs(c.verbIds).length > 0 && t("lv.count", { n: lessonVerbs(c.verbIds).length })}
                    </MetaItem>
                    <MetaItem icon={ICONS.words}>
                      {toLists(c.wordList).some(hasWordList) && t("wl.count", { n: wordsForLists(c.wordList).length })}
                    </MetaItem>
                    <MetaItem icon={ICONS.sentences}>
                      {toLists(c.sentenceList).some(hasSentenceList) && t("sl.count", { n: sentencesForLists(c.sentenceList).length })}
                    </MetaItem>
                    <MetaItem icon={ICONS.bestand}>
                      {c.attachments.length > 0 && t("files.count", { n: c.attachments.length })}
                    </MetaItem>
                    <MetaItem icon={ICONS.notitie}>{isDocent && notes[s.id] && t("lp.hasNote")}</MetaItem>
                    <StepFeedback step={s} title={c.title} />
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
          key={openStep.id}
          step={openStep}
          lanes={lanes}
          note={notes[openStep.id] || ""}
          isDocent={isDocent}
          canArrange={canArrange}
          nextPos={nextPos}
          onClose={() => setOpenId(null)}
          onLessonLink={(href) => {
            // A lesson that is on this leerpad opens as its step; others in the lesprogramma.
            const lessonId = lessonIdFromHref(href);
            const target = lessonId && steps.find((s) => s.lesson_id === lessonId);
            if (target) setOpenId(target.id);
            else navigate(href);
          }}
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
  const [label, setLabel] = useState("");

  useEffect(() => {
    api.loadProgram().then((d) => setLessons(d.lessons)).catch(() => setLessons([]));
  }, []);

  const shown = (lessons || []).filter((l) => matchesFilter({ ...l, labelIds: l.label_ids }, search, level, label)).slice(0, 60);

  return (
    <Dialog title={t("picker.title", { lane: lane.name })} onClose={onClose} wide>
      <BoardFilters
        search={search}
        setSearch={setSearch}
        level={level}
        setLevel={setLevel}
        label={label}
        setLabel={setLabel}
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
                labelIds={l.label_ids}
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

function StepDialog({ step, lanes, note, isDocent, canArrange, nextPos, onClose, onLessonLink, onChanged, onRemoved }) {
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
  const [error, setError] = useState(null);
  const autosave = useAutosave();
  // Text as last sent to the database, so blur + close don't save twice.
  const sent = useRef({ title: zijpad.title, explanation: zijpad.explanation, note });

  const saveFields = (fields) =>
    autosave.save(async () => {
      await api.updateStep(step.id, fields);
      onChanged(fields);
    });

  const moveTo = (lane) => {
    setLaneId(lane);
    const position = nextPos(lane);
    autosave.save(async () => {
      await api.moveStep(step.id, lane, position);
      onChanged({ lane_id: lane, position });
    });
  };

  const changeExtras = (next) => {
    setExtras(next);
    saveFields({ extras: next });
  };

  const changeLevel = (level) => {
    setZijpad((z) => ({ ...z, level }));
    saveFields({ level: level || null });
  };

  /** Text fields save when you leave them (or close the dialog). */
  const saveText = () => {
    const saves = [];
    if (isDocent && isZijpad) {
      const fields = {};
      const title = zijpad.title.trim();
      if (!title) setZijpad((z) => ({ ...z, title: sent.current.title })); // an empty title is not saved
      else if (title !== sent.current.title) fields.title = title;
      if (zijpad.explanation !== sent.current.explanation) fields.explanation = zijpad.explanation;
      if (Object.keys(fields).length) {
        Object.assign(sent.current, fields);
        saves.push(saveFields(fields));
      }
    }
    if (isDocent && noteText !== sent.current.note) {
      const text = noteText;
      sent.current.note = text;
      saves.push(
        autosave.save(async () => {
          await api.saveStepNote(step.id, text);
          onChanged({}, text);
        })
      );
    }
    return saves.length ? saves[saves.length - 1] : autosave.settled();
  };

  const close = async () => {
    if (!(await saveText())) return; // keep the dialog open to show the error
    onClose();
  };

  const followLink = async (href) => {
    if (!(await saveText())) return;
    onLessonLink(href);
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
    <InternalLinkContext.Provider value={followLink}>
    <Dialog title={content.title} onClose={close} wide>
      <div className="lp-feedback">
        <Chips level={content.level} labelIds={content.labelIds} categories={content.categories} kind={isZijpad ? t("kind.zijpad") : t("kind.stap")} />
        <StepFeedback step={step} title={content.title} />
      </div>
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
              <input
                value={zijpad.title}
                onChange={(e) => setZijpad({ ...zijpad, title: e.target.value })}
                onBlur={saveText}
              />
            </label>
            <label className="fb-field" style={{ flex: "1 1 100px" }}>
              <span>{t("lp.level")}</span>
              <select value={zijpad.level} onChange={(e) => changeLevel(e.target.value)}>
                <option value="">{t("step.levelNone")}</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="fb-field">
            <span>{t("lp.explanation")}</span>
            <RichEditor
              value={zijpad.explanation}
              onChange={(explanation) => setZijpad((z) => ({ ...z, explanation }))}
              onBlur={saveText}
              label={t("lp.explanation")}
            />
          </div>
        </>
      ) : (
        content.explanation.trim() && (
          <div className="lp-section">
            <h4>{t("lp.explanation")}</h4>
            <Markdown className="lp-explanation">{content.explanation}</Markdown>
          </div>
        )
      )}

      {grammarCount(content.topicIds) > 0 && (
        <div className="lp-section">
          <h4>{t("lg.title")}</h4>
          <GrammarView ids={content.topicIds} />
        </div>
      )}

      {lessonVerbs(content.verbIds).length > 0 && (
        <div className="lp-section">
          <h4>{t("lv.title")}</h4>
          <VerbsView ids={content.verbIds} />
        </div>
      )}

      {toLists(content.wordList).some(hasWordList) && (
        <div className="lp-section">
          <h4>{t("wl.title")}</h4>
          <WordListsView value={content.wordList} />
        </div>
      )}

      {toLists(content.sentenceList).some(hasSentenceList) && (
        <div className="lp-section">
          <h4>{t("sl.title")}</h4>
          <SentenceListsView value={content.sentenceList} />
        </div>
      )}

      {content.attachments.length > 0 && (
        <div className="lp-section">
          <h4>{t("files.title")}</h4>
          <LessonFiles attachments={content.attachments} canEdit={false} />
        </div>
      )}

      {/* Extra links for this one student (the lesson's own links live in the uitleg). */}
      {(isDocent || step.extras.length > 0) && (
        <div className="lp-section">
          <h4>{t("step.extras")}</h4>
          {isDocent ? (
            <LinksEditor value={extras} onChange={changeExtras} addLabel={t("links.addExtra")} />
          ) : (
            <LinkList extras={step.extras} />
          )}
        </div>
      )}

      {canArrange && (
        <label className="fb-field">
          <span>{t("lp.lane")}</span>
          <select value={laneId} onChange={(e) => moveTo(e.target.value)}>
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
            onBlur={saveText}
            placeholder={t("step.notePh")}
          />
        </label>
      )}

      {error && <div className="auth-error">{error}</div>}

      {canArrange && <SaveStatus status={autosave.status} error={autosave.error} />}

      {isDocent && (
        <div className="lp-actions">
          <button className="lp-danger" onClick={remove}>
            {t("step.remove")}
          </button>
        </div>
      )}
    </Dialog>
    </InternalLinkContext.Provider>
  );
}

/** Feedback on a step: a stap counts for its lesson (so all students' feedback meets), a zijpad for itself. */
function StepFeedback({ step, title }) {
  return step.lesson_id ? (
    <FeedbackButton itemType="lesson" itemId={step.lesson_id} itemLabel={title} />
  ) : (
    <FeedbackButton itemType="zijpad" itemId={step.id} itemLabel={title} />
  );
}
