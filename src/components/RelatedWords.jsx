import { useI18n } from "../i18n/context";
import { getItem } from "../data";
import { LevelBadge } from "./Badges";

/**
 * The words linked to a grammar topic (relatedWordIds): verbs as a small
 * conjugation table (irregular forms marked), other words as chips.
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
          <div className="rw-table-wrap">
            <table className="rw-table">
              <thead>
                <tr>
                  <th>{t("rw.verb")}</th>
                  <th>ik</th>
                  <th>jij</th>
                  <th>hij/zij</th>
                  <th>wij</th>
                  <th>{t("rw.past")}</th>
                  <th>{t("rw.participle")}</th>
                </tr>
              </thead>
              <tbody>
                {verbs.map((v) => {
                  const c = v.conjugation;
                  const irregular = (form) => (c.regularity?.[form] === "irregular" ? "rw-irregular" : undefined);
                  return (
                    <tr key={v.id}>
                      <td>
                        <strong>{c.infinitive || v.nl}</strong> <span className="dim">{v.en}</span>
                      </td>
                      <td className={irregular("present")}>{c.present?.ik}</td>
                      <td className={irregular("present")}>{c.present?.jij}</td>
                      <td className={irregular("present")}>{c.present?.hij}</td>
                      <td className={irregular("present")}>{c.present?.wij}</td>
                      <td className={irregular("past")}>
                        {[c.past?.singular, c.past?.plural].filter(Boolean).join(" / ")}
                      </td>
                      <td className={irregular("participle")}>
                        {c.auxiliary && <span className="dim">{c.auxiliary} </span>}
                        {c.participle}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {verbs.some((v) => Object.values(v.conjugation.regularity || {}).includes("irregular")) && (
            <p className="dim rw-legend">
              <span className="rw-irregular">{t("rw.irregularSample")}</span> = {t("rw.irregular")}
            </p>
          )}
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
