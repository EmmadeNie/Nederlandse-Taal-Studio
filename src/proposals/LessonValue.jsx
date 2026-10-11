import { useI18n } from "../i18n/context";
import { getItem, getSet } from "../data";
import { LevelBadge, Tag } from "../components/Badges";
import Markdown from "../components/Markdown";
import { itemLabel } from "../library/fields";

const empty = (v) => v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);

/** "Eerste werkwoorden · dieren · t/m A1" for a word or sentence list recipe. */
function listSummary(spec, t) {
  return [
    spec.set && (getSet(spec.set)?.title || spec.set),
    spec.theme,
    spec.partOfSpeech && t(`pos.${spec.partOfSpeech}`).toLowerCase(),
    spec.grammarTag,
    spec.level && (spec.upTo ? t("wl.upToLevel", { level: spec.level }) : spec.level),
  ]
    .filter(Boolean)
    .join(" · ");
}

/** One field of a lesson in a proposal, shown as in the app. */
export default function LessonValue({ field, value, board }) {
  const { t } = useI18n();
  if (empty(value)) return <span className="dim">—</span>;
  switch (field) {
    case "level":
      return <LevelBadge level={value} />;
    case "labelIds":
      return (
        <span className="pr-tags">
          {value.map((id) => (
            <Tag key={id}>{board?.labels.find((l) => l.id === id)?.name_nl || id}</Tag>
          ))}
        </span>
      );
    case "explanation":
      return (
        <div className="pr-rich">
          <Markdown>{value}</Markdown>
        </div>
      );
    case "links":
      return (
        <ul className="pr-plain">
          {value.map((l, i) => (
            <li key={i}>
              {l.label || l.url} <span className="dim">{l.label && l.url !== l.label ? `(${l.url})` : ""}</span>
            </li>
          ))}
        </ul>
      );
    case "wordLists":
    case "sentenceLists":
      return (
        <ul className="pr-plain">
          {value.map((spec, i) => (
            <li key={i}>{listSummary(spec, t) || JSON.stringify(spec)}</li>
          ))}
        </ul>
      );
    case "topicIds":
    case "verbIds":
      return <span className="pr-text">{value.map((id) => itemLabel(getItem(id)) || id).join(", ")}</span>;
    default:
      return <span className="pr-text">{String(value)}</span>;
  }
}
