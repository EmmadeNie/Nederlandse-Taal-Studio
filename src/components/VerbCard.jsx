import { LevelBadge, ReviewBadge, Tag } from "./Badges";
import FeedbackButton from "../feedback/FeedbackButton";
import { EditItemButton } from "../library/ItemEditing";
import { useI18n } from "../i18n/context";
import { Note } from "../icons";

/** A verb with its regularity and full conjugation (Werkwoorden, grammar topics). */
export default function VerbCard({ verb: v }) {
  const { t } = useI18n();
  return (
    <div className="card">
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
  );
}
