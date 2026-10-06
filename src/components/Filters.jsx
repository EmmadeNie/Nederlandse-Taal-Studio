import { LEVELS, getAllThemes } from "../data";

export function WordFilters({ filters, onChange }) {
  const themes = getAllThemes();

  return (
    <div className="filters">
      <input
        type="text"
        placeholder="Zoek woord (NL of EN)..."
        value={filters.search || ""}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        aria-label="Zoek woord"
      />
      <select
        value={filters.level || ""}
        onChange={(e) => onChange({ ...filters, level: e.target.value || null })}
        aria-label="Filter op niveau"
      >
        <option value="">Alle niveaus</option>
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
        aria-label="Filter op thema"
      >
        <option value="">Alle thema's</option>
        {themes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <select
        value={filters.partOfSpeech || ""}
        onChange={(e) =>
          onChange({ ...filters, partOfSpeech: e.target.value || null })
        }
        aria-label="Filter op woordsoort"
      >
        <option value="">Alle woordsoorten</option>
        <option value="noun">Zelfstandig naamwoord</option>
        <option value="verb">Werkwoord</option>
        <option value="adjective">Bijvoeglijk naamwoord</option>
        <option value="adverb">Bijwoord</option>
        <option value="preposition">Voorzetsel</option>
        <option value="pronoun">Voornaamwoord</option>
      </select>
    </div>
  );
}
