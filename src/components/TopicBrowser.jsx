import { useState } from "react";
import { topics, querySentences } from "../data";
import { LevelBadge, ReviewBadge, Tag } from "./Badges";
import FeedbackButton from "../feedback/FeedbackButton";
import Markdown from "./Markdown";

export default function TopicBrowser() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div>
      <h2>Grammatica</h2>
      <p className="result-count">{topics.length} onderwerpen</p>
      {topics.map((t) => {
        const isOpen = expanded === t.id;
        const relatedSentences = isOpen
          ? querySentences({ grammarTags: t.grammarTags })
          : [];

        return (
          <div
            key={t.id}
            className="topic-card"
            onClick={() => setExpanded(isOpen ? null : t.id)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h3>{t.title}</h3>
              <LevelBadge level={t.introducedAtLevel} />
              <ReviewBadge status={t.reviewStatus} />
            </div>
            <div className="summary">{t.summary}</div>
            <div className="meta">
              {t.grammarTags?.map((g) => (
                <Tag key={g}>{g}</Tag>
              ))}
              {t.themes?.map((th) => (
                <Tag key={th}>{th}</Tag>
              ))}
            </div>

            {isOpen && (
              <>
                {t.explanation && (
                  <Markdown className="explanation">{t.explanation}</Markdown>
                )}
                {relatedSentences.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <strong
                      style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}
                    >
                      Gerelateerde zinnen ({relatedSentences.length}):
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
            <div className="card-footer">
              <FeedbackButton
                itemType="topic"
                itemId={t.id}
                itemLabel={t.title}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
