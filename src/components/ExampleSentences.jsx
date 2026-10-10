import { useI18n } from "../i18n/context";
import { getItem } from "../data";

/** Sentences under a grammar rule: the ones the docent picked (exampleSentenceIds, in that order). */
export default function ExampleSentences({ ids = [] }) {
  const { t } = useI18n();
  const list = ids.map((id) => getItem(id)).filter(Boolean);
  if (!list.length) return null;
  return (
    <div className="example-sentences">
      <h4>{t("ex.picked", { n: list.length })}</h4>
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
