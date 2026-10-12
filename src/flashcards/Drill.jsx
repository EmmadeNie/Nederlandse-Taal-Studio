import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n/context";
import { VerbTile } from "../components/RelatedWords";
import { CaretLeft } from "../icons";
import { shuffle } from "./cards";
import { gapQuestions, gapRound, isRight, makeRound, markQuestions } from "./conjugate";
import { sentences } from "../data";

const SIZES = [10, 20];
// "to work, to labour" → "to work"
const shortEn = (en) => (en || "").split(/[,;/]/)[0].trim();

/**
 * Typing drill, made for a phone: type the missing word, Enter checks. Right
 * goes on by itself; wrong shows the right answer and the question comes back
 * a few questions later.
 *
 * kind="verbs" (Vervoegen): loose forms ("Wij ___ (maken)") or gap sentences
 * from the library ("Ik ___ elke dag mijn lunch zelf. (maken)"), with the
 * verb as hint in Dutch or English; wrong shows the verb's table.
 * kind="fill" (Invullen): sentences with a marked word from `words` as the gap
 * ("Het boek ligt ___ de tafel."), per kind of word (voorzetsel, vraagwoord,
 * …), with the English sentence as hint (or none).
 */
export default function Drill({ kind = "verbs", verbs = [], words = [], title, onExit }) {
  const { t } = useI18n();
  const fill = kind === "fill";
  const gaps = useMemo(() => (fill ? [] : gapQuestions(verbs, sentences)), [fill, verbs]);
  const marked = useMemo(() => (fill ? markQuestions(words, sentences) : []), [fill, words]);
  const markKinds = [...new Set(marked.map((q) => q.kind))];
  const modes = fill
    ? markKinds.length > 1
      ? ["all", ...markKinds]
      : []
    : gaps.length
      ? ["forms", "sentences"]
      : [];
  const [mode, setMode] = useState(fill ? "all" : "forms");
  const [hint, setHint] = useState(fill ? "en" : "nl"); // verbs: nl | en (verb hint); fill: en | none (sentence hint)
  const [size, setSize] = useState(10);
  const build = (m = mode, n = size) =>
    fill
      ? gapRound(m === "all" ? marked : marked.filter((q) => q.kind === m), n)
      : m === "sentences"
        ? gapRound(gaps, n)
        : makeRound(verbs, n);
  const [queue, setQueue] = useState(() => build());
  const [total, setTotal] = useState(queue.length);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState(null); // null | "right" | "wrong"
  const [wrong, setWrong] = useState(() => new Map()); // id → question answered wrong this round
  const input = useRef(null);
  const timer = useRef(null);

  const current = queue[0];
  useEffect(() => input.current?.focus(), [current, result]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const start = (list) => {
    clearTimeout(timer.current);
    setQueue(list);
    setTotal(list.length);
    setTyped("");
    setResult(null);
    setWrong(new Map());
  };

  const next = () => {
    clearTimeout(timer.current);
    setTyped("");
    if (result === "wrong") {
      // Back in a few questions later.
      setQueue((q) => {
        const rest = q.slice(1);
        const at = Math.min(3, rest.length);
        return [...rest.slice(0, at), q[0], ...rest.slice(at)];
      });
    } else {
      setQueue((q) => q.slice(1));
    }
    setResult(null);
  };

  const check = (e) => {
    e.preventDefault();
    if (result) return next();
    if (!typed.trim()) return;
    if (isRight(current, typed)) {
      setResult("right");
      timer.current = setTimeout(() => {
        setTyped("");
        setResult(null);
        setQueue((q) => q.slice(1));
      }, 700);
    } else {
      setResult("wrong");
      setWrong((w) => new Map(w).set(current.id, current));
    }
  };

  const done = total - queue.length;
  const kindLabel = (k) => (t(`marks.kinds.${k}`) === `marks.kinds.${k}` ? k : t(`marks.kinds.${k}`));
  const modeLabel = (m) => (!fill ? t(`vd.mode.${m}`) : m === "all" ? t("fd.all") : kindLabel(m));
  const header = (
    <>
      <div className="fc-top">
        <button type="button" className="fc-back" onClick={onExit} aria-label={t("fc.back")}>
          <CaretLeft weight="bold" />
        </button>
        <div className="fc-title">
          <strong>
            {fill ? t("fd.title") : t("vd.title")} · {title}
          </strong>
          <span className="dim">{t("fc.progress", { done, n: total })}</span>
        </div>
        <div className="fc-seg" role="group" aria-label={t("fc.roundSize")}>
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={size === s}
              onClick={() => {
                setSize(s);
                start(build(mode, s));
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="fc-settings">
        {modes.length > 0 && (
          <div className="fc-seg" role="group" aria-label={t("vd.kind")}>
            {modes.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => {
                  setMode(m);
                  start(build(m));
                }}
              >
                {modeLabel(m)}
              </button>
            ))}
          </div>
        )}
        {(fill || mode === "sentences") && (
          <div className="fc-seg" role="group" aria-label={t("vd.hintLang")}>
            {(fill ? ["en", "none"] : ["nl", "en"]).map((h) => (
              <button key={h} type="button" aria-pressed={hint === h} onClick={() => setHint(h)}>
                {t(`vd.hint.${h}`)}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="fc-bar" aria-hidden="true">
        <div className="fc-bar-fill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>
    </>
  );

  if (!current) {
    const wrongQuestions = [...wrong.values()];
    return (
      <div className="fc-practice">
        {header}
        <div className="fc-done">
          <div className="fc-done-big">🎉</div>
          <h3>{t("fc.doneTitle")}</h3>
          <p className="dim">{t("vd.doneText", { n: total, wrong: wrong.size })}</p>
          <div className="fc-done-actions">
            {wrongQuestions.length > 0 && (
              <button type="button" className="fb-btn-primary" onClick={() => start(shuffle(wrongQuestions))}>
                {t("vd.onlyWrong", { n: wrongQuestions.length })}
              </button>
            )}
            <button
              type="button"
              className={wrongQuestions.length ? "fb-btn-secondary" : "fb-btn-primary"}
              onClick={() => start(build())}
            >
              {t("vd.newRound")}
            </button>
            <button type="button" className="fb-link" onClick={onExit}>
              {t("fc.back")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { verb, subject, sentence, word } = current;
  const field = (
    <input
      ref={input}
      className="vd-input"
      value={typed}
      onChange={(e) => !result && setTyped(e.target.value)}
      readOnly={!!result}
      autoCapitalize="none"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      enterKeyHint={result ? "next" : "done"}
      aria-label={t("vd.answer")}
      size={Math.max(6, typed.length + 1)}
    />
  );
  // In English-hint mode the Dutch verb only shows once answered.
  const showNl = !sentence || hint === "nl" || result;
  // Invullen: the English sentence is the hint (before answering), unless switched off.
  const showEn = sentence?.en && (fill ? hint === "en" || result : result);
  return (
    <div className="fc-practice">
      {header}
      <form className={`vd-card ${result ? `is-${result}` : ""}`} onSubmit={check}>
        {word ? (
          <span className="vd-verb">{t(`marks.kind.${current.kind}`) === `marks.kind.${current.kind}` ? current.kind : t(`marks.kind.${current.kind}`)}</span>
        ) : (
          <span className="vd-verb">
            {showNl ? verb.nl : <span lang="en">{shortEn(verb.en)}</span>}
            {showNl && verb.en && !sentence && <span className="dim"> · {verb.en}</span>}
          </span>
        )}
        {sentence ? (
          <span className="vd-sentence is-long" lang="nl">
            {current.before}
            {field}
            {current.after}
          </span>
        ) : (
          <span className="vd-sentence" lang="nl">
            {subject.question ? (
              <>
                {field} {subject.text}…?
              </>
            ) : (
              <>
                {subject.text} {field}
              </>
            )}
          </span>
        )}
        {showEn && (
          <span className="dim vd-hint" lang="en">
            {sentence.en}
          </span>
        )}
        {subject?.question && <span className="dim vd-hint">{t("vd.questionHint")}</span>}
        {result === "right" && <span className="vd-feedback is-right">✓ {t("vd.right")}</span>}
        {result === "wrong" && (
          <span className="vd-feedback is-wrong">
            {t("vd.wrong")} <strong>{current.answers[0]}</strong>
          </span>
        )}
        {result === "wrong" && verb && (
          <span className="fc-verb">
            <VerbTile verb={verb} />
          </span>
        )}
        <button type="submit" className="fb-btn-primary vd-submit" disabled={!result && !typed.trim()}>
          {result === "wrong" ? t("vd.next") : t("vd.check")}
        </button>
      </form>
    </div>
  );
}

