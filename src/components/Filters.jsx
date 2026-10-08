import { LEVELS, getAllThemes } from "../data";
import { useI18n } from "../i18n/context";

export function WordFilters({ filters, onChange }) {
  const { t } = useI18n();
  const themes = getAllThemes();

  return (
    <div className="filters">
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
    </div>
  );
}
