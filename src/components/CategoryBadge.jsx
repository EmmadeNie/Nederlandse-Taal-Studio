import { useI18n } from "../i18n/context";
import { categoryOf } from "../data/topicCategory";

/** "Grammatica" / "Spelling" / "Uitspraak" on a topic. */
export default function CategoryBadge({ topic }) {
  const { t } = useI18n();
  const cat = categoryOf(topic);
  return <span className={`cat-badge cat-${cat}`}>{t(`cat.${cat}`)}</span>;
}
