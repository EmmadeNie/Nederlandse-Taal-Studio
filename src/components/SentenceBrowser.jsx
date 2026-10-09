import { querySentences, LEVELS } from "../data";
import { LevelBadge, ReviewBadge, Tag } from "./Badges";
import { getAllThemes, getAllGrammarTags } from "../data";
import { TENSES, SENTENCE_TYPES, WORD_ORDERS } from "../data/schema.js";
import FeedbackButton from "../feedback/FeedbackButton";
import { useUrlParams, useSetUrlParams } from "../hooks/useUrlParams";
import { useI18n } from "../i18n/context";
import { Note } from "../icons";

export default function SentenceBrowser() {
  const { t } = useI18n();
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
      <h2>{t("nav.sentences")}</h2>
      <div className="filters">
        <input
          type="text"
          placeholder={t("sent.search")}
          value={filters.search || ""}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          aria-label={t("sent.searchAria")}
        />
        <select
          value={filters.level || ""}
          onChange={(e) =>
            setFilters({ ...filters, level: e.target.value || null })
          }
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
          value={filters.grammarTag || ""}
          onChange={(e) =>
            setFilters({ ...filters, grammarTag: e.target.value || null })
          }
          aria-label={t("filter.grammar")}
        >
          <option value="">{t("filter.allGrammar")}</option>
          {grammarTags.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
        <select
          value={filters.tense || ""}
          onChange={(e) =>
            setFilters({ ...filters, tense: e.target.value || null })
          }
          aria-label={t("filter.tense")}
        >
          <option value="">{t("filter.allTenses")}</option>
          {TENSES.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
        <select
          value={filters.sentenceType || ""}
          onChange={(e) =>
            setFilters({ ...filters, sentenceType: e.target.value || null })
          }
          aria-label={t("filter.stype")}
        >
          <option value="">{t("filter.allStypes")}</option>
          {SENTENCE_TYPES.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
        <select
          value={filters.wordOrder || ""}
          onChange={(e) =>
            setFilters({ ...filters, wordOrder: e.target.value || null })
          }
          aria-label={t("filter.order")}
        >
          <option value="">{t("filter.allOrders")}</option>
          {WORD_ORDERS.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
        <select
          value={filters.theme || ""}
          onChange={(e) =>
            setFilters({ ...filters, theme: e.target.value || null })
          }
          aria-label={t("filter.theme")}
        >
          <option value="">{t("filter.allThemes")}</option>
          {themes.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setUrlParams({ sort: e.target.value || null })}
          aria-label={t("sort.aria")}
        >
          <option value="default">{t("sort.default")}</option>
          <option value="level-asc">{t("sort.levelAsc")}</option>
          <option value="level-desc">{t("sort.levelDesc")}</option>
        </select>
      </div>
      <p className="result-count">{t("sent.found", { n: results.length })}</p>
      {results.map((s) => (
        <div key={s.id} className="sentence-card">
          <div className="nl">{s.nl}</div>
          <div className="en">{s.en}</div>
          <div className="meta">
            <LevelBadge level={s.introducedAtLevel} />
            {s.difficulty && <Tag>{t("sent.difficulty", { n: s.difficulty })}</Tag>}
            {s.tense && <Tag>{s.tense}</Tag>}
            {s.sentenceType && <Tag>{s.sentenceType}</Tag>}
            {s.wordOrder && s.wordOrder !== "svo" && <Tag>{s.wordOrder}</Tag>}
            {s.grammarTags?.map((x) => (
              <Tag key={x}>{x}</Tag>
            ))}
            {s.themes?.map((x) => (
              <Tag key={x}>{x}</Tag>
            ))}
            <ReviewBadge status={s.reviewStatus} />
          </div>
          {s.reviewNotes && <div className="note"><Note /> {s.reviewNotes}</div>}
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
