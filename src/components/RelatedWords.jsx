import { useState } from "react";
import { useI18n } from "../i18n/context";
import { getItem } from "../data";
import { Dialog } from "../leerpad/shared";
import { LevelBadge } from "./Badges";
import FeedbackButton from "../feedback/FeedbackButton";
import VerbCard from "./VerbCard";

/**
 * The words linked to a grammar topic (relatedWordIds), as tiles: verbs with only
 * the conjugations (irregular forms in orange; click the verb for its full card),
 * other words like on the Woordenschat page, with their translation.
 */
export default function RelatedWords({ ids = [] }) {
  const { t } = useI18n();
  const words = ids.map((id) => getItem(id)).filter(Boolean);
  if (!words.length) return null;
  const verbs = words.filter((w) => w.partOfSpeech === "verb" && w.conjugation);
  const others = words.filter((w) => !verbs.includes(w));

  return (
    // Clicks in here shouldn't fold the grammar card it sits in.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className="related-words" onClick={(e) => e.stopPropagation()}>
      {verbs.length > 0 && (
        <>
          <h4>{t("rw.verbs", { n: verbs.length })}</h4>
          <VerbTiles verbs={verbs} />
        </>
      )}
      {others.length > 0 && (
        <>
          <h4>{t("rw.words", { n: others.length })}</h4>
          <div className="rw-words">
            {others.map((w) => (
              <WordTile key={w.id} word={w} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Verbs as conjugation tiles; click one for its full card. */
export function VerbTiles({ verbs }) {
  const [open, setOpen] = useState(null); // verb shown in full
  return (
    <>
      <div className="rw-verbs">
        {verbs.map((v) => (
          <VerbTile key={v.id} verb={v} onOpen={() => setOpen(v)} />
        ))}
      </div>
      {open && (
        <Dialog title={open.nl} onClose={() => setOpen(null)}>
          <VerbCard verb={open} />
        </Dialog>
      )}
    </>
  );
}

/** A word that is not a verb, as on the Woordenschat page: word, translation, plural. */
function WordTile({ word: w }) {
  const { t } = useI18n();
  return (
    <div className="card rw-word">
      <div className="card-header">
        {w.article && <span className="article">{w.article}</span>}
        <span className="word">{w.nl}</span>
        <LevelBadge level={w.introducedAtLevel} />
      </div>
      <div className="translation">
        {w.en}
        {w.plural && (
          <span className="rw-word-plural">
            {t("words.plural")} {w.plural}
          </span>
        )}
      </div>
      <div className="card-footer">
        <FeedbackButton itemType="word" itemId={w.id} itemLabel={`${w.article ? w.article + " " : ""}${w.nl} (${w.en})`} />
      </div>
    </div>
  );
}

/** Only the conjugations; forms marked irregular are orange. Without onOpen the name is plain text. */
export function VerbTile({ verb: v, onOpen }) {
  const { t } = useI18n();
  const c = v.conjugation;
  const irregular = (form) => c.regularity?.[form] === "irregular";
  return (
    <div className="rw-tile">
      {onOpen ? (
        <button type="button" className="rw-tile-name" onClick={onOpen} title={t("rw.openVerb", { name: v.nl })}>
          {c.infinitive || v.nl}
        </button>
      ) : (
        <span className="rw-tile-name">{c.infinitive || v.nl}</span>
      )}
      <Row label="ik" value={c.present?.ik} irregular={irregular("present")} />
      <Row label="jij" value={c.present?.jij} irregular={irregular("present")} />
      <Row label="hij/zij" value={c.present?.hij} irregular={irregular("present")} />
      <Row label="wij" value={c.present?.wij} irregular={irregular("present")} />
      <div className="rw-sep" />
      <Row label={t("verbs.sg")} value={c.past?.singular} irregular={irregular("past")} />
      <Row label={t("verbs.pl")} value={c.past?.plural} irregular={irregular("past")} />
      <div className="rw-sep" />
      <Row label={t("verbs.participle")} prefix={c.auxiliary} value={c.participle} irregular={irregular("participle")} />
    </div>
  );
}

/** One form; `prefix` (the auxiliary) stays plain, only the form itself turns orange. */
function Row({ label, prefix, value, irregular }) {
  return (
    <div className="rw-row">
      <span className="dim">{label}</span>
      <span>
        {prefix && <span className="dim">{prefix} </span>}
        <span className={irregular ? "rw-irregular" : undefined}>{value}</span>
      </span>
    </div>
  );
}
