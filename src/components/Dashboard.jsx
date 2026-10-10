import { useContentVersion } from "../data/useContent";
import {
  getStats,
  getLevelMatrix,
  getTopicCoverage,
  getQualityIndicators,
} from "../data";
import { LevelBadge, ReviewBadge, Tag } from "./Badges";
import { useI18n } from "../i18n/context";
import { ChartLineDown, CheckCircle, ICONS, LinkBreak, Warning } from "../icons";

export default function Dashboard() {
  const { t } = useI18n();
  useContentVersion();
  const stats = getStats();
  const matrix = getLevelMatrix();
  const quality = getQualityIndicators();

  const totalRow = matrix.reduce(
    (acc, r) => ({
      words: acc.words + r.words,
      verbs: acc.verbs + r.verbs,
      sentences: acc.sentences + r.sentences,
      topics: acc.topics + r.topics,
      exercises: acc.exercises + r.exercises,
    }),
    { words: 0, verbs: 0, sentences: 0, topics: 0, exercises: 0 }
  );

  const issueCount =
    quality.thinTopics.length +
    quality.thinExercises.length +
    quality.incompleteVerbs.length +
    quality.brokenRefs.length +
    quality.thinVocabLevels.length;

  return (
    <div>
      <h2>Dashboard</h2>

      {/* ── Content per niveau (the matrix) ─────────────────────── */}
      <h3>{t("dash.perLevel")}</h3>
      <table className="level-matrix">
        <thead>
          <tr>
            <th>{t("col.level")}</th>
            <th>{t("col.words")}</th>
            <th>{t("col.verbs")}</th>
            <th>{t("col.sentences")}</th>
            <th>{t("col.grammar")}</th>
            <th>{t("col.exercises")}</th>
          </tr>
        </thead>
        <tbody>
          {matrix.map((row) => (
            <tr key={row.level}>
              <td>
                <LevelBadge level={row.level} />
              </td>
              <td className={row.words === 0 ? "empty-cell" : ""}>
                {row.words}
              </td>
              <td className={row.verbs === 0 ? "empty-cell" : ""}>
                {row.verbs}
              </td>
              <td className={row.sentences === 0 ? "empty-cell" : ""}>
                {row.sentences}
              </td>
              <td className={row.topics === 0 ? "empty-cell" : ""}>
                {row.topics}
              </td>
              <td className={row.exercises === 0 ? "empty-cell" : ""}>
                {row.exercises}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>
              <strong>{t("dash.total")}</strong>
            </td>
            <td>{totalRow.words}</td>
            <td>{totalRow.verbs}</td>
            <td>{totalRow.sentences}</td>
            <td>{totalRow.topics}</td>
            <td>{totalRow.exercises}</td>
          </tr>
        </tfoot>
      </table>

      {/* ── Werkwoorden ──────────────────────────────────────────── */}
      <h3>{t("dash.verbs")}</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="number">{stats.totalVerbs}</div>
          <div className="label">{t("dash.total")}</div>
        </div>
        <div className="stat-card">
          <div className="number" style={{ color: "var(--green)" }}>
            {stats.fullyRegularVerbs}
          </div>
          <div className="label">{t("dash.fullyRegular")}</div>
        </div>
        <div className="stat-card">
          <div className="number" style={{ color: "var(--amber)" }}>
            {stats.hasIrregularVerbs}
          </div>
          <div className="label">{t("dash.hasIrregular")}</div>
        </div>
      </div>

      {/* ── Review-status (all content) ──────────────────────────── */}
      <h3>{t("dash.review")}</h3>
      <table className="level-matrix" style={{ maxWidth: 500 }}>
        <thead>
          <tr>
            <th>{t("col.status")}</th>
            <th>{t("col.words")}</th>
            <th>{t("col.sentences")}</th>
            <th>{t("col.grammar")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <ReviewBadge status="draft" />
            </td>
            <td>{stats.review.draft.words}</td>
            <td>{stats.review.draft.sentences}</td>
            <td>{stats.review.draft.topics}</td>
          </tr>
          <tr>
            <td>
              <ReviewBadge status="ai-reviewed" />
            </td>
            <td>{stats.review["ai-reviewed"].words}</td>
            <td>{stats.review["ai-reviewed"].sentences}</td>
            <td>{stats.review["ai-reviewed"].topics}</td>
          </tr>
          <tr>
            <td>
              <ReviewBadge status="human-verified" />
            </td>
            <td>{stats.review["human-verified"].words}</td>
            <td>{stats.review["human-verified"].sentences}</td>
            <td>{stats.review["human-verified"].topics}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Thema's ──────────────────────────────────────────────── */}
      <h3>{t("dash.themes", { n: stats.themes.length })}</h3>
      <div className="themes-list">
        {stats.themes.map((theme) => (
          <Tag key={theme}>{theme}</Tag>
        ))}
      </div>

      {/* ── Data-kwaliteit & gaps ────────────────────────────────── */}
      <h3>
        {t("dash.quality")}{" "}
        {issueCount === 0 ? (
          <span className="quality-ok"><CheckCircle weight="fill" /> {t("dash.allGood")}</span>
        ) : (
          <span className="quality-warn"><Warning weight="fill" /> {t("dash.issues", { n: issueCount })}</span>
        )}
      </h3>

      {quality.thinVocabLevels.length > 0 && (
        <div className="quality-section">
          <h4><ChartLineDown /> {t("dash.thinVocab", { n: quality.vocabThreshold })}</h4>
          <div className="quality-items">
            {quality.thinVocabLevels.map((l) => (
              <div key={l.level} className="quality-item warn">
                <LevelBadge level={l.level} /> {t("dash.words", { n: l.vocabCount })}
              </div>
            ))}
          </div>
        </div>
      )}

      {quality.thinTopics.length > 0 && (
        <div className="quality-section">
          <h4><ICONS.topics /> {t("dash.thinTopics", { n: quality.thinThreshold })}</h4>
          <div className="quality-items">
            {quality.thinTopics.map((topic) => (
              <div key={topic.id} className="quality-item warn">
                {topic.title} <LevelBadge level={topic.level} />{" "}
                <span className="dim">{t("dash.sentences", { n: topic.sentenceCount })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {quality.thinExercises.length > 0 && (
        <div className="quality-section">
          <h4><ICONS.exercises /> {t("dash.thinExercises", { n: quality.thinThreshold })}</h4>
          <div className="quality-items">
            {quality.thinExercises.map((e) => (
              <div key={e.id} className="quality-item warn">
                {e.title} <LevelBadge level={e.level} />{" "}
                <span className="dim">{t("dash.items", { n: e.matchCount })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {quality.incompleteVerbs.length > 0 && (
        <div className="quality-section">
          <h4><ICONS.verbs /> {t("dash.incompleteVerbs")}</h4>
          <div className="quality-items">
            {quality.incompleteVerbs.map((v) => (
              <div key={v.id} className="quality-item warn">
                {v.nl}
              </div>
            ))}
          </div>
        </div>
      )}

      {quality.brokenRefs.length > 0 && (
        <div className="quality-section">
          <h4><LinkBreak /> {t("dash.brokenRefs")}</h4>
          <div className="quality-items">
            {quality.brokenRefs.map((r, i) => (
              <div key={i} className="quality-item error">
                {r.from} → {r.type}: {r.missing}
              </div>
            ))}
          </div>
        </div>
      )}

      {quality.unusedWords.length > 0 && (
        <details className="quality-section">
          <summary>
            <ICONS.words /> {t("dash.unusedWords", { n: quality.unusedWords.length })}
          </summary>
          <div className="quality-items" style={{ marginTop: "0.5rem" }}>
            {quality.unusedWords.map((w) => (
              <span key={w.id} className="tag" style={{ marginBottom: "0.25rem" }}>
                {w.nl}
              </span>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
