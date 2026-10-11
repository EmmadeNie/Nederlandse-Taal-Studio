import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/context";
import { VerbTile } from "../components/RelatedWords";
import { CaretLeft } from "../icons";
import { shuffle } from "./cards";

const DIRECTIONS = ["nl-en", "en-nl", "mix"];
const randomDir = () => (Math.random() < 0.5 ? "nl-en" : "en-nl");

/**
 * Practise a pile of cards, made for a phone: tap the card to turn it, then
 * "Nog eens" (comes back a few cards later) or "Ik wist het". Swipe left/right
 * does the same; on a keyboard: space turns, ← nog eens, → wist het.
 */
export default function Practice({ cards, title, onExit }) {
  const { t } = useI18n();
  const [direction, setDirection] = useState("nl-en");
  const start = (list, dir = direction) =>
    shuffle(list).map((card) => ({ card, dir: dir === "mix" ? randomDir() : dir }));
  const [queue, setQueue] = useState(() => start(cards));
  const [flipped, setFlipped] = useState(false);
  const [hard, setHard] = useState(() => new Set()); // ids answered "nog eens" at least once
  const [total, setTotal] = useState(cards.length);

  const restart = (list, dir = direction) => {
    setTotal(list.length);
    setQueue(start(list, dir));
    setFlipped(false);
    setHard(new Set());
  };

  const current = queue[0];
  const answer = (knew) => {
    if (!current || !flipped) return;
    setFlipped(false);
    if (knew) {
      setQueue((q) => q.slice(1));
    } else {
      setHard((h) => new Set(h).add(current.card.id));
      // Back into the pile a few cards later (or last, near the end).
      setQueue((q) => {
        const rest = q.slice(1);
        const at = Math.min(3, rest.length);
        return [...rest.slice(0, at), q[0], ...rest.slice(at)];
      });
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
    <div className="fc-top">
      <button type="button" className="fc-back" onClick={onExit} aria-label={t("fc.back")}>
        <CaretLeft weight="bold" />
      </button>
      <div className="fc-title">
        <strong>{title}</strong>
        <span className="dim">{t("fc.progress", { done, n: total })}</span>
      </div>
      <select
        value={direction}
        onChange={(e) => {
          setDirection(e.target.value);
          restart(queue.map((x) => x.card).concat([]), e.target.value);
        }}
        aria-label={t("fc.direction")}
      >
        {DIRECTIONS.map((d) => (
          <option key={d} value={d}>
            {t(`fc.dir.${d}`)}
          </option>
        ))}
      </select>
    </div>
  );

  if (!current) {
    const hardCards = cards.filter((c) => hard.has(c.id));
    return (
      <div className="fc-practice">
        {header}
        <div className="fc-done">
          <div className="fc-done-big">🎉</div>
          <h3>{t("fc.doneTitle")}</h3>
          <p className="dim">{t("fc.doneText", { n: total, hard: hardCards.length })}</p>
          <div className="fc-done-actions">
            {hardCards.length > 0 && (
              <button type="button" className="fb-btn-primary" onClick={() => restart(hardCards)}>
                {t("fc.onlyHard", { n: hardCards.length })}
              </button>
            )}
            <button type="button" className="fb-btn-secondary" onClick={() => restart(cards)}>
              {t("fc.again")}
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
