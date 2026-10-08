import { queryWords } from "../data";
import { LevelBadge, ReviewBadge, Tag } from "./Badges";
import FeedbackButton from "../feedback/FeedbackButton";
import { useUrlParams, useSetUrlParams } from "../hooks/useUrlParams";

const LEVELS = ["A0", "A1", "A2", "B1", "B2"];

const REGULARITY_LABELS = {
  regular: "regelmatig",
  irregular: "onregelmatig",
};

export default function VerbBrowser() {
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
      <h2>Werkwoorden</h2>
      <div className="filters">
        <input
          type="text"
          placeholder="Zoek werkwoord..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Zoek werkwoord"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
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
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Filter op type"
        >
          <option value="">Alle types</option>
          <option value="fully-regular">Volledig regelmatig</option>
          <option value="has-irregular">Met onregelmatige vorm</option>
        </select>
      </div>
      <p className="result-count">{verbs.length} werkwoorden gevonden</p>
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
                      {form}: {REGULARITY_LABELS[reg]}
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
                  Tegenwoordige tijd:
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
                    Verleden tijd:
                  </strong>
                  {v.conjugation.past && (
                    <>
                      <div className="row">
                        <span className="label">enk.</span>
                        <span>{v.conjugation.past.singular}</span>
                      </div>
                      <div className="row">
                        <span className="label">mv.</span>
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
                  <span className="label">v.d.</span>
                  <span>{v.conjugation.participle}</span>
                </div>
                {v.conjugation.auxiliary && (
                  <div className="row">
                    <span className="label">hulpww.</span>
                    <span>{v.conjugation.auxiliary}</span>
                  </div>
                )}
              </div>
            )}

            <div className="meta" style={{ marginTop: "0.5rem" }}>
              {v.tags?.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
              {v.themes?.map((t) => (
                <Tag key={t}>{t}</Tag>
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
                📝 {v.reviewNotes}
              </div>
            )}
            <div className="card-footer">
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
