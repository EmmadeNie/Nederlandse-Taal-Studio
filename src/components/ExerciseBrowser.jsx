import {
  exercises,
  topics,
  querySentences,
  queryWordsUpToLevel,
} from "../data";
import { LevelBadge, Tag } from "./Badges";
import FeedbackButton from "../feedback/FeedbackButton";
import { useI18n } from "../i18n/context";
import { EXERCISE_ICONS, ICONS, Package, Warning } from "../icons";


export default function ExerciseBrowser() {
  const { t } = useI18n();
  return (
    <div>
      <h2>{t("nav.exercises")}</h2>
      <p className="result-count">
        {t("ex.count", { n: exercises.length })}
      </p>
      <div className="card-grid">
        {exercises.map((ex) => {
          const topic = ex.topicId
            ? topics.find((tag) => tag.id === ex.topicId)
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
                <span style={{ fontSize: "1.5rem", display: "inline-flex", color: "var(--accent)" }}>
                  {(() => {
                    const TypeIcon = EXERCISE_ICONS[ex.type] || ICONS.exercises;
                    return <TypeIcon aria-hidden="true" />;
                  })()}
                </span>
                <span className="word">{ex.title}</span>
              </div>
              <div className="translation">
                {EXERCISE_ICONS[ex.type] ? t(`ex.type.${ex.type}`) : ex.type}
              </div>
              <div className="meta">
                <LevelBadge level={ex.level} />
                {topic && <Tag>{topic.title}</Tag>}
                {ex.query.themes?.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
                {ex.query.grammarTags?.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
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
                    <Package /> {t("ex.items", { n: matchCount })}
                    {ex.query.limit && t("ex.max", { n: ex.query.limit })}
                  </span>
                ) : (
                  <span style={{ color: "var(--amber)" }}>
                    <Warning /> {t("ex.noContent")}
                  </span>
                )}
              </div>
              <div className="card-footer">
                <FeedbackButton
                  itemType="exercise"
                  itemId={ex.id}
                  itemLabel={ex.title}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
