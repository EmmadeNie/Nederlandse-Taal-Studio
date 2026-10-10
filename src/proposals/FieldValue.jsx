import { useI18n } from "../i18n/context";
import { getItem } from "../data";
import { itemLabel } from "../library/fields";
import { fieldOf } from "./fieldDiff";
import { LevelBadge, ReviewBadge, Tag } from "../components/Badges";
import { VerbTile } from "../components/RelatedWords";
import Markdown from "../components/Markdown";

const empty = (v) => v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
const text = (s) => <span className="pr-text">{s}</span>;

/** One field's value, shown as it looks in the app. `item` gives context (e.g. the verb's name). */
export default function FieldValue({ type, field, value, item }) {
  const { t } = useI18n();
  if (empty(value)) return <span className="dim">—</span>;
  const f = fieldOf(type, field);

  if (field === "conjugation" && typeof value === "object") {
    return (
      <div className="pr-verb">
        <VerbTile verb={{ nl: item?.nl, conjugation: value }} />
      </div>
    );
  }
  if (field === "introducedAtLevel" || field === "level") return <LevelBadge level={value} />;
  if (field === "reviewStatus") return <ReviewBadge status={value} />;

  switch (f?.kind) {
    case "multi":
      return (
        <span className="pr-tags">
          {[].concat(value).map((v) => (
            <Tag key={v}>{f.optionLabel ? f.optionLabel(t, v) : v}</Tag>
          ))}
        </span>
      );
    case "select":
      return text(f.optionLabel ? f.optionLabel(t, value) : value);
    case "refs":
      return (
        <span className="pr-refs">
          {[].concat(value).map((id, i) => {
            const ref = getItem(id);
            return (
              <span key={id} className={ref ? undefined : "pr-ref-new"} title={id}>
                {ref ? itemLabel(ref) : id}
                {i < value.length - 1 && ", "}
              </span>
            );
          })}
        </span>
      );
    case "topic":
      return text(itemLabel(getItem(value)) || value);
    case "rich":
    case "markdown":
      return (
        <div className="pr-rich">
          <Markdown>{value}</Markdown>
        </div>
      );
    default:
      return typeof value === "object" ? <code className="pr-json">{JSON.stringify(value, null, 1)}</code> : text(String(value));
  }
}
