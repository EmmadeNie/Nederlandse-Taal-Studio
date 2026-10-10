import { useState } from "react";
import { useI18n } from "../i18n/context";
import TopicLangToggle from "../components/TopicLangToggle";
import { hasEnglish, topicText } from "../components/topicLang";
import { topics } from "../data";
import Markdown from "../components/Markdown";
import RelatedWords from "../components/RelatedWords";
import ExampleSentences from "../components/ExampleSentences";
import { LevelBadge } from "../components/Badges";
import { pathFor, topicSlug } from "../routes";
import { ArrowSquareOut, X } from "../icons";
import { LEVELS } from "./util";
import { knownTopics as known } from "./grammarTopics";


/** The grammar of a lesson: title, level, summary; the explanation opens in place. */
export function GrammarView({ ids }) {
  const list = known(ids);
  if (!list.length) return null;
  return (
    <ul className="lg-list">
      {list.map((topic) => (
        <GrammarItem key={topic.id} topic={topic} />
      ))}
    </ul>
  );
}

/** One topic in a lesson; NL/EN switch per topic, always starting in Dutch. */
function GrammarItem({ topic }) {
  const { t } = useI18n();
  const [lang, setLang] = useState("nl");
  const text = topicText(topic, lang);
  return (
    <li>
      <details>
        <summary>
          <strong lang={lang}>{text.title}</strong> <LevelBadge level={topic.introducedAtLevel} />
          {hasEnglish(topic) && <TopicLangToggle lang={lang} onChange={setLang} />}
          <div className="dim lg-summary" lang={lang}>
            {text.summary}
          </div>
        </summary>
        {text.explanation && (
          <div lang={lang}>
            <Markdown className="lp-explanation">{text.explanation}</Markdown>
          </div>
        )}
        <RelatedWords ids={topic.relatedWordIds} showEnglish={lang === "en"} />
        <ExampleSentences ids={topic.exampleSentenceIds} showEnglish={lang === "en"} />
        <a href={pathFor("topics", topicSlug(topic.id))} target="_blank" rel="noopener noreferrer">
          <ArrowSquareOut aria-hidden="true" /> {t("lg.openInLibrary")}
        </a>
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
              <LevelBadge level={topic.introducedAtLevel} /> {topic.title}
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
        <select
          value=""
          onChange={(e) => e.target.value && onChange([...value, e.target.value])}
          aria-label={t("lg.add")}
        >
          <option value="">{t("lg.add")}</option>
          {available.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.introducedAtLevel} · {topic.title}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
