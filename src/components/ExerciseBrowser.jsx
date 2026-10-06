import {
  exercises,
  topics,
  querySentences,
  queryWordsUpToLevel,
} from "../data";
import { LevelBadge, Tag } from "./Badges";

const TYPE_LABELS = {
  "fill-in": "Invuloefening",
  "multiple-choice": "Meerkeuze",
  translate: "Vertalen",
  flashcards: "Flashcards",
};

const TYPE_ICONS = {
  "fill-in": "✍️",
  "multiple-choice": "🔘",
  translate: "🔀",
  flashcards: "🃏",
};

export default function ExerciseBrowser() {
  return (
    <div>
      <h2>Oefeningen</h2>
      <p className="result-count">
        {exercises.length} oefeningen beschikbaar
      </p>
      <div className="card-grid">
        {exercises.map((ex) => {
          const topic = ex.topicId
            ? topics.find((t) => t.id === ex.topicId)
            : null;

          // Show how many items the query would match
          let matchCount = 0;
          if (ex.type === "flashcards") {
            matchCount = queryWordsUpToLevel(ex.query.maxLevel || ex.level, {
              themes: ex.query.themes,
            }).length;
          } else {
            matchCount = querySentences({
              grammarTags: ex.query.grammarTags,
              maxLevel: ex.query.maxLevel || ex.level,
              themes: ex.query.themes,
              tense: ex.query.tense,
            }).length;
          }

          return (
            <div key={ex.id} className="card">
              <div className="card-header">
                <span style={{ fontSize: "1.5rem" }}>
                  {TYPE_ICONS[ex.type] || "📝"}
                </span>
                <span className="word">{ex.title}</span>
              </div>
              <div className="translation">
                {TYPE_LABELS[ex.type] || ex.type}
              </div>
              <div className="meta">
                <LevelBadge level={ex.level} />
                {topic && <Tag>{topic.title}</Tag>}
                {ex.query.themes?.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
                {ex.query.grammarTags?.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
              <div
                style={{
                  marginTop: "0.75rem",
                  fontSize: "0.8rem",
                  color: "var(--text-dim)",
                }}
              >
                {matchCount > 0 ? (
                  <span>
                    📦 {matchCount} items beschikbaar
                    {ex.query.limit && ` (max ${ex.query.limit} per sessie)`}
                  </span>
                ) : (
                  <span style={{ color: "var(--amber)" }}>
                    ⚠️ Nog geen matching content
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
