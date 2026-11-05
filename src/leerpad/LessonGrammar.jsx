import { useI18n } from "../i18n/context";
import CategoryBadge from "../components/CategoryBadge";
import { TOPIC_CATEGORIES, categoryOf } from "../data/topicCategory";
import { topicText } from "../components/topicLang";
import { topics } from "../data";
import TopicExplanation from "../components/TopicExplanation";
import RelatedWords from "../components/RelatedWords";
import ExampleSentences from "../components/ExampleSentences";
import { LevelBadge } from "../components/Badges";
import { X } from "../icons";
import { LEVELS } from "./util";
import { knownTopics as known } from "./grammarTopics";
import { ItemPicker } from "../library/FieldInput";


/** The grammar of a lesson: title, level, summary; the explanation opens in place. */
export function GrammarView({ ids, lang }) {
  const list = known(ids);
  if (!list.length) return null;
  return (
    <ul className="lg-list">
      {list.map((topic) => (
        <GrammarItem key={topic.id} topic={topic} lang={lang} />
      ))}
    </ul>
  );
}

/** One topic in a lesson, in the lesson's language. */
function GrammarItem({ topic, lang: lessonLang }) {
  const { lang: appLang } = useI18n();
  const lang = lessonLang || appLang; // the lesson's NL | EN, else the switch top right
  const text = topicText(topic, lang);
  return (
    <li>
      <details>
        <summary>
          <strong lang={lang}>{text.title}</strong> <LevelBadge level={topic.introducedAtLevel} />{" "}
          <CategoryBadge topic={topic} />
          <div className="dim lg-summary" lang={lang}>
            {text.summary}
          </div>
        </summary>
        <TopicExplanation text={text} lang={lang} className="lp-explanation" />
        <RelatedWords ids={topic.relatedWordIds} />
        <ExampleSentences ids={topic.exampleSentenceIds} />
      </details>
    </li>
  );
}

/** Docent: add topics from the grammar library to a lesson (and remove them). */
export function GrammarPicker({ value = [], onChange }) {
  const { t } = useI18n();
  const chosen = known(value);
  const available = topics
    .filter((topic) => !value.includes(topic.id))
    .sort(
      (a, b) =>
        LEVELS.indexOf(a.introducedAtLevel) - LEVELS.indexOf(b.introducedAtLevel) ||
        a.title.localeCompare(b.title, "nl")
    );
  return (
    <div className="lg-picker">
      {chosen.length > 0 && (
        <ul className="lg-chosen">
          {chosen.map((topic) => (
            <li key={topic.id}>
              <LevelBadge level={topic.introducedAtLevel} /> <CategoryBadge topic={topic} /> {topic.title}
              <button
                type="button"
                className="board-icon-btn"
                aria-label={t("lg.remove", { name: topic.title })}
                title={t("lg.removeShort")}
                onClick={() => onChange(value.filter((id) => id !== topic.id))}
              >
                <X />
              </button>
            </li>
          ))}
        </ul>
      )}
      {available.length > 0 && (
        // Type to find a topic; the list below is for browsing per category.
        <ItemPicker type="topic" exclude={value} label={t("lg.search")} onPick={(topic) => onChange([...value, topic.id])} />
      )}
      {available.length > 0 && (
        <select
          value=""
          onChange={(e) => e.target.value && onChange([...value, e.target.value])}
          aria-label={t("lg.add")}
        >
          <option value="">{t("lg.add")}</option>
          {TOPIC_CATEGORIES.map((cat) => {
            const list = available.filter((topic) => categoryOf(topic) === cat);
            return (
              list.length > 0 && (
                <optgroup key={cat} label={t(`cat.${cat}`)}>
                  {list.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.introducedAtLevel} · {topic.title}
                    </option>
                  ))}
                </optgroup>
              )
            );
          })}
        </select>
      )}
    </div>
  );
}
