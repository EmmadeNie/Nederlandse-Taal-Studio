import { useContentVersion } from "../data/useContent";
import { EditItemButton, NewItemButton } from "../library/ItemEditing";
import { queryWords } from "../data";
import { LevelBadge, ReviewBadge, Tag } from "./Badges";
import FeedbackButton from "../feedback/FeedbackButton";
import { useUrlParams, useSetUrlParams } from "../hooks/useUrlParams";
import { useI18n } from "../i18n/context";
import { Note } from "../icons";

const LEVELS = ["A0", "A1", "A2", "B1", "B2"];

export default function VerbBrowser() {
  const { t } = useI18n();
  useContentVersion();
  const urlParams = useUrlParams();
  const setUrlParams = useSetUrlParams();
  const search = urlParams.search || "";
  const level = urlParams.level || "";
  const type = urlParams.type || "";
  const setSearch = (v) => setUrlParams({ search: v });
  const setLevel = (v) => setUrlParams({ level: v });
  const setType = (v) => setUrlParams({ type: v });

  const verbs = queryWords({ partOfSpeech: "verb" }).filter((v) => {
    if (search) {
      const q = search.toLowerCase();
      if (!v.nl.toLowerCase().includes(q) && !v.en.toLowerCase().includes(q))
        return false;
    }
    if (level && v.introducedAtLevel !== level) return false;
    if (type === "fully-regular") {
      const r = v.conjugation?.regularity;
      if (!r || r.past !== "regular" || r.participle !== "regular") return false;
    }
    if (type === "has-irregular") {
      const r = v.conjugation?.regularity;
      if (!r || (r.past === "regular" && r.participle === "regular"))
        return false;
    }
    return true;
  });

  return (
    <div>
      <h2>{t("nav.verbs")}</h2>
      <NewItemButton type="word" extra={{ partOfSpeech: "verb", conjugation: {} }} label={t("ie.new.verb")} />
      <div className="filters">
        <input
          type="text"
          placeholder={t("verbs.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t("verbs.searchAria")}
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
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
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label={t("verbs.typeAria")}
        >
          <option value="">{t("verbs.allTypes")}</option>
          <option value="fully-regular">{t("dash.fullyRegular")}</option>
          <option value="has-irregular">{t("dash.hasIrregular")}</option>
        </select>
      </div>
      <p className="result-count">{t("verbs.found", { n: verbs.length })}</p>
      <div className="card-grid">
        {verbs.map((v) => (
          <div key={v.id} className="card">
            <div className="card-header">
              <span className="word">{v.nl}</span>
              <LevelBadge level={v.introducedAtLevel} />
            </div>
            <div className="translation">{v.en}</div>

            {/* Per-form regularity badges */}
            {v.conjugation?.regularity && (
              <div style={{ marginBottom: "0.5rem" }}>
                {Object.entries(v.conjugation.regularity).map(
                  ([form, reg]) => (
                    <Tag key={form}>
                      {t(`verbs.form.${form}`)}: {t(`verbs.${reg}`)}
                    </Tag>
                  )
                )}
              </div>
            )}

            {v.conjugation && (
              <div className="conjugation">
                <strong
                  style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}
                >
                  {t("verbs.present")}
                </strong>
                {v.conjugation.present &&
                  Object.entries(v.conjugation.present).map(
                    ([person, form]) => (
                      <div className="row" key={person}>
                        <span className="label">{person}</span>
                        <span>{form}</span>
                      </div>
                    )
                  )}
                <div
                  style={{
                    marginTop: "0.4rem",
                    paddingTop: "0.4rem",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <strong
                    style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}
                  >
                    {t("verbs.past")}
                  </strong>
                  {v.conjugation.past && (
                    <>
                      <div className="row">
                        <span className="label">{t("verbs.sg")}</span>
                        <span>{v.conjugation.past.singular}</span>
                      </div>
                      <div className="row">
                        <span className="label">{t("verbs.pl")}</span>
                        <span>{v.conjugation.past.plural}</span>
                      </div>
                    </>
                  )}
                </div>
                <div
                  className="row"
                  style={{
                    marginTop: "0.4rem",
                    paddingTop: "0.4rem",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <span className="label">{t("verbs.participle")}</span>
                  <span>{v.conjugation.participle}</span>
                </div>
                {v.conjugation.auxiliary && (
                  <div className="row">
                    <span className="label">{t("verbs.aux")}</span>
                    <span>{v.conjugation.auxiliary}</span>
                  </div>
                )}
              </div>
            )}

            <div className="meta" style={{ marginTop: "0.5rem" }}>
              {v.tags?.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
              {v.themes?.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
              <ReviewBadge status={v.reviewStatus} />
            </div>
            {v.reviewNotes && (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--amber)",
                  fontStyle: "italic",
                  marginTop: "0.5rem",
                }}
              >
                <Note /> {v.reviewNotes}
              </div>
            )}
            <div className="card-footer">
              <EditItemButton item={v} />
              <FeedbackButton
                itemType="verb"
                itemId={v.id}
                itemLabel={`${v.nl} (${v.en})`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
