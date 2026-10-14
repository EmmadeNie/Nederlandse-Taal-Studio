import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n/context";
import { VerbTile } from "../components/RelatedWords";
import { CaretLeft } from "../icons";
import { shuffle } from "./cards";
import { TENSES, drillable, gapIsRight, gapQuestions, gapRound, isRight, isRightGaps, makeRound, markQuestions } from "./conjugate";
import { LEVELS, sentences } from "../data";
import { pronounKindsIn, pronounQuestions } from "./pronouns";

const SIZES = [10, 20];
const rank = (level) => (LEVELS.includes(level) ? LEVELS.indexOf(level) : LEVELS.length);
// Sentences up to a level ("all" = every level); a sentence without a level only shows with "all".
const upToLevel = (questions, upTo) => (upTo === "all" ? questions : questions.filter((q) => rank(q.sentence?.introducedAtLevel) <= rank(upTo)));
// The chosen level per list, kept on this device.
const loadLevel = (key) => {
  try {
    return localStorage.getItem(`drill-level:${key}`);
  } catch {
    return null;
  }
};
const saveLevel = (key, value) => {
  try {
    localStorage.setItem(`drill-level:${key}`, value);
  } catch {
    // private mode: not remembered
  }
};
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
 * Sentences go up to a level ("t/m A1"): at first the level of the lesson or
 * list (`level`), or what was chosen last time for this list (`settingsKey`).
 */
