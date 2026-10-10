import { useI18n } from "../i18n/context";
import { getItem } from "../data";

/**
 * Sentences under a grammar rule: the ones the docent picked
 * (exampleSentenceIds, in that order). `fallback` (sentences found through the
 * grammar tags) is shown only while none are picked.
 */
export default function ExampleSentences({ ids = [], fallback = [] }) {
  const { t } = useI18n();
  const picked = ids.map((id) => getItem(id)).filter(Boolean);
  const list = picked.length ? picked : fallback;
  if (!list.length) return null;
  return (
    <div className="example-sentences">
      <h4>{picked.length ? t("ex.picked", { n: list.length }) : t("topics.related", { n: list.length })}</h4>
      <ul>
        {list.map((s) => (
          <li key={s.id}>
            <div>{s.nl}</div>
            <div className="dim">{s.en}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
