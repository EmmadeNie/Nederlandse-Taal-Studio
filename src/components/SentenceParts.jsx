import { useI18n } from "../i18n/context";
import { getItem } from "../data";
import { locateParts } from "../data/sentenceParts";

/**
 * The sentence with its marked parts and pronouns highlighted; under each
 * marked piece a small label says what it is (role · person · verb, or the
 * kind of pronoun). A piece that is both (subject "Ik") gets both labels.
 */
export default function SentenceParts({ nl = "", parts = [], pronouns = [] }) {
  const { t } = useI18n();
  const known = (key, fallback) => (t(key) === key ? String(fallback) : t(key));
  const person = (p) => p && t(`parts.person.${p}`);
  const clause = (x) => x.clause && t("parts.inClause");

  // One span per stretch of text, with all labels that belong to it.
  const spans = new Map();
  const mark = (w, kind, label) => {
    const key = `${w.start}:${w.end}`;
    const span = spans.get(key) || { start: w.start, end: w.end, kinds: [], labels: [] };
    span.kinds.push(kind);
    span.labels.push(label);
    spans.set(key, span);
  };
  const partsAt = locateParts(nl, parts);
  partsAt.forEach((w) => {
    if (!w) return;
    const { part } = w;
    const verb = part.wordId ? getItem(part.wordId)?.nl || part.wordId : null;
    const label = [known(`parts.role.${part.role}`, part.role), person(part.person), verb, clause(part)].filter(Boolean).join(" · ");
    mark(w, `sp-${part.role}`, label);
  });
  const pronounsAt = locateParts(nl, pronouns);
  pronounsAt.forEach((w) => {
    if (!w) return;
    const { part } = w;
    mark(w, "sp-voornaamwoord", [known(`parts.pronoun.${part.type}`, part.type), person(part.person)].filter(Boolean).join(" · "));
  });

  // Overlapping stretches (rare): keep the first, the rest shows in its label list.
  const ordered = [...spans.values()].sort((a, b) => a.start - b.start || b.end - a.end);
  const pieces = [];
  let pos = 0;
  ordered.forEach((s, i) => {
    if (s.start < pos) return;
    if (s.start > pos) pieces.push(<span key={`t${i}`}>{nl.slice(pos, s.start)}</span>);
    pieces.push(
      <span key={`p${i}`} className={`sp-part ${s.kinds.join(" ")}`} title={s.labels.join("\n")}>
        <span className="sp-text">{nl.slice(s.start, s.end)}</span>
        {s.labels.map((l, j) => (
          <span key={j} className="sp-label">
            {l}
          </span>
        ))}
      </span>
    );
    pos = s.end;
  });
  if (pos < nl.length) pieces.push(<span key="end">{nl.slice(pos)}</span>);
  const missing = [...partsAt, ...pronounsAt].filter((w) => !w).length;
  return (
    <span className="sentence-parts">
      {pieces}
      {missing > 0 && <span className="sp-missing">{t("parts.missing", { n: missing })}</span>}
    </span>
  );
}
