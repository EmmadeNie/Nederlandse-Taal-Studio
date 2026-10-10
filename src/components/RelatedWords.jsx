import { useState } from "react";
import { useI18n } from "../i18n/context";
import { getItem } from "../data";
import { Dialog } from "../leerpad/shared";
import { LevelBadge } from "./Badges";
import VerbCard from "./VerbCard";

/**
 * The words linked to a grammar topic (relatedWordIds): verbs as compact tiles
 * with only the conjugations (irregular forms in orange) — click the verb for
 * its full card; other words as chips.
 */
export default function RelatedWords({ ids = [] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(null); // verb shown in full
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
          <div className="rw-verbs">
            {verbs.map((v) => (
              <VerbTile key={v.id} verb={v} onOpen={() => setOpen(v)} />
            ))}
          </div>
        </>
      )}
      {others.length > 0 && (
        <>
          <h4>{t("rw.words", { n: others.length })}</h4>
          <ul className="rw-chips">
            {others.map((w) => (
              <li key={w.id}>
                {w.article && <span className="dim">{w.article} </span>}
                <strong>{w.nl}</strong> <span className="dim">· {w.en}</span>{" "}
                {w.introducedAtLevel && <LevelBadge level={w.introducedAtLevel} />}
              </li>
            ))}
          </ul>
        </>
      )}
      {open && (
        <Dialog title={open.nl} onClose={() => setOpen(null)}>
          <VerbCard verb={open} />
        </Dialog>
      )}
    </div>
  );
}

/** Only the conjugations; forms marked irregular are orange. */
function VerbTile({ verb: v, onOpen }) {
  const { t } = useI18n();
  const c = v.conjugation;
  const irregular = (form) => c.regularity?.[form] === "irregular";
  return (
    <div className="rw-tile">
      <button type="button" className="rw-tile-name" onClick={onOpen} title={t("rw.openVerb", { name: v.nl })}>
        {c.infinitive || v.nl}
      </button>
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
