import { useI18n } from "../i18n/context";
import { getItem } from "../data";
import { locateParts } from "../data/sentenceParts";

/**
 * The sentence with its marked parts highlighted per role; hover (or the
 * small label under each) says the role, the person and the verb.
 */
export default function SentenceParts({ nl, parts = [] }) {
  const { t } = useI18n();
  const where = locateParts(nl || "", parts);
  const pieces = [];
  let pos = 0;
  where.forEach((w, i) => {
    if (!w) return;
    if (w.start > pos) pieces.push(<span key={`t${i}`}>{nl.slice(pos, w.start)}</span>);
    const { part } = w;
    const verb = part.wordId ? getItem(part.wordId)?.nl || part.wordId : null;
    const roleKey = `parts.role.${part.role}`;
    const role = t(roleKey) === roleKey ? String(part.role) : t(roleKey);
    const label = [role, part.person && t(`parts.person.${part.person}`), verb].filter(Boolean).join(" · ");
    pieces.push(
      <span key={`p${i}`} className={`sp-part sp-${part.role}`} title={label}>
        <span className="sp-text">{nl.slice(w.start, w.end)}</span>
        <span className="sp-label">{label}</span>
      </span>
    );
    pos = w.end;
  });
  if (pos < (nl || "").length) pieces.push(<span key="end">{nl.slice(pos)}</span>);
  const missing = where.filter((w) => !w).length;
  return (
    <span className="sentence-parts">
      {pieces}
      {missing > 0 && <span className="sp-missing">{t("parts.missing", { n: missing })}</span>}
    </span>
  );
}
