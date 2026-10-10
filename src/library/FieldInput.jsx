import { useState } from "react";
import { useI18n } from "../i18n/context";
import { getItem, topics, words, sentences, exercises } from "../data";
import { LevelBadge } from "../components/Badges";
import { X } from "../icons";
import { itemLabel } from "./fields";
import RichEditor from "../editor/RichEditor";

const LISTS = { word: words, sentence: sentences, topic: topics, exercise: exercises };

/**
 * One field of the item editor. onChange(value) updates the draft; onCommit(value)
 * saves: text fields commit when you leave them, choices right away.
 */
export default function FieldInput({ field, value, onChange, onCommit, errors = [] }) {
  const { t } = useI18n();
  const label = t(field.label);
  const optionText = (v) => (field.optionLabel ? field.optionLabel(t, v) : v);
  const choose = (v) => {
    onChange(v);
    onCommit(v);
  };

  let control;
  switch (field.kind) {
    case "text":
      control = (
        <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} onBlur={() => onCommit()} />
      );
      break;
    case "textarea":
    case "markdown":
      control = (
        <textarea
          rows={field.kind === "markdown" ? 8 : 3}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => onCommit()}
        />
      );
      break;
    case "rich":
      control = <RichEditor value={value} onChange={onChange} onBlur={() => onCommit()} label={label} />;
      break;
    case "number":
      control = (
        <input
          type="number"
          min={field.min}
          max={field.max}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          onBlur={() => onCommit()}
        />
      );
      break;
    case "select":
      control = (
        <select value={value ?? ""} onChange={(e) => choose(e.target.value)}>
          <option value="">—</option>
          {field.options.map((v) => (
            <option key={v} value={v}>
              {optionText(v)}
            </option>
          ))}
        </select>
      );
      break;
    case "topic":
      control = (
        <select value={value ?? ""} onChange={(e) => choose(e.target.value)}>
          <option value="">—</option>
          {topics.map((tp) => (
            <option key={tp.id} value={tp.id}>
              {tp.introducedAtLevel} · {tp.title}
            </option>
          ))}
        </select>
      );
      break;
    case "multi": {
      const list = value || [];
      control = (
        <div className="ie-chips" role="group" aria-label={label}>
          {field.options.map((v) => (
            <button
              key={v}
              type="button"
              className="ie-chip"
              aria-pressed={list.includes(v)}
              onClick={() => choose(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])}
            >
              {optionText(v)}
            </button>
          ))}
        </div>
      );
      break;
    }
    case "refs": {
      const list = value || [];
      control = (
        <div className="ie-refs" role="group" aria-label={label}>
          {list.length > 0 && (
            <ul>
              {list.map((id) => (
                <li key={id}>
                  <span>{itemLabel(getItem(id)) || id}</span>
                  <button
                    type="button"
                    className="board-icon-btn"
                    aria-label={t("ie.removeRef", { name: itemLabel(getItem(id)) || id })}
                    onClick={() => choose(list.filter((x) => x !== id))}
                  >
                    <X />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <ItemPicker type={field.refType} exclude={list} onPick={(item) => choose([...list, item.id])} />
        </div>
      );
      break;
    }
    case "json":
      control = <JsonField value={value} onCommit={choose} />;
      break;
    default:
      control = null;
  }

  // One control: a real <label> around it. Chip groups and lists name themselves.
  const Wrapper = ["multi", "refs", "rich"].includes(field.kind) ? "div" : "label";
  return (
    <Wrapper className={`fb-field ie-field ie-${field.kind}`}>
      <span>{label}</span>
      {control}
      {errors.map((msg, i) => (
        <span key={i} className="ie-error" role="alert">
          {msg}
        </span>
      ))}
    </Wrapper>
  );
}

/** JSON object as text; saved when valid. */
function JsonField({ value, onCommit }) {
  const { t } = useI18n();
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [bad, setBad] = useState(false);
  return (
    <>
      <textarea
        rows={5}
        className="ie-json"
        value={text}
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          try {
            const parsed = JSON.parse(text || "{}");
            setBad(false);
            onCommit(parsed);
          } catch {
            setBad(true);
          }
        }}
      />
      {bad && <span className="ie-error">{t("val.json")}</span>}
    </>
  );
}

/** Search an item of a type and pick it. */
export function ItemPicker({ type, exclude = [], onPick, label }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = q
    ? (LISTS[type] || [])
        .filter((item) => !exclude.includes(item.id))
        .filter((item) => `${itemLabel(item)} ${item.en || ""} ${item.id}`.toLowerCase().includes(q))
        .slice(0, 8)
    : [];
  return (
    <div className="ie-picker">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={label || t(`ie.search.${type}`)}
        aria-label={label || t(`ie.search.${type}`)}
      />
      {results.length > 0 && (
        <ul className="ll-list">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(item);
                  setQuery("");
                }}
              >
                <span>
                  {itemLabel(item)} {item.en && <span className="dim">· {item.en}</span>}
                </span>
                {(item.introducedAtLevel || item.level) && <LevelBadge level={item.introducedAtLevel || item.level} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
