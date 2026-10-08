import { querySentences, LEVELS } from "../data";
import { LevelBadge, ReviewBadge, Tag } from "./Badges";
import { getAllThemes, getAllGrammarTags } from "../data";
import { TENSES, SENTENCE_TYPES, WORD_ORDERS } from "../data/schema.js";
import FeedbackButton from "../feedback/FeedbackButton";
import { useUrlParams, useSetUrlParams } from "../hooks/useUrlParams";

export default function SentenceBrowser() {
  const urlParams = useUrlParams();
  const setUrlParams = useSetUrlParams();
  const themes = getAllThemes();
  const grammarTags = getAllGrammarTags();

  // Filters derived from the URL (deep-linkable). `grammar` is the shared
  // param name so a Trello link like ?page=sentences&grammar=perfectum works.
  const filters = {
    search: urlParams.search || "",
    level: urlParams.level || null,
    grammarTag: urlParams.grammar || null,
    theme: urlParams.theme || null,
    tense: urlParams.tense || null,
    sentenceType: urlParams.stype || null,
    wordOrder: urlParams.order || null,
  };
  const setFilters = (next) =>
    setUrlParams({
      search: next.search,
      level: next.level,
      grammar: next.grammarTag,
      theme: next.theme,
      tense: next.tense,
      stype: next.sentenceType,
      order: next.wordOrder,
    });

  const sort = urlParams.sort || "default";

  const found = querySentences({
    search: filters.search,
    introducedAtLevel: filters.level || undefined,
    grammarTags: filters.grammarTag ? [filters.grammarTag] : undefined,
    themes: filters.theme ? [filters.theme] : undefined,
    tense: filters.tense || undefined,
    sentenceType: filters.sentenceType || undefined,
    wordOrder: filters.wordOrder || undefined,
  });

  // Sort by CEFR level when requested (uses the canonical LEVELS order).
  const results = [...found];
  if (sort === "level-asc" || sort === "level-desc") {
    results.sort((a, b) => {
      const diff =
        LEVELS.indexOf(a.introducedAtLevel) -
        LEVELS.indexOf(b.introducedAtLevel);
      return sort === "level-asc" ? diff : -diff;
    });
  }

  return (
    <div>
      <h2>Zinnen</h2>
      <div className="filters">
        <input
          type="text"
          placeholder="Zoek zin..."
          value={filters.search || ""}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          aria-label="Zoek zin"
        />
        <select
          value={filters.level || ""}
          onChange={(e) =>
            setFilters({ ...filters, level: e.target.value || null })
          }
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
          value={filters.grammarTag || ""}
          onChange={(e) =>
            setFilters({ ...filters, grammarTag: e.target.value || null })
          }
          aria-label="Filter op grammatica"
        >
          <option value="">Alle grammatica</option>
          {grammarTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={filters.tense || ""}
          onChange={(e) =>
            setFilters({ ...filters, tense: e.target.value || null })
          }
          aria-label="Filter op tijd"
        >
          <option value="">Alle tijden</option>
          {TENSES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={filters.sentenceType || ""}
          onChange={(e) =>
            setFilters({ ...filters, sentenceType: e.target.value || null })
          }
          aria-label="Filter op zinstype"
        >
          <option value="">Alle zinstypes</option>
          {SENTENCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={filters.wordOrder || ""}
          onChange={(e) =>
            setFilters({ ...filters, wordOrder: e.target.value || null })
          }
          aria-label="Filter op woordvolgorde"
        >
          <option value="">Alle woordvolgorde</option>
          {WORD_ORDERS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={filters.theme || ""}
          onChange={(e) =>
            setFilters({ ...filters, theme: e.target.value || null })
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
          value={sort}
          onChange={(e) => setUrlParams({ sort: e.target.value || null })}
          aria-label="Sorteren"
        >
          <option value="default">Sorteren: standaard</option>
          <option value="level-asc">Niveau: laag → hoog</option>
          <option value="level-desc">Niveau: hoog → laag</option>
        </select>
      </div>
      <p className="result-count">{results.length} zinnen gevonden</p>
      {results.map((s) => (
        <div key={s.id} className="sentence-card">
          <div className="nl">{s.nl}</div>
          <div className="en">{s.en}</div>
          <div className="meta">
            <LevelBadge level={s.introducedAtLevel} />
            {s.difficulty && <Tag>moeilijkheid: {s.difficulty}/5</Tag>}
            {s.tense && <Tag>{s.tense}</Tag>}
            {s.sentenceType && <Tag>{s.sentenceType}</Tag>}
            {s.wordOrder && s.wordOrder !== "svo" && <Tag>{s.wordOrder}</Tag>}
            {s.grammarTags?.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
            {s.themes?.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
            <ReviewBadge status={s.reviewStatus} />
          </div>
          {s.reviewNotes && <div className="note">📝 {s.reviewNotes}</div>}
          <div className="card-footer">
            <FeedbackButton
              itemType="sentence"
              itemId={s.id}
              itemLabel={s.nl}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
