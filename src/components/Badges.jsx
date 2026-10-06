export function LevelBadge({ level }) {
  return <span className={`level-badge ${level}`}>{level}</span>;
}

const REVIEW_LABELS = {
  draft: "concept",
  "ai-reviewed": "AI-gecheckt",
  "human-verified": "geverifieerd",
};

export function ReviewBadge({ status }) {
  if (!status) return null;
  return (
    <span className={`review-badge ${status}`}>
      {REVIEW_LABELS[status] || status}
    </span>
  );
}

export function Tag({ children }) {
  return <span className="tag">{children}</span>;
}
