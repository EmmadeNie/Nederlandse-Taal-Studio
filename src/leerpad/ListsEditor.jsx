import { useState } from "react";
import { useI18n } from "../i18n/context";
import { Plus, X } from "../icons";
import { toLists } from "./wordLists";

/**
 * Docent: several word or sentence lists on a lesson, each edited with `Editor`
 * ({ value, onChange }). Saves the lists that have something chosen; an empty
 * one stays on screen until it is filled or removed.
 */
export default function ListsEditor({ value, onChange, Editor, has, addLabel, removeLabel }) {
  const { t } = useI18n();
  const [lists, setLists] = useState(() => (toLists(value).length ? toLists(value) : [{}]));
  const update = (next) => {
    setLists(next);
    const filled = next.filter(has);
    onChange(filled.length ? filled : null);
  };
  return (
    <div className="lists-editor">
      {lists.map((spec, i) => (
        <div key={i} className="lists-editor-item">
          <Editor value={spec} onChange={(v) => update(lists.map((x, j) => (j === i ? v || {} : x)))} />
          {lists.length > 1 && (
            <button
              type="button"
              className="board-icon-btn"
              aria-label={t(removeLabel)}
              title={t(removeLabel)}
              onClick={() => update(lists.filter((_, j) => j !== i))}
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
      <button type="button" className="fb-link lists-editor-add" onClick={() => setLists([...lists, {}])}>
        <Plus aria-hidden="true" /> {t(addLabel)}
      </button>
    </div>
  );
}
