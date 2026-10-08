import { useEffect, useRef } from "react";
import { topics, querySentences } from "../data";
import { LevelBadge, ReviewBadge, Tag } from "./Badges";
import FeedbackButton from "../feedback/FeedbackButton";
import Markdown from "./Markdown";
import { useUrlParams, useSetUrlParams } from "../hooks/useUrlParams";
import CopyLinkButton from "./CopyLinkButton";
import { useI18n } from "../i18n/context";

export default function TopicBrowser() {
  const { t } = useI18n();
  const urlParams = useUrlParams();
  const setUrlParams = useSetUrlParams();

  // A topic can be deep-linked by id (?topic=topic.de-het) or by grammar tag
  // (?grammar=perfectum), so Trello links can target either.
  const expandedId =
    urlParams.topic ||
    (urlParams.grammar
      ? topics.find((topic) => (topic.grammarTags || []).includes(urlParams.grammar))?.id
      : null) ||
    null;

  const setExpanded = (id) => setUrlParams({ topic: id, grammar: null });

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
      <p className="result-count">{t("topics.count", { n: topics.length })}</p>
      {topics.map((topic) => {
        const isOpen = expandedId === topic.id;
        const relatedSentences = isOpen
          ? querySentences({ grammarTags: topic.grammarTags })
          : [];

        return (
          <div
            key={topic.id}
            ref={isOpen ? openRef : null}
            className="topic-card"
            onClick={() => setExpanded(isOpen ? null : topic.id)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h3>{topic.title}</h3>
              <LevelBadge level={topic.introducedAtLevel} />
              <ReviewBadge status={topic.reviewStatus} />
            </div>
            <div className="summary">{topic.summary}</div>
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
                {topic.explanation && (
                  <Markdown className="explanation">{topic.explanation}</Markdown>
                )}
                {relatedSentences.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <strong
                      style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}
                    >
                      {t("topics.related", { n: relatedSentences.length })}
                    </strong>
                    {relatedSentences.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          padding: "0.5rem 0",
                          borderBottom: "1px solid var(--border)",
                          fontSize: "0.9rem",
                        }}
                      >
                        <div>{s.nl}</div>
                        <div style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>
                          {s.en}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <div className="card-footer" onClick={(e) => e.stopPropagation()}>
              <CopyLinkButton params={{ page: "topics", topic: topic.id }} />
              <FeedbackButton
                itemType="topic"
                itemId={topic.id}
                itemLabel={topic.title}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
