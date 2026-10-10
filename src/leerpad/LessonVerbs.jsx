import { useI18n } from "../i18n/context";
import { setItems, setsOfType } from "../data";
import { isVerb, lessonVerbs } from "./verbIds";
import { useContentVersion } from "../data/useContent";
import { LevelBadge } from "../components/Badges";
import { VerbTiles } from "../components/RelatedWords";
import { ItemPicker } from "../library/FieldInput";
import { X } from "../icons";


/** The lesson's verbs as conjugation tiles (click one for the full card). */
export function VerbsView({ ids }) {
  const verbs = lessonVerbs(ids);
  if (!verbs.length) return null;
  return <VerbTiles verbs={verbs} />;
}

/** Docent: add verbs one by one (or all verbs of a word set) and remove them. */
export function VerbsPicker({ value = [], onChange }) {
  const { t } = useI18n();
  useContentVersion();
  const chosen = lessonVerbs(value);
  const setsWithVerbs = setsOfType("word").filter((s) => setItems(s).some(isVerb));
  const addFromSet = (setId) => {
    const set = setsWithVerbs.find((s) => s.id === setId);
    if (!set) return;
    const extra = setItems(set).filter((w) => isVerb(w) && !value.includes(w.id)).map((w) => w.id);
    if (extra.length) onChange([...value, ...extra]);
  };
  return (
    <div className="lg-picker">
      {chosen.length > 0 && (
        <ul className="lg-chosen">
          {chosen.map((v) => (
            <li key={v.id}>
              <LevelBadge level={v.introducedAtLevel} /> {v.nl}
              <button
                type="button"
                className="board-icon-btn"
                aria-label={t("lv.remove", { name: v.nl })}
                title={t("lg.removeShort")}
                onClick={() => onChange(value.filter((id) => id !== v.id))}
              >
                <X />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="lp-row">
        <ItemPicker
          type="word"
          filter={isVerb}
          exclude={value}
          label={t("lv.search")}
          onPick={(w) => onChange([...value, w.id])}
        />
        {setsWithVerbs.length > 0 && (
          <select value="" onChange={(e) => addFromSet(e.target.value)} aria-label={t("lv.fromSet")}>
            <option value="">{t("lv.fromSet")}</option>
            {setsWithVerbs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
