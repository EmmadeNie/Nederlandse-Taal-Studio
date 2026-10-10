import { useI18n } from "../i18n/context";
import { getItem } from "../data";
import { LevelBadge } from "./Badges";
import VerbCard from "./VerbCard";

/**
 * The words linked to a grammar topic (relatedWordIds): verbs as the same
 * cards as in Bibliotheek → Werkwoorden, other words as chips.
 */
export default function RelatedWords({ ids = [] }) {
  const { t } = useI18n();
  const words = ids.map((id) => getItem(id)).filter(Boolean);
  if (!words.length) return null;
  const verbs = words.filter((w) => w.partOfSpeech === "verb" && w.conjugation);
  const others = words.filter((w) => !verbs.includes(w));

  return (
    <div className="related-words">
      {verbs.length > 0 && (
        <>
          <h4>{t("rw.verbs", { n: verbs.length })}</h4>
          <div className="card-grid">
            {verbs.map((v) => (
              <VerbCard key={v.id} verb={v} />
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
    </div>
  );
}
