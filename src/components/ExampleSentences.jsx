import { useI18n } from "../i18n/context";
import { getItem } from "../data";
import Fold from "../leerpad/Fold";
import { ICONS } from "../icons";

/** Sentences under a grammar rule: the ones the docent picked (exampleSentenceIds, in that order). */
export default function ExampleSentences({ ids = [], folded = false }) {
  const { t } = useI18n();
  const list = ids.map((id) => getItem(id)).filter(Boolean);
  if (!list.length) return null;
  if (folded) {
    return (
      <Fold icon={ICONS.sentences} title={t("ex.sentenceCount", { n: list.length })} sub={list[0].nl}>
        <div className="example-sentences">
          <SentenceItems list={list} />
        </div>
      </Fold>
    );
  }
  return (
    <div className="example-sentences">
      <h4>{t("ex.picked", { n: list.length })}</h4>
      <SentenceItems list={list} />
    </div>
  );
}

function SentenceItems({ list }) {
  return (
    <ul>
      {list.map((s) => (
        <li key={s.id}>
          <div>{s.nl}</div>
          <div className="dim">{s.en}</div>
        </li>
      ))}
    </ul>
  );
}
