import { useEffect, useState } from "react";
import { useI18n } from "../i18n/context";
import { getItem } from "../data";
import { useContentVersion } from "../data/useContent";
import SentenceParts from "../components/SentenceParts";
import { openIssues, resolveIssue } from "./api";
import "./review.css";

const when = (ts, locale) => new Date(ts).toLocaleDateString(locale, { day: "numeric", month: "short" });

/**
 * Feedback page (docent): open "klopt niet" remarks from the sentence checkers,
 * with the sentence as it is now, "Afgehandeld" and one copy for ChatGPT.
 */
export default function SentenceIssues() {
  const { t, locale } = useI18n();
  useContentVersion();
  const [issues, setIssues] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    openIssues()
      .then(setIssues)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="lp-error">{error}</div>;
  if (!issues) return null;

  const resolve = async (id) => {
    try {
      await resolveIssue(id);
      setIssues((list) => list.filter((i) => i.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  const copy = async () => {
    const items = issues.map((i) => {
      const s = getItem(i.sentence_id);
      return {
        id: i.sentence_id,
        nl: s?.nl,
        parts: s?.parts || [],
        pronouns: s?.pronouns || [],
        marks: s?.marks || [],
        watKloptNiet: i.aspects,
        opmerking: i.comment || "",
      };
    });
    await navigator.clipboard.writeText(`${t("review.copyIntro")}\n\n${JSON.stringify(items, null, 2)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="rv-issues">
      <div className="rv-issues-tools">
        <h3>
          {t("review.issuesTitle")} ({issues.length})
        </h3>
        {issues.length > 0 && (
          <button type="button" className="fb-btn-secondary" onClick={copy}>
            {copied ? t("review.copied") : t("review.copyForChat")}
          </button>
        )}
      </div>
      {issues.length === 0 ? (
        <p className="dim">{t("review.issuesNone")}</p>
      ) : (
        issues.map((i) => {
          const s = getItem(i.sentence_id);
          const name = i.reviewer?.display_name || i.reviewer?.email || "?";
          return (
            <div key={i.id} className="rv-issue">
              <div className="rv-issue-head">
                <span>{t("review.by", { name, date: when(i.created_at, locale) })}</span>
                <button type="button" className="fb-btn-primary" onClick={() => resolve(i.id)}>
                  {t("review.resolve")}
                </button>
              </div>
              <div>{s ? <SentenceParts nl={s.nl} parts={s.parts} pronouns={s.pronouns} marks={s.marks} /> : i.sentence_id}</div>
              {i.aspects?.length > 0 && (
                <div className="rv-aspects">
                  {i.aspects.map((a) => (
                    <span key={a} className="tag">
                      {t(`review.aspect.${a}`)}
                    </span>
                  ))}
                </div>
              )}
              {i.comment && <div className="rv-issue-comment">“{i.comment}”</div>}
            </div>
          );
        })
      )}
    </section>
  );
}
