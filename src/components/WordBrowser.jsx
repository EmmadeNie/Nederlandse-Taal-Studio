import { useState } from "react";
import { queryWords } from "../data";
import { LevelBadge, ReviewBadge, Tag } from "./Badges";
import { WordFilters } from "./Filters";
import FeedbackButton from "../feedback/FeedbackButton";

export default function WordBrowser() {
  const [filters, setFilters] = useState({});

  const results = queryWords({
    search: filters.search,
    introducedAtLevel: filters.level,
    themes: filters.theme ? [filters.theme] : undefined,
    partOfSpeech: filters.partOfSpeech,
  }).filter((w) => w.partOfSpeech !== "verb"); // verbs have their own page

  return (
    <div>
      <h2>Woordenschat</h2>
      <WordFilters filters={filters} onChange={setFilters} />
      <p className="result-count">{results.length} woorden gevonden</p>
      <div className="card-grid">
        {results.map((w) => (
          <div key={w.id} className="card">
            <div className="card-header">
              {w.article && <span className="article">{w.article}</span>}
              <span className="word">{w.nl}</span>
              <LevelBadge level={w.introducedAtLevel} />
            </div>
            <div className="translation">
              {w.en}
              {w.plural && (
                <span style={{ marginLeft: "0.5rem", opacity: 0.6 }}>
                  mv: {w.plural}
                </span>
              )}
            </div>
            <div className="meta">
              {w.themes?.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
              <ReviewBadge status={w.reviewStatus} />
            </div>
            <div className="card-footer">
              <FeedbackButton
                itemType="word"
                itemId={w.id}
                itemLabel={`${w.article ? w.article + " " : ""}${w.nl} (${w.en})`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