export default function Drill({
  kind = "verbs",
  verbs = [],
  words = [],
  pronounSentences = [],
  sentencePool = null, // In zinnen from these sentences (a lesson's sentence list) instead of the whole library
  tense: startTense,
  title,
  level,
  settingsKey,
  onExit,
  onFinish,
  finishLabel,
}) {
  const { t } = useI18n();
  const fill = kind === "fill";
  const pron = kind === "pronouns"; // Voornaamwoorden: the marked pronouns of `pronounSentences` are the gaps
  // Vervoegen: tegenwoordige tijd, verleden tijd or perfectum (only the tenses these verbs have forms for).
  const tenses = fill || pron ? [] : TENSES.filter((tn) => drillable(verbs, tn).length);
  const [tense, setTense] = useState(() => (tenses.includes(startTense) ? startTense : "present"));
  const gapsByTense = useMemo(() => {
    const pool = sentencePool || sentences;
    const by = Object.fromEntries(TENSES.map((tn) => [tn, fill || pron ? [] : gapQuestions(verbs, pool, tn)]));
    by.perfectAux = fill || pron ? [] : gapQuestions(verbs, pool, "perfect", { auxOnly: true });
    return by;
  }, [fill, pron, verbs, sentencePool]);
  const gaps = gapsByTense[tense];
  // Perfectum in zinnen: both boxes (hulpwerkwoord + deelwoord) or "alleen hebben/zijn".
  const [auxOnly, setAuxOnly] = useState(false);
  const gapsFor = (tn, aux = auxOnly) => (tn === "perfect" && aux ? gapsByTense.perfectAux : gapsByTense[tn]);
  const marked = useMemo(() => (fill ? markQuestions(words, sentences) : []), [fill, words]);
  const pronouns = useMemo(() => (pron ? pronounQuestions(pronounSentences) : []), [pron, pronounSentences]);
  const markKinds = [...new Set(marked.map((q) => q.kind))];
  const pronounKinds = pron ? pronounKindsIn(pronounSentences) : [];
  const modes = pron
    ? pronounKinds.length > 1
      ? ["all", ...pronounKinds]
      : []
    : fill
      ? markKinds.length > 1
        ? ["all", ...markKinds]
        : []
      : gaps.length
        ? ["forms", "sentences"]
        : [];
  const [mode, setMode] = useState(fill || pron ? "all" : "forms");
  // verbs: nl | en (verb hint); fill: en | none (sentence hint); pronouns: kind | person (what each gap says)
  const [hint, setHint] = useState(fill ? "en" : pron ? "kind" : "nl");
  const [size, setSize] = useState(10);
  const sentenceLevels = LEVELS.filter((l) => [...gaps, ...marked, ...pronouns].some((q) => q.sentence.introducedAtLevel === l));
  const [upTo, setUpTo] = useState(() => {
    const saved = settingsKey && loadLevel(settingsKey);
    if (saved === "all" || LEVELS.includes(saved)) return saved;
    return LEVELS.includes(level) ? level : "all";
  });
  const build = (m = mode, n = size, u = upTo, tn = tense) =>
    pron
      ? gapRound(upToLevel(m === "all" ? pronouns : pronounQuestions(pronounSentences, m), u), n)
      : fill
      ? gapRound(upToLevel(m === "all" ? marked : marked.filter((q) => q.kind === m), u), n)
      : m === "sentences"
        ? gapRound(upToLevel(gapsFor(tn), u), n)
        : makeRound(verbs, n, tn);
  const chooseAuxOnly = (aux) => {
    setAuxOnly(aux);
    start(gapRound(upToLevel(gapsFor("perfect", aux), upTo), size));
  };
  const chooseTense = (tn) => {
    setTense(tn);
    // No sentences in that tense: back to loose forms.
    const m = mode === "sentences" && !gapsByTense[tn].length ? "forms" : mode;
    setMode(m);
    start(build(m, size, upTo, tn));
  };
  const chooseLevel = (u) => {
    setUpTo(u);
    if (settingsKey) saveLevel(settingsKey, u);
    start(build(mode, size, u));
  };
  const [queue, setQueue] = useState(() => build());
  const [total, setTotal] = useState(queue.length);
  const [typed, setTyped] = useState("");
  const [more, setMore] = useState([]); // the other gaps of a sentence (voornaamwoord, separable part)
  const [result, setResult] = useState(null); // null | "right" | "wrong"
  const [wrong, setWrong] = useState(() => new Map()); // id → question answered wrong this round
  const input = useRef(null);
  const moreInputs = useRef([]);
  const timer = useRef(null);

  const current = queue[0];
  useEffect(() => input.current?.focus(), [current, result]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const start = (list) => {
    clearTimeout(timer.current);
    setQueue(list);
    setTotal(list.length);
    setTyped("");
    setMore([]);
    setResult(null);
    setWrong(new Map());
    setHistory([]);
  };

  // "Vorige": every step on remembers where we were, so you can go back and answer again.
  const [history, setHistory] = useState([]);
  const remember = () => setHistory((h) => [...h, { queue, wrong }]);
  const previous = () => {
    if (!history.length) return;
    clearTimeout(timer.current);
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setQueue(last.queue);
    setWrong(last.wrong);
    setTyped("");
    setMore([]);
    setResult(null);
  };

  const next = () => {
    clearTimeout(timer.current);
    remember();
    setTyped("");
    setMore([]);
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
    const several = Boolean(current.gapAnswers);
    // Several gaps: Enter moves on to the next empty one.
    if (several) {
      const empty = current.gapAnswers.slice(1).findIndex((_, i) => !(more[i] || "").trim());
      if (empty >= 0) return moreInputs.current[empty]?.focus();
    }
    if (several ? isRightGaps(current, [typed, ...more]) : isRight(current, typed)) {
      setResult("right");
      timer.current = setTimeout(() => {
        remember();
        setTyped("");
        setMore([]);
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
  const modeLabel = (m) =>
    pron ? (m === "all" ? t("pd.allKinds") : t(`pd.kind.${m}`)) : !fill ? t(`vd.mode.${m}`) : m === "all" ? t("fd.all") : kindLabel(m);
  const header = (
    <>
      <div className="fc-top">
        <button type="button" className="fc-back" onClick={onExit} aria-label={t("fc.back")}>
          <CaretLeft weight="bold" />
        </button>
        <div className="fc-title">
          <strong>
            {pron ? t("pd.title") : fill ? t("fd.title") : t("vd.title")} · {title}
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
        {(fill || pron || mode === "sentences") &&
          // Several levels, or one that lies above the chosen one (else there would be no way up).
          (sentenceLevels.length > 1 || (sentenceLevels.length === 1 && upTo !== "all" && rank(upTo) < rank(sentenceLevels[0]))) && (
          <div className="fc-seg" role="group" aria-label={t("fc.levelFilter")}>
            {[...LEVELS.slice(0, rank(sentenceLevels[sentenceLevels.length - 1])), "all"].map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={upTo === l || (l === "all" && upTo !== "all" && rank(upTo) >= rank(sentenceLevels[sentenceLevels.length - 1]))}
                onClick={() => chooseLevel(l)}
              >
                {l === "all" ? t("fc.allLevels") : t("fd.upTo", { level: l })}
              </button>
            ))}
          </div>
        )}
        {tenses.length > 1 && (
          <div className="fc-seg" role="group" aria-label={t("vd.tense")}>
            {tenses.map((tn) => (
              <button key={tn} type="button" aria-pressed={tense === tn} onClick={() => chooseTense(tn)}>
                {t(`vd.tense.${tn}`)}
              </button>
            ))}
          </div>
        )}
        {!fill && !pron && tense === "perfect" && mode === "sentences" && gapsByTense.perfectAux.length > 0 && (
          <div className="fc-seg" role="group" aria-label={t("vd.gaps")}>
            {[false, true].map((aux) => (
              <button key={String(aux)} type="button" aria-pressed={auxOnly === aux} onClick={() => chooseAuxOnly(aux)}>
                {aux ? t("vd.auxOnly") : t("vd.auxAndParticiple")}
              </button>
            ))}
          </div>
        )}
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
        {(fill || pron || mode === "sentences") && (
          <div className="fc-seg" role="group" aria-label={t("vd.hintLang")}>
            {(pron ? ["kind", "person"] : fill ? ["en", "none"] : ["nl", "en"]).map((h) => (
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
          {total === 0 ? (
            <p className="dim">{t("fd.noneAtLevel")}</p>
          ) : (
            <>
              <div className="fc-done-big">🎉</div>
              <h3>{t("fc.doneTitle")}</h3>
              <p className="dim">{t("vd.doneText", { n: total, wrong: wrong.size })}</p>
            </>
          )}
          <div className="fc-done-actions">
            {wrongQuestions.length > 0 && (
              <button type="button" className="fb-btn-primary" onClick={() => start(shuffle(wrongQuestions))}>
                {t("vd.onlyWrong", { n: wrongQuestions.length })}
              </button>
            )}
            {onFinish && (
              <button type="button" className={wrongQuestions.length ? "fb-btn-secondary" : "fb-btn-primary"} onClick={onFinish}>
                {finishLabel}
              </button>
            )}
            <button
              type="button"
              className={wrongQuestions.length || onFinish ? "fb-btn-secondary" : "fb-btn-primary"}
              onClick={() => start(build())}
            >
              {t("vd.newRound")}
            </button>
            <button type="button" className="fb-link" onClick={previous} disabled={!history.length}>
              ← {t("fc.previous")}
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
  const inputProps = {
    className: "vd-input",
    readOnly: !!result,
    autoCapitalize: "none",
    autoComplete: "off",
    autoCorrect: "off",
    spellCheck: false,
    enterKeyHint: result ? "next" : "done",
  };
  // Voornaamwoorden: what a gap asks for ("bezittelijk", with "· hij" when the person hint is on).
  const gapHint = (i) => {
    const h = current.hints?.[i];
    if (!h) return undefined;
    const person = (hint === "person" || h.showPerson) && h.person ? ` · ${t(`parts.person.${h.person}`)}` : "";
    return t(`pd.role.${h.role}`) + person;
  };
  // After a wrong answer with several gaps, the right boxes turn green (only the wrong ones red).
  const okClass = (i, value) =>
    result === "wrong" && current.gapAnswers && gapIsRight(current, i, value) ? "vd-input is-ok" : "vd-input";
  const moreField = (i) => (
    <input
      {...inputProps}
      className={okClass(i + 1, more[i] || "")}
      key={`gap${i}`}
      ref={(el) => (moreInputs.current[i] = el)}
      value={more[i] || ""}
      onChange={(e) => {
        if (result) return;
        const v = e.target.value;
        setMore((m) => Object.assign([...m], { [i]: v }));
      }}
      aria-label={t("vd.answerN", { n: i + 2 })}
      placeholder={result ? undefined : gapHint(i + 1)}
      size={Math.max(3, (more[i] || "").length + 1, (gapHint(i + 1) || "").length)}
    />
  );
  const field = (
    <input
      ref={input}
      className={okClass(0, typed)}
      placeholder={result || !current.pieces ? undefined : gapHint(0)}
      value={typed}
      onChange={(e) => !result && setTyped(e.target.value)}
      readOnly={!!result}
      autoCapitalize="none"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      enterKeyHint={result ? "next" : "done"}
      aria-label={t("vd.answer")}
      size={Math.max(6, typed.length + 1, current.pieces ? (gapHint(0) || "").length : 0)}
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
        {current.pronoun ? (
          <span className="vd-verb">
            {current.hints.length === 1 ? gapHint(0) : t("pd.fillAll", { n: current.hints.length })}
          </span>
        ) : word ? (
          <span className="vd-verb">{t(`marks.kind.${current.kind}`) === `marks.kind.${current.kind}` ? current.kind : t(`marks.kind.${current.kind}`)}</span>
        ) : (
          <span className="vd-verb">
            {showNl ? verb.nl : <span lang="en">{shortEn(verb.en)}</span>}
            {showNl && verb.en && !sentence && <span className="dim"> · {verb.en}</span>}
            {tenses.length > 1 && <span className="vd-tense"> · {t(`vd.tense.${current.tense || tense}`)}</span>}
          </span>
        )}
        {sentence && current.pieces ? (
          <span className="vd-sentence is-long" lang="nl">
            {current.pieces[0]}
            {field}
            {current.pieces.slice(1).map((piece, i) => (
              <span key={i}>
                {i > 0 && moreField(i - 1)}
                {piece}
              </span>
            ))}
          </span>
        ) : sentence ? (
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
        {result === "wrong" && current.tense === "perfect" && <span className="vd-rule">{t("vd.auxRule")}</span>}
        {result === "wrong" && verb && (
          <span className="fc-verb">
            <VerbTile verb={verb} />
          </span>
        )}
        <button type="submit" className="fb-btn-primary vd-submit" disabled={!result && !typed.trim()}>
          {result === "wrong" ? t("vd.next") : t("vd.check")}
        </button>
      </form>
      <div className="fc-nav">
        <button type="button" className="fb-link" onClick={previous} disabled={!history.length}>
          ← {t("fc.previous")}
        </button>
      </div>
    </div>
  );
}

