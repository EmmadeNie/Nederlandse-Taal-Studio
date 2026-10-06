import { useState } from "react";
import { querySentences, LEVELS } from "../data";
import { LevelBadge, ReviewBadge, Tag } from "./Badges";
import { getAllThemes, getAllGrammarTags } from "../data";
import { TENSES, SENTENCE_TYPES, WORD_ORDERS } from "../data/schema.js";

export default function SentenceBrowser() {
  const [filters, setFilters] = useState({});
  const themes = getAllThemes();
  const grammarTags = getAllGrammarTags();

  const results = querySentences({
    search: filters.search,
    introducedAtLevel: filters.level || undefined,
    grammarTags: filters.grammarTag ? [filters.grammarTag] : undefined,
    themes: filters.theme ? [filters.theme] : undefined,
    tense: filters.tense || undefined,
    sentenceType: filters.sentenceType || undefined,
    wordOrder: filters.wordOrder || undefined,
  });

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
        </div>
      ))}
    </div>
  );
}
