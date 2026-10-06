import {
  getStats,
  getLevelMatrix,
  getTopicCoverage,
  getQualityIndicators,
} from "../data";
import { LevelBadge, Tag } from "./Badges";

export default function Dashboard() {
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
      <h3>Content per niveau</h3>
      <table className="level-matrix">
        <thead>
          <tr>
            <th>Niveau</th>
            <th>Woorden</th>
            <th>Werkwoorden</th>
            <th>Zinnen</th>
            <th>Grammatica</th>
            <th>Oefeningen</th>
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
              <strong>Totaal</strong>
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
      <h3>Werkwoorden</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="number">{stats.totalVerbs}</div>
          <div className="label">Totaal</div>
        </div>
        <div className="stat-card">
          <div className="number" style={{ color: "var(--green)" }}>
            {stats.fullyRegularVerbs}
          </div>
          <div className="label">Volledig regelmatig</div>
        </div>
        <div className="stat-card">
          <div className="number" style={{ color: "var(--amber)" }}>
            {stats.hasIrregularVerbs}
          </div>
          <div className="label">Met onregelmatige vorm</div>
        </div>
      </div>

      {/* ── Review-status (all content) ──────────────────────────── */}
      <h3>Review-status (alle content)</h3>
      <table className="level-matrix" style={{ maxWidth: 500 }}>
        <thead>
          <tr>
            <th>Status</th>
            <th>Woorden</th>
            <th>Zinnen</th>
            <th>Grammatica</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <span className="review-badge draft">concept</span>
            </td>
            <td>{stats.review.draft.words}</td>
            <td>{stats.review.draft.sentences}</td>
            <td>{stats.review.draft.topics}</td>
          </tr>
          <tr>
            <td>
              <span className="review-badge ai-reviewed">AI-gecheckt</span>
            </td>
            <td>{stats.review["ai-reviewed"].words}</td>
            <td>{stats.review["ai-reviewed"].sentences}</td>
            <td>{stats.review["ai-reviewed"].topics}</td>
          </tr>
          <tr>
            <td>
              <span className="review-badge human-verified">geverifieerd</span>
            </td>
            <td>{stats.review["human-verified"].words}</td>
            <td>{stats.review["human-verified"].sentences}</td>
            <td>{stats.review["human-verified"].topics}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Thema's ──────────────────────────────────────────────── */}
      <h3>Thema's ({stats.themes.length})</h3>
      <div className="themes-list">
        {stats.themes.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>

      {/* ── Data-kwaliteit & gaps ────────────────────────────────── */}
      <h3>
        Data-kwaliteit{" "}
        {issueCount === 0 ? (
          <span className="quality-ok">✓ alles in orde</span>
        ) : (
          <span className="quality-warn">⚠ {issueCount} aandachtspunt(en)</span>
        )}
      </h3>

      {quality.thinVocabLevels.length > 0 && (
        <div className="quality-section">
          <h4>📉 Niveaus met weinig woordenschat (&lt;{quality.vocabThreshold})</h4>
          <div className="quality-items">
            {quality.thinVocabLevels.map((l) => (
              <div key={l.level} className="quality-item warn">
                <LevelBadge level={l.level} /> {l.vocabCount} woorden
              </div>
            ))}
          </div>
        </div>
      )}

      {quality.thinTopics.length > 0 && (
        <div className="quality-section">
          <h4>📐 Topics met weinig voorbeeldzinnen (&lt;{quality.thinThreshold})</h4>
          <div className="quality-items">
            {quality.thinTopics.map((t) => (
              <div key={t.id} className="quality-item warn">
                {t.title} <LevelBadge level={t.level} />{" "}
                <span className="dim">
                  {t.sentenceCount} zin{t.sentenceCount !== 1 ? "nen" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {quality.thinExercises.length > 0 && (
        <div className="quality-section">
          <h4>✏️ Oefeningen met te weinig content (&lt;{quality.thinThreshold})</h4>
          <div className="quality-items">
            {quality.thinExercises.map((e) => (
              <div key={e.id} className="quality-item warn">
                {e.title} <LevelBadge level={e.level} />{" "}
                <span className="dim">{e.matchCount} items</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {quality.incompleteVerbs.length > 0 && (
        <div className="quality-section">
          <h4>🔄 Werkwoorden met onvolledige vervoeging</h4>
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
          <h4>🔗 Ongeldige referenties</h4>
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
            📖 Woorden niet gebruikt in zinnen ({quality.unusedWords.length})
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
