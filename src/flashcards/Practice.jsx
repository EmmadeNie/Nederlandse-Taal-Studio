import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/context";
import { LEVELS } from "../data";
import { VerbTile } from "../components/RelatedWords";
import { CaretLeft } from "../icons";
import { requeue, shuffle } from "./cards";
import FlagButton from "../review/FlagButton";

const DIRECTIONS = ["nl-en", "en-nl", "mix"];
const SIZES = [10, 20, 0]; // 0 = all at once
const randomDir = () => (Math.random() < 0.5 ? "nl-en" : "en-nl");
const levelOf = (card) => card.item.introducedAtLevel || null;

// Settings per list (level, round size, direction), kept on this device.
const DEFAULTS = { level: "all", size: 10, direction: "nl-en" };
function loadSettings(key) {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(`fc:${key}`) || "{}") };
  } catch {
    return DEFAULTS;
  }
}
function saveSettings(key, settings) {
  try {
    localStorage.setItem(`fc:${key}`, JSON.stringify(settings));
  } catch {
    // private mode: settings just aren't remembered
  }
}

/**
 * Practise a pile of cards, made for a phone: tap the card to see the answer,
 * then "Nog eens" (comes back a few cards later) or "Ik wist het". Swipe
 * left/right does the same; keys: space, ← →, backspace = vorige.
 * Long lists are practised in rounds (10, 20 or all), optionally one level only.
 */
