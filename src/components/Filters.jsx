import { useState } from "react";
import { LEVELS, getAllThemes } from "../data";
import { useI18n } from "../i18n/context";

/**
 * A row of filters: the search field and dropdowns. On a phone the dropdowns
 * fold behind a "Filters" button (with how many are set) so the list starts
 * higher; on a computer everything shows as before.
 */
export function FilterBar({ active = 0, children }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className={`filters is-collapsible ${open ? "is-open" : ""}`}>
      {children}
      <button type="button" className="filters-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {t("filter.toggle")}
        {active > 0 && <span className="filters-count">{active}</span>}
      </button>
    </div>
  );
}

export function WordFilters({ filters, onChange }) {
  const { t } = useI18n();
  const themes = getAllThemes();

  return (
    <FilterBar active={[filters.level, filters.theme, filters.partOfSpeech].filter(Boolean).length}>
      <input
        type="text"
        placeholder={t("words.search")}
        value={filters.search || ""}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        aria-label={t("words.searchAria")}
      />
      <select
        value={filters.level || ""}
        onChange={(e) => onChange({ ...filters, level: e.target.value || null })}
        aria-label={t("filter.level")}
      >
        <option value="">{t("level.all")}</option>
        {LEVELS.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
      <select
        value={filters.theme || ""}
        onChange={(e) =>
          onChange({
            ...filters,
            theme: e.target.value || null,
          })
        }
        aria-label={t("filter.theme")}
      >
        <option value="">{t("filter.allThemes")}</option>
        {themes.map((theme) => (
          <option key={theme} value={theme}>
            {theme}
          </option>
        ))}
      </select>
      <select
        value={filters.partOfSpeech || ""}
        onChange={(e) =>
          onChange({ ...filters, partOfSpeech: e.target.value || null })
        }
        aria-label={t("filter.pos")}
      >
        <option value="">{t("filter.allPos")}</option>
        {["noun", "verb", "adjective", "adverb", "preposition", "pronoun"].map((pos) => (
          <option key={pos} value={pos}>
            {t(`pos.${pos}`)}
          </option>
        ))}
      </select>
    </FilterBar>
  );
}
