import { useState } from "react";
import { useI18n } from "../i18n/context";
import { LevelBadge } from "../components/Badges";
import QuizletExport from "../components/QuizletExport";
import { LEVELS } from "./util";
import { THEMES, themeLabel } from "./wordLists";
import { GRAMMAR_TAGS, SENTENCE_SETS, hasSentenceList, sentencesForList, slugLabel } from "./sentenceLists";

/** Short description of a recipe: "mijn eerste ontmoetingsgesprek" or "communicatie · t/m A1". */
function Summary({ spec }) {
  const { t } = useI18n();
  const parts = [
    spec.set && slugLabel(spec.set),
    spec.theme && themeLabel(spec.theme),
    spec.grammarTag && slugLabel(spec.grammarTag),
    spec.level && (spec.upTo ? t("wl.upToLevel", { level: spec.level }) : spec.level),
  ].filter(Boolean);
  return <span className="dim">{parts.join(" · ")}</span>;
}

/** "Mijn eerste ontmoetingsgesprek" → "mijn-eerste-ontmoetingsgesprek" */
const toSlug = (text) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** File name for the export: "zinnen-mijn-eerste-ontmoetingsgesprek", "zinnen-communicatie-A1". */
const exportName = (spec) =>
  ["zinnen", spec.set, spec.theme, spec.grammarTag, spec.level].filter(Boolean).join("-");

/** The sentences of a lesson's sentence list, numbered, Dutch with English below. */
export function SentenceListView({ spec }) {
  const { t } = useI18n();
  if (!hasSentenceList(spec)) return null;
  const items = sentencesForList(spec);
  return (
    <div className="wl">
      <div className="wl-head">
        <strong>{t("sl.count", { n: items.length })}</strong> <Summary spec={spec} />
      </div>
      {items.length === 0 ? (
        <p className="dim lp-empty">{spec.set ? t("sl.emptySet") : t("sl.empty")}</p>
      ) : (
        <ol className="sl-list">
          {items.map((s) => (
            <li key={s.id}>
              <div className="sl-nl">
                {s.nl} <LevelBadge level={s.introducedAtLevel} />
              </div>
              <div className="dim sl-en">{s.en}</div>
            </li>
          ))}
        </ol>
      )}
      <QuizletExport words={items} filename={exportName(spec)} downloadKey="qz.downloadSentences" />
    </div>
  );
}

/** Docent: choose a set (dialogue) or theme, grammar and level for a lesson's sentence list. */
export function SentenceListEditor({ value, onChange }) {
  const { t } = useI18n();
  const spec = value || {};
  const set = (key, v) => {
    const next = { ...spec, [key]: v || undefined };
    if (!next.level) delete next.upTo;
    onChange(hasSentenceList(next) ? next : null);
  };
  const [setText, setSetText] = useState(spec.set ? slugLabel(spec.set) : "");
  const commitSet = () => {
    const slug = toSlug(setText);
    setSetText(slug ? slugLabel(slug) : "");
    if (slug !== (spec.set || "")) set("set", slug);
  };
  return (
    <div className="wl-editor">
      <div className="lp-row">
        <input
          list="sentence-sets"
          className="sl-set-input"
          value={setText}
          onChange={(e) => setSetText(e.target.value)}
          onBlur={commitSet}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitSet();
            }
          }}
          placeholder={t("sl.setPh")}
          aria-label={t("sl.set")}
        />
        <datalist id="sentence-sets">
          {SENTENCE_SETS.map((x) => (
            <option key={x} value={slugLabel(x)} />
          ))}
        </datalist>
        <select value={spec.theme || ""} onChange={(e) => set("theme", e.target.value)} aria-label={t("wl.theme")}>
          <option value="">{t("filter.allThemes")}</option>
          {THEMES.map((th) => (
            <option key={th} value={th}>
              {themeLabel(th)}
            </option>
          ))}
        </select>
        <select
          value={spec.grammarTag || ""}
          onChange={(e) => set("grammarTag", e.target.value)}
          aria-label={t("sl.grammar")}
        >
          <option value="">{t("sl.allGrammar")}</option>
          {GRAMMAR_TAGS.map((g) => (
            <option key={g} value={g}>
              {slugLabel(g)}
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
      <p className="dim wl-hint">{hasSentenceList(spec) ? t("sl.hint") : t("sl.none")}</p>
    </div>
  );
}
