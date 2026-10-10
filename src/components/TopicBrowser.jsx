import { useContentVersion } from "../data/useContent";
import { EditItemButton, NewItemButton } from "../library/ItemEditing";
import { useEffect, useRef, useState } from "react";
import { topics } from "../data";
import { LevelBadge, ReviewBadge, Tag } from "./Badges";
import FeedbackButton from "../feedback/FeedbackButton";
import Markdown from "./Markdown";
import RelatedWords from "./RelatedWords";
import ExampleSentences from "./ExampleSentences";
import { useUrlParams } from "../hooks/useUrlParams";
import { navigate, useRoute } from "../hooks/useRoute";
import { pathFor, topicIdFromSlug, topicSlug } from "../routes";
import CopyLinkButton from "./CopyLinkButton";
import { useI18n } from "../i18n/context";
import TopicLangToggle from "./TopicLangToggle";
import { hasEnglish, topicText } from "./topicLang";

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

  const setExpanded = (id) =>
    navigate(id ? pathFor("topics", topicSlug(id)) : pathFor("topics"), { replace: true });

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
      <NewItemButton type="topic" />
      <p className="result-count">{t("topics.count", { n: topics.length })}</p>
      {topics.map((topic) => {
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
    </div>
  );
}

/** One grammar topic; NL/EN switch per card, always starting in Dutch. */
function TopicCard({ topic, isOpen, cardRef, onToggle }) {
  const [lang, setLang] = useState("nl");
  const text = topicText(topic, lang);
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- the card folds like before
    <div ref={cardRef} className="topic-card" onClick={onToggle}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <h3 lang={lang}>{text.title}</h3>
        <LevelBadge level={topic.introducedAtLevel} />
        <ReviewBadge status={topic.reviewStatus} />
        {hasEnglish(topic) && <TopicLangToggle lang={lang} onChange={setLang} />}
      </div>
      <div className="summary" lang={lang}>
        {text.summary}
      </div>
      <div className="meta">
        {topic.grammarTags?.map((g) => (
          <Tag key={g}>{g}</Tag>
        ))}
        {topic.themes?.map((th) => (
          <Tag key={th}>{th}</Tag>
        ))}
      </div>

      {isOpen && (
        <>
          {text.explanation && (
            <div lang={lang}>
              <Markdown className="explanation">{text.explanation}</Markdown>
            </div>
          )}
          <RelatedWords ids={topic.relatedWordIds} />
          <ExampleSentences ids={topic.exampleSentenceIds} showEnglish={lang === "en"} />
        </>
      )}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- keeps button clicks from folding the card */}
      <div className="card-footer" onClick={(e) => e.stopPropagation()}>
        <EditItemButton item={topic} />
        <CopyLinkButton path={pathFor("topics", topicSlug(topic.id))} />
        <FeedbackButton itemType="topic" itemId={topic.id} itemLabel={topic.title} />
      </div>
    </div>
  );
}
