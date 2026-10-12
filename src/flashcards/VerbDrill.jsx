import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n/context";
import { VerbTile } from "../components/RelatedWords";
import { CaretLeft } from "../icons";
import { shuffle } from "./cards";
import { gapQuestions, gapRound, isRight, makeRound } from "./conjugate";
import { sentences } from "../data";

const SIZES = [10, 20];
// "to work, to labour" → "to work"
const shortEn = (en) => (en || "").split(/[,;/]/)[0].trim();

/**
 * Vervoegen: "Wij ___ (maken)", type the form, Enter checks. Right goes on by
 * itself; wrong shows the right form and the verb's table, and the question
 * comes back a few questions later. Made for a phone.
 * Two kinds: loose forms ("Wij ___") and gap sentences from the library
 * ("Ik ___ elke dag mijn lunch zelf. (maken)"), with the verb as hint in
 * Dutch or English (then you first think of the Dutch verb).
 */
export default function VerbDrill({ verbs, title, onExit }) {
  const { t } = useI18n();
  const gaps = useMemo(() => gapQuestions(verbs, sentences), [verbs]);
  const [mode, setMode] = useState("forms"); // forms | sentences
  const [hint, setHint] = useState("nl"); // nl | en (sentences only)
  const [size, setSize] = useState(10);
  const build = (m = mode, n = size) => (m === "sentences" ? gapRound(gaps, n) : makeRound(verbs, n));
  const [queue, setQueue] = useState(() => makeRound(verbs, 10));
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
  const header = (
    <>
      <div className="fc-top">
        <button type="button" className="fc-back" onClick={onExit} aria-label={t("fc.back")}>
          <CaretLeft weight="bold" />
        </button>
        <div className="fc-title">
          <strong>
            {t("vd.title")} · {title}
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
        {gaps.length > 0 && (
          <div className="fc-seg" role="group" aria-label={t("vd.kind")}>
            {["forms", "sentences"].map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => {
                  setMode(m);
                  start(build(m));
                }}
              >
                {t(`vd.mode.${m}`)}
              </button>
            ))}
          </div>
        )}
        {mode === "sentences" && (
          <div className="fc-seg" role="group" aria-label={t("vd.hintLang")}>
            {["nl", "en"].map((h) => (
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

  const { verb, subject, sentence } = current;
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
  return (
    <div className="fc-practice">
      {header}
      <form className={`vd-card ${result ? `is-${result}` : ""}`} onSubmit={check}>
        <span className="vd-verb">
          {showNl ? verb.nl : <span lang="en">{shortEn(verb.en)}</span>}
          {showNl && verb.en && !sentence && <span className="dim"> · {verb.en}</span>}
        </span>
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
        {sentence && result && sentence.en && (
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
        {result === "wrong" && (
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

