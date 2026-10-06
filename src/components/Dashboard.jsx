import { getStats } from "../data";
import { Tag } from "./Badges";

export default function Dashboard() {
  const stats = getStats();

  return (
    <div>
      <h2>Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="number">{stats.totalWords}</div>
          <div className="label">Woorden</div>
        </div>
        <div className="stat-card">
          <div className="number">{stats.totalVerbs}</div>
          <div className="label">Werkwoorden</div>
        </div>
        <div className="stat-card">
          <div className="number">{stats.totalSentences}</div>
          <div className="label">Zinnen</div>
        </div>
        <div className="stat-card">
          <div className="number">{stats.totalTopics}</div>
          <div className="label">Grammatica-onderwerpen</div>
        </div>
        <div className="stat-card">
          <div className="number">{stats.totalExercises}</div>
          <div className="label">Oefeningen</div>
        </div>
      </div>

      <h3>Woorden per niveau</h3>
      <div className="levels-bar">
        {stats.levels.map((l) => (
          <div key={l.level} className={`level-stat ${l.level}`}>
            <div className="count">{l.wordCount}</div>
            <div className="label">{l.level}</div>
          </div>
        ))}
      </div>

      <h3>Werkwoorden</h3>
      <div className="stats-grid">
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

      <h3>Review-status woorden</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="number" style={{ color: "var(--amber)" }}>
            {stats.reviewDraft}
          </div>
          <div className="label">Concept</div>
        </div>
        <div className="stat-card">
          <div className="number" style={{ color: "var(--accent)" }}>
            {stats.reviewAiReviewed}
          </div>
          <div className="label">AI-gecheckt (wacht op jou)</div>
        </div>
        <div className="stat-card">
          <div className="number" style={{ color: "var(--green)" }}>
            {stats.reviewVerified}
          </div>
          <div className="label">Door jou geverifieerd</div>
        </div>
      </div>

      <h3>Thema's ({stats.themes.length})</h3>
      <div className="themes-list">
        {stats.themes.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
    </div>
  );
}
