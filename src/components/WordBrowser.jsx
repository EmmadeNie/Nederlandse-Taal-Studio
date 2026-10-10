import { useContentVersion } from "../data/useContent";
import { EditItemButton, NewItemButton } from "../library/ItemEditing";
import { queryWords } from "../data";
import { LevelBadge, ReviewBadge, Tag } from "./Badges";
import { WordFilters } from "./Filters";
import QuizletExport from "./QuizletExport";
import FeedbackButton from "../feedback/FeedbackButton";
import { useUrlParams, useSetUrlParams } from "../hooks/useUrlParams";
import { useI18n } from "../i18n/context";

export default function WordBrowser() {
  const { t } = useI18n();
  useContentVersion();
  const urlParams = useUrlParams();
  const setUrlParams = useSetUrlParams();

  // Filters are derived from the URL so deep links work and are shareable.
  const filters = {
    search: urlParams.search || "",
    level: urlParams.level || null,
    theme: urlParams.theme || null,
    partOfSpeech: urlParams.pos || null,
  };
  const setFilters = (next) =>
    setUrlParams({
      search: next.search,
      level: next.level,
      theme: next.theme,
      pos: next.partOfSpeech,
    });

  const results = queryWords({
    search: filters.search,
    introducedAtLevel: filters.level,
    themes: filters.theme ? [filters.theme] : undefined,
    partOfSpeech: filters.partOfSpeech,
  }).filter((w) => w.partOfSpeech !== "verb"); // verbs have their own page

  return (
    <div>
      <h2>{t("nav.words")}</h2>
      <NewItemButton type="word" />
      <WordFilters filters={filters} onChange={setFilters} />
      <p className="result-count">{t("words.found", { n: results.length })}</p>
      <div className="qz-library">
        <QuizletExport
          words={results}
          filename={["woorden", filters.theme, filters.partOfSpeech, filters.level].filter(Boolean).join("-")}
        />
      </div>
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
                  {t("words.plural")} {w.plural}
                </span>
              )}
            </div>
            <div className="meta">
              {w.themes?.map((theme) => (
                <Tag key={theme}>{theme}</Tag>
              ))}
              <ReviewBadge status={w.reviewStatus} />
            </div>
            <div className="card-footer">
              <EditItemButton item={w} />
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