export default function Practice({ cards, title, onExit, onFinish, finishLabel, settingsKey }) {
  const { t } = useI18n();
  const levels = LEVELS.filter((l) => cards.some((c) => levelOf(c) === l));
  const [settings, setSettingsState] = useState(() => {
    const s = loadSettings(settingsKey);
    return levels.includes(s.level) ? s : { ...s, level: "all" };
  });
  const poolFor = (level) => (level === "all" ? cards : cards.filter((c) => levelOf(c) === level));
  const [order, setOrder] = useState(() => shuffle(poolFor(settings.level))); // this session's card order
  const [round, setRound] = useState(0);
  const rounds = settings.size ? Math.max(1, Math.ceil(order.length / settings.size)) : 1;
  const chunk = (r, ord = order, size = settings.size) => (size ? ord.slice(r * size, (r + 1) * size) : ord);

  const deal = (list, dir = settings.direction) => list.map((card) => ({ card, dir: dir === "mix" ? randomDir() : dir }));
  const [queue, setQueue] = useState(() => deal(chunk(0)));
  const [flipped, setFlipped] = useState(false);
  const [hard, setHard] = useState(() => new Set()); // ids answered "nog eens" in this round
  const [misses, setMisses] = useState(() => new Map()); // id → how often "nog eens" this round
  const [total, setTotal] = useState(() => chunk(0).length);
  // Earlier states, so "Vorige" can undo the last answer and show that card again.
  const [history, setHistory] = useState([]);

  const play = (list, dir) => {
    setTotal(list.length);
    setQueue(deal(list, dir));
    setFlipped(false);
    setHard(new Set());
    setMisses(new Map());
    setHistory([]);
  };

  const update = (patch) => {
    const next = { ...settings, ...patch };
    setSettingsState(next);
    saveSettings(settingsKey, next);
    return next;
  };

  const chooseLevel = (level) => {
    const next = update({ level });
    const ord = shuffle(poolFor(level));
    setOrder(ord);
    setRound(0);
    play(chunk(0, ord, next.size), next.direction);
  };
  const chooseSize = (size) => {
    const next = update({ size });
    setRound(0);
    play(chunk(0, order, size), next.direction);
  };
  const chooseDirection = (direction) => {
    update({ direction });
    play(chunk(round), direction);
  };
  const goRound = (r) => {
    setRound(r);
    play(chunk(r));
  };
  const startOver = () => {
    const ord = shuffle(poolFor(settings.level));
    setOrder(ord);
    setRound(0);
    play(chunk(0, ord));
  };

  const previous = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setQueue(last.queue);
    setHard(last.hard);
    setMisses(last.misses);
    setFlipped(false);
  };

  const current = queue[0];
  const answer = (knew) => {
    if (!current || !flipped) return;
    setHistory((h) => [...h, { queue, hard, misses }]);
    setFlipped(false);
    if (knew) {
      setQueue((q) => q.slice(1));
    } else {
      setHard((h) => new Set(h).add(current.card.id));
      // Back into the pile, each time a bit further (see requeue).
      const n = (misses.get(current.card.id) || 0) + 1;
      setMisses((m) => new Map(m).set(current.card.id, n));
      setQueue((q) => requeue(q, n));
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, select, textarea")) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "ArrowLeft") answer(false);
      else if (e.key === "ArrowRight") answer(true);
      else if (e.key === "Backspace") previous();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Swipe after turning: left = nog eens, right = wist het.
  const touch = useRef(null);
  const onTouchStart = (e) => (touch.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touch.current == null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    touch.current = null;
    if (flipped && Math.abs(dx) > 60) answer(dx > 0);
  };

  const done = total - queue.length;
  const header = (
    <>
      <div className="fc-top">
        <button type="button" className="fc-back" onClick={onExit} aria-label={t("fc.back")}>
          <CaretLeft weight="bold" />
        </button>
        <div className="fc-title">
          <strong>{title}</strong>
          <span className="dim">
            {rounds > 1 && `${t("fc.round", { r: round + 1, n: rounds })} · `}
            {t("fc.progress", { done, n: total })}
          </span>
        </div>
        <select value={settings.direction} onChange={(e) => chooseDirection(e.target.value)} aria-label={t("fc.direction")}>
          {DIRECTIONS.map((d) => (
            <option key={d} value={d}>
              {t(`fc.dir.${d}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="fc-settings">
        {levels.length > 1 && (
          <div className="fc-seg" role="group" aria-label={t("fc.levelFilter")}>
            {["all", ...levels].map((l) => (
              <button key={l} type="button" aria-pressed={settings.level === l} onClick={() => chooseLevel(l)}>
                {l === "all" ? t("fc.allLevels") : l}
              </button>
            ))}
          </div>
        )}
        {poolFor(settings.level).length > SIZES[0] && (
          <div className="fc-seg" role="group" aria-label={t("fc.roundSize")}>
            {SIZES.map((s) => (
              <button key={s} type="button" aria-pressed={settings.size === s} onClick={() => chooseSize(s)}>
                {s ? s : t("fc.allCards")}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  if (!current) {
    const roundCards = chunk(round);
    const hardCards = roundCards.filter((c) => hard.has(c.id));
    const more = round < rounds - 1;
    const nextCount = chunk(round + 1).length;
    return (
      <div className="fc-practice">
        {header}
        <div className="fc-done">
          <div className="fc-done-big">{more ? "👏" : "🎉"}</div>
          <h3>{more ? t("fc.roundDone", { r: round + 1, n: rounds }) : t("fc.doneTitle")}</h3>
          <p className="dim">{t("fc.doneText", { n: total, hard: hardCards.length })}</p>
          <div className="fc-done-actions">
            {more && (
              <button type="button" className="fb-btn-primary" onClick={() => goRound(round + 1)}>
                {t("fc.nextRound", { n: nextCount })}
              </button>
            )}
            {hardCards.length > 0 && (
              <button
                type="button"
                className={more ? "fb-btn-secondary" : "fb-btn-primary"}
                onClick={() => play(shuffle(hardCards))}
              >
                {t("fc.onlyHard", { n: hardCards.length })}
              </button>
            )}
            {more ? (
              <button type="button" className="fb-btn-secondary" onClick={() => goRound(round)}>
                {t("fc.roundAgain")}
              </button>
            ) : (
              <>
                {onFinish && (
                  <button type="button" className={hardCards.length ? "fb-btn-secondary" : "fb-btn-primary"} onClick={onFinish}>
                    {finishLabel || t("fc.finish")}
                  </button>
                )}
                <button type="button" className="fb-btn-secondary" onClick={startOver}>
                  {t("fc.again")}
                </button>
              </>
            )}
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

  const { card, dir } = current;
  const askNl = dir === "nl-en";
  const front = askNl ? card.nl : card.en;
  const back = askNl ? card.en : card.nl;

  return (
    <div className="fc-practice">
      {header}
      <div className="fc-bar" aria-hidden="true">
        <div className="fc-bar-fill" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <button
        type="button"
        className={`fc-card ${flipped ? "is-flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-label={flipped ? t("fc.turnBack") : t("fc.turn")}
      >
        <span className="fc-lang">{askNl ? "NL" : "EN"}</span>
        <span className={`fc-front ${card.kind === "sentence" ? "is-sentence" : ""}`} lang={askNl ? "nl" : "en"}>
          {front}
        </span>
        {flipped ? (
          <span className="fc-back-side">
            <span className="fc-lang">{askNl ? "EN" : "NL"}</span>
            <span className={`fc-answer ${card.kind === "sentence" ? "is-sentence" : ""}`} lang={askNl ? "en" : "nl"}>
              {back}
            </span>
            {card.kind === "word" && card.item.plural && (
              <span className="dim fc-extra">
                {t("words.plural")} {card.item.plural}
              </span>
            )}
            {card.kind === "verb" && (
              <span className="fc-verb">
                <VerbTile verb={card.item} />
              </span>
            )}
          </span>
        ) : (
          <span className="dim fc-tap">{t("fc.tap")}</span>
        )}
      </button>
      <div className="fc-nav">
        <button type="button" className="fb-link" onClick={previous} disabled={!history.length}>
          ← {t("fc.previous")}
        </button>
        <FlagButton item={card.item} />
      </div>
      <div className="fc-actions">
        <button type="button" className="fc-again" onClick={() => answer(false)} disabled={!flipped}>
          {t("fc.notYet")}
        </button>
        <button type="button" className="fc-knew" onClick={() => answer(true)} disabled={!flipped}>
          {t("fc.knew")}
        </button>
      </div>
      <p className="dim fc-help">{t("fc.help")}</p>
    </div>
  );
}
