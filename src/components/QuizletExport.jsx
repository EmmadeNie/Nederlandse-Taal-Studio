import { useState } from "react";
import { useI18n } from "../i18n/context";
import { LEVELS } from "../data/schema";
import { DownloadSimple } from "../icons";

/** One CSV field; quoted only when needed (Quizlet reads plain "term,definition" lines). */
const field = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/** "de hond" or, with plurals, "de hond (honden)". */
const term = (w, withPlural) =>
  `${w.article ? w.article + " " : ""}${w.nl}${withPlural && w.plural ? ` (${w.plural})` : ""}`;

function wordsToCsv(words, { withPlural = false } = {}) {
  return words.map((w) => `${field(term(w, withPlural))},${field(w.en)}`).join("\n") + "\n";
}

/**
 * "CSV for Quizlet": pick the levels to include, then download a
 * term,definition file (Dutch → English) to import in Quizlet.
 */
export default function QuizletExport({ words, filename = "woorden", downloadKey = "qz.download" }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const counts = Object.fromEntries(
    LEVELS.map((l) => [l, words.filter((w) => w.introducedAtLevel === l).length]).filter(([, n]) => n > 0)
  );
  const available = Object.keys(counts);
  const [levels, setLevels] = useState(null); // null = all available
  const [withPlural, setWithPlural] = useState(false);
  const chosen = (levels ?? available).filter((l) => available.includes(l));
  const selected = words.filter((w) => chosen.includes(w.introducedAtLevel));

  if (words.length === 0) return null;

  const toggle = (level) =>
    setLevels(chosen.includes(level) ? chosen.filter((l) => l !== level) : [...chosen, level]);

  const download = () => {
    const blob = new Blob([wordsToCsv(selected, { withPlural })], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}${chosen.length < available.length ? "-" + chosen.join("-") : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) {
    return (
      <button type="button" className="fb-btn-secondary qz-toggle" onClick={() => setOpen(true)}>
        <DownloadSimple aria-hidden="true" /> {t("qz.button")}
      </button>
    );
  }

  return (
    <fieldset className="qz">
      <legend>{t("qz.title")}</legend>
      <div className="qz-levels">
        {available.map((l) => (
          <label key={l}>
            <input type="checkbox" checked={chosen.includes(l)} onChange={() => toggle(l)} /> {l}{" "}
            <span className="dim">({counts[l]})</span>
          </label>
        ))}
      </div>
      {words.some((w) => w.plural) && (
      <label className="qz-plural">
        <input type="checkbox" checked={withPlural} onChange={(e) => setWithPlural(e.target.checked)} />{" "}
        {t("qz.plural")}
      </label>
      )}
      <div className="qz-actions">
        <button type="button" className="fb-btn-primary" disabled={selected.length === 0} onClick={download}>
          <DownloadSimple aria-hidden="true" /> {t(downloadKey, { n: selected.length })}
        </button>
        <button type="button" className="fb-btn-secondary" onClick={() => setOpen(false)}>
          {t("qz.close")}
        </button>
      </div>
      <p className="dim qz-hint">{t("qz.hint")}</p>
    </fieldset>
  );
}
