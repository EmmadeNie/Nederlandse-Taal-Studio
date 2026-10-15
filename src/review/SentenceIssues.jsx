import { useEffect, useState } from "react";
import { useI18n } from "../i18n/context";
import { getItem, setsWithItem } from "../data";
import { deleteItem } from "../data/contentApi";
import { Dialog } from "../leerpad/shared";
import { useContentVersion } from "../data/useContent";
import SentenceParts from "../components/SentenceParts";
import { hiddenSentenceIds, openIssues, resolveIssue } from "./api";
import { setHiddenSentences } from "../data";
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
  const [deleting, setDeleting] = useState(null); // the sentence id being confirmed for deletion
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    openIssues()
      .then(setIssues)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="lp-error">{error}</div>;
  if (!issues) return null;

  // "Nu verwijderen" on a weghalen flag: first where the sentence still is, then gone for good
  // (its remarks go with it; sets and other references are cleaned up by deleteItem).
  const removeSentence = async (id) => {
    setBusy(true);
    setError(null);
    try {
      await deleteItem(id);
      setIssues((list) => list.filter((i) => i.sentence_id !== id));
      setDeleting(null);
      hiddenSentenceIds().then(setHiddenSentences, () => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const resolve = async (id) => {
    try {
      await resolveIssue(id);
      setIssues((list) => list.filter((i) => i.id !== id));
      // A handled "weghalen" flag lets the sentence back into the exercises.
      hiddenSentenceIds().then(setHiddenSentences, () => {});
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
                <span className="rv-issue-actions">
                  {s && i.aspects?.includes("weghalen") && (
                    <button type="button" className="lp-danger" onClick={() => setDeleting(i.sentence_id)}>
                      {t("flag.deleteNow")}
                    </button>
                  )}
                  <button type="button" className="fb-btn-primary" onClick={() => resolve(i.id)}>
                    {t("review.resolve")}
                  </button>
                </span>
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
      {deleting && (
        <Dialog title={t("flag.deleteTitle")} onClose={() => setDeleting(null)}>
          <p className="flag-sentence">{getItem(deleting)?.nl}</p>
          {setsWithItem(deleting).length > 0 ? (
            <>
              <p>{t("flag.inSets")}</p>
              <ul className="flag-sets">
                {setsWithItem(deleting).map((set) => (
                  <li key={set.id}>{set.title}</li>
                ))}
              </ul>
              <p className="dim">{t("flag.inSetsNote")}</p>
            </>
          ) : (
            <p className="dim">{t("flag.inNoSet")}</p>
          )}
          <div className="fb-actions">
            <button type="button" className="fb-btn-secondary" onClick={() => setDeleting(null)} disabled={busy}>
              {t("common.cancel")}
            </button>
            <button type="button" className="lp-danger" onClick={() => removeSentence(deleting)} disabled={busy}>
              {t("flag.deleteForGood")}
            </button>
          </div>
        </Dialog>
      )}
    </section>
  );
}
