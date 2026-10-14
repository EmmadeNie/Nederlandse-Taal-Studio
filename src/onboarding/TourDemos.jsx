import { useState } from "react";
import { useI18n } from "../i18n/context";

/**
 * Tiny try-it-yourself examples in the tour, one per kind of exercise, at the
 * easiest level. They work on their own (no content needed) and only show
 * what the real exercise feels like.
 */

/** Flashcards: tap to turn. */
export function FlipDemo() {
  const { t } = useI18n();
  const [turned, setTurned] = useState(false);
  return (
    <div className="tour-demo">
      <button type="button" className={`tour-flip ${turned ? "is-turned" : ""}`} onClick={() => setTurned((x) => !x)}>
        <span className="tour-flip-lang">{turned ? "EN" : "NL"}</span>
        <strong lang={turned ? "en" : "nl"}>{turned ? "house" : "het huis"}</strong>
        <span className="dim">{turned ? t("tour.demo.flipBack") : t("tour.demo.tap")}</span>
      </button>
      {turned && <p className="dim tour-demo-note">{t("tour.demo.flipNote")}</p>}
    </div>
  );
}

/** A sentence with one gap, checked on Enter or "Controleren". */
function GapDemo({ before, after, answer, hint }) {
  const { t } = useI18n();
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState(null);
  const check = (e) => {
    e.preventDefault();
    if (!typed.trim()) return;
    setResult(typed.trim().toLowerCase() === answer ? "right" : "wrong");
  };
  return (
    <form className={`tour-demo tour-gap ${result ? `is-${result}` : ""}`} onSubmit={check}>
      {hint && <span className="tour-demo-hint">{hint}</span>}
      <span className="tour-gap-sentence" lang="nl">
        {before}
        <input
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            setResult(null);
          }}
          size={Math.max(4, typed.length + 1)}
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          aria-label={t("vd.answer")}
        />
        {after}
      </span>
      <span className="tour-gap-row">
        <button type="submit" className="fb-btn-secondary" disabled={!typed.trim()}>
          {t("vd.check")}
        </button>
        {result === "right" && <span className="tour-ok">✓ {t("vd.right")}</span>}
        {result === "wrong" && (
          <span className="tour-wrong">
            {t("vd.wrong")} <strong>{answer}</strong>
          </span>
        )}
      </span>
    </form>
  );
}

/** Invullen: the marked word is the gap, the English sentence the hint. */
export function FillDemo() {
  return <GapDemo before="Het boek ligt " after=" de tafel." answer="op" hint="The book is on the table." />;
}

/** Vervoegen: the right form for the subject. */
export function ConjugateDemo() {
  return <GapDemo before="Ik " after=" in een café." answer="werk" hint="werken · to work" />;
}
