import { useI18n } from "../i18n/context";
import { LevelBadge } from "../components/Badges";
import QuizletExport from "../components/QuizletExport";
import { LEVELS } from "./util";
import { THEMES, WORD_POS, hasWordList, themeLabel, toLists, wordsForList, wordListLabel } from "./wordLists";
import SetSelect from "./SetSelect";

function Summary({ spec }) {
  const { t } = useI18n();
  return <span className="dim">{wordListLabel(spec, t)}</span>;
}

/** File name for the export: "woorden-dieren", "woorden-A0". */
const exportName = (spec) =>
  ["woorden", spec.set, spec.theme, spec.partOfSpeech, spec.level].filter(Boolean).join("-");

/** A list folded on its own (summary + content), or `bare` inside a lesson row that already folds. */
export function ListBox({ bare, head, children }) {
  if (bare) return <div className="wl">{children}</div>;
  return (
    <details className="wl wl-collapsible">
      <summary className="wl-head">{head}</summary>
      {children}
    </details>
  );
}

/** The words of a lesson's word list, as a table (folded until you open it). */
export function WordListView({ spec, bare = false }) {
  const { t } = useI18n();
  if (!hasWordList(spec)) return null;
  const words = wordsForList(spec);
  // Collapsed by default: the count and recipe show, click to see the words.
  return (
    <ListBox bare={bare} head={<><strong>{t("wl.count", { n: words.length })}</strong> <Summary spec={spec} /></>}>
      {words.length === 0 ? (
        <p className="dim lp-empty">{t("wl.empty")}</p>
      ) : (
        <div className="wl-table-wrap">
          <table className="wl-table">
            <thead>
              <tr>
                <th>{t("wl.word")}</th>
                <th>{t("wl.english")}</th>
                <th>{t("wl.plural")}</th>
                <th>{t("col.level")}</th>
              </tr>
            </thead>
            <tbody>
              {words.map((w) => (
                <tr key={w.id}>
                  <td>
                    {w.article && <span className="wl-article">{w.article} </span>}
                    <strong>{w.nl}</strong>
                  </td>
                  <td>{w.en}</td>
                  <td className="dim">{w.plural || ""}</td>
                  <td>
                    <LevelBadge level={w.introducedAtLevel} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <QuizletExport words={words} filename={exportName(spec)} />
    </ListBox>
  );
}

/** All word lists of a lesson, each folded on its own. */
export function WordListsView({ value, bare = false }) {
  const lists = toLists(value).filter(hasWordList);
  // Inside a lesson row: one list needs no fold of its own.
  return lists.map((spec, i) => <WordListView key={i} spec={spec} bare={bare && lists.length === 1} />);
}

/** Docent: choose theme, part of speech and level for a lesson's word list. */
export function WordListEditor({ value, onChange }) {
  const { t } = useI18n();
  const spec = value || {};
  const set = (key, v) => {
    const next = { ...spec, [key]: v || undefined };
    if (!next.level) delete next.upTo;
    onChange(hasWordList(next) ? next : null);
  };
  return (
    <div className="wl-editor">
      <div className="lp-row">
        <SetSelect type="word" value={spec.set} onChange={(v) => set("set", v)} label={t("wl.set")} />
        <select value={spec.theme || ""} onChange={(e) => set("theme", e.target.value)} aria-label={t("wl.theme")}>
          <option value="">{t("filter.allThemes")}</option>
          {THEMES.map((th) => (
            <option key={th} value={th}>
              {themeLabel(th)}
            </option>
          ))}
        </select>
        <select
          value={spec.partOfSpeech || ""}
          onChange={(e) => set("partOfSpeech", e.target.value)}
          aria-label={t("filter.pos")}
        >
          <option value="">{t("filter.allPos")}</option>
          {WORD_POS.map((p) => (
            <option key={p} value={p}>
              {t(`pos.${p}`)}
            </option>
          ))}
        </select>
        <select value={spec.level || ""} onChange={(e) => set("level", e.target.value)} aria-label={t("col.level")}>
          <option value="">{t("level.all")}</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      {spec.level && (
        <label className="wl-upto">
          <input type="checkbox" checked={Boolean(spec.upTo)} onChange={(e) => set("upTo", e.target.checked)} />{" "}
          {t("wl.upTo")}
        </label>
      )}
      <p className="dim wl-hint">{hasWordList(spec) ? t("wl.hint") : t("wl.none")}</p>
    </div>
  );
}
