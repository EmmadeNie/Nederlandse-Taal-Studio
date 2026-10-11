import { useContentVersion } from "../data/useContent";
import { EditItemButton, NewItemButton } from "../library/ItemEditing";
import { useEffect, useRef, useState } from "react";
import { LEVELS, topics } from "../data";
import { LevelBadge, ReviewBadge } from "./Badges";
import FeedbackButton from "../feedback/FeedbackButton";
import Markdown from "./Markdown";
import RelatedWords from "./RelatedWords";
import ExampleSentences from "./ExampleSentences";
import { useUrlParams } from "../hooks/useUrlParams";
import { navigate, useRoute } from "../hooks/useRoute";
import { pathFor, topicIdFromSlug, topicSlug } from "../routes";
import CopyLinkButton from "./CopyLinkButton";
import { useI18n } from "../i18n/context";
import { useAuth } from "../auth/context";
import TopicLangToggle from "./TopicLangToggle";
import { hasEnglish, topicText } from "./topicLang";
import CategoryBadge from "./CategoryBadge";
import { TOPIC_CATEGORIES, categoryOf } from "../data/topicCategory";

export default function TopicBrowser() {
  const { t } = useI18n();
  useContentVersion();
  const urlParams = useUrlParams();
  const route = useRoute();

  // A topic can be deep-linked by path (/bibliotheek/grammatica/perfectum) or
  // by grammar tag (?grammar=perfectum), so Trello links can target either.
  const expandedId =
    (route.param && topicIdFromSlug(route.param)) ||
    (urlParams.grammar
      ? topics.find((topic) => (topic.grammarTags || []).includes(urlParams.grammar))?.id
      : null) ||
    null;

  // Grammatica / Spelling / Uitspraak, or all of them (?cat=… keeps the choice in links).
  const cat = TOPIC_CATEGORIES.includes(urlParams.cat) ? urlParams.cat : null;
  const search = cat ? `?cat=${cat}` : "";
  const shown = topics.filter((topic) => !cat || categoryOf(topic) === cat || topic.id === expandedId);
  const countOf = (c) => topics.filter((topic) => !c || categoryOf(topic) === c).length;

  const setExpanded = (id) =>
    navigate(id ? pathFor("topics", topicSlug(id)) : pathFor("topics"), { replace: true, search });
  const setCat = (c) =>
    navigate(expandedId ? pathFor("topics", topicSlug(expandedId)) : pathFor("topics"), {
      replace: true,
      search: c ? `?cat=${c}` : "",
    });

  // Scroll the deep-linked topic into view on load / when it changes.
  const openRef = useRef(null);
  useEffect(() => {
    if (expandedId && openRef.current) {
      openRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [expandedId]);

  return (
    <div>
      <h2>{t("nav.topics")}</h2>
      <div className="topic-cats" role="group" aria-label={t("cat.filter")}>
        {[null, ...TOPIC_CATEGORIES].map((c) => (
          <button key={c || "all"} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}>
            {c ? t(`cat.${c}`) : t("cat.all")} <span className="dim">{countOf(c)}</span>
          </button>
        ))}
      </div>
      <NewItemButton type="topic" extra={cat ? { category: cat } : undefined} />
      <p className="result-count">{t("topics.count", { n: shown.length })}</p>
      {[...LEVELS, null].map((level) => {
        const group = shown.filter((topic) => (LEVELS.includes(topic.introducedAtLevel) ? topic.introducedAtLevel : null) === level);
        if (!group.length) return null;
        return (
          <section key={level ?? "none"} className="topic-group">
            <h3 className="topic-group-title">{level ?? t("level.none")}</h3>
            {group.map((topic) => {
              const isOpen = expandedId === topic.id;
              return (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  isOpen={isOpen}
                  cardRef={isOpen ? openRef : null}
                  onToggle={() => setExpanded(isOpen ? null : topic.id)}
                />
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

/**
 * One topic: title, one quiet line (level · category), the summary; tap to read
 * the explanation. Tools sit small top right. NL/EN switch per card, always
 * starting in Dutch.
 */
function TopicCard({ topic, isOpen, cardRef, onToggle }) {
  const { t } = useI18n();
  const [lang, setLang] = useState("nl");
  const isStaff = useAuth().role !== "leerling";
  const text = topicText(topic, lang);
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- the card folds like before
    <div ref={cardRef} className={`topic-card ${isOpen ? "is-open" : ""}`} onClick={onToggle}>
      <div className="topic-head">
        <h3 lang={lang}>{text.title}</h3>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- keeps button clicks from folding the card */}
        <div className="topic-tools" onClick={(e) => e.stopPropagation()}>
          {hasEnglish(topic) && <TopicLangToggle lang={lang} onChange={setLang} />}
          <CopyLinkButton path={pathFor("topics", topicSlug(topic.id))} compact />
          <FeedbackButton itemType="topic" itemId={topic.id} itemLabel={topic.title} />
          <EditItemButton item={topic} />
        </div>
      </div>
      <div className="topic-meta">
        <LevelBadge level={topic.introducedAtLevel} />
        <CategoryBadge topic={topic} />
        {isStaff && <ReviewBadge status={topic.reviewStatus} />}
      </div>
      {text.summary && (
        <p className="summary" lang={lang}>
          {text.summary}
        </p>
      )}

      {isOpen ? (
        <>
          {text.explanation && (
            <div lang={lang}>
              <Markdown className="explanation">{text.explanation}</Markdown>
            </div>
          )}
          <RelatedWords ids={topic.relatedWordIds} />
          <ExampleSentences ids={topic.exampleSentenceIds} />
        </>
      ) : (
        <span className="topic-more">{t("topics.read")} ›</span>
      )}
    </div>
  );
}
