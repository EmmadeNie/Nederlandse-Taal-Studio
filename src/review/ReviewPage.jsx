import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/context";
import { useI18n } from "../i18n/context";
import { LEVELS, sentences } from "../data";
import { useContentVersion } from "../data/useContent";
import SentenceParts from "../components/SentenceParts";
import { myReviews, reviewSentence, sentenceVersions } from "./api";
import { summaryLines } from "./summary";
import "./review.css";

const ASPECTS = ["onderwerp", "werkwoord", "voornaamwoord", "woord", "zin"];
const analysed = (s) => (s.parts?.length || 0) + (s.pronouns?.length || 0) + (s.marks?.length || 0) > 0;
const rank = (s) => {
  const i = LEVELS.indexOf(s.introducedAtLevel);
  return i < 0 ? LEVELS.length : i;
};

/**
 * Zinnen nakijken: one sentence at a time, big, with its subject, verbs and
 * pronouns; "Klopt" or "Klopt niet" (what, and a remark). Made for a phone.
 * Only sentences with an analysis, lowest level first; a sentence checked at
 * its current version doesn't come back, a changed one does.
 */
export default function ReviewPage() {
  const { t } = useI18n();
  const { profile } = useAuth();
  useContentVersion();
  const [versions, setVersions] = useState(null);
  const [checked, setChecked] = useState(null); // sentence id → version I checked
  const [skipped, setSkipped] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(null); // { aspects: Set, comment } while filling in "klopt niet"
  const [thanks, setThanks] = useState(null);

  useEffect(() => {
    Promise.all([sentenceVersions(), myReviews(profile.id)])
      .then(([v, reviews]) => {
        setVersions(v);
        const mine = {};
        reviews.forEach((r) => {
          if (!mine[r.sentence_id]) mine[r.sentence_id] = r.item_version;
        });
        setChecked(mine);
      })
      .catch((e) => setError(e.message));
  }, [profile.id]);

  const all = useMemo(
    () => sentences.filter(analysed).sort((a, b) => rank(a) - rank(b) || a.nl.localeCompare(b.nl, "nl")),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sentences is filled in place; versions reloads with it
    [versions]
  );
  const isDone = (s) => checked?.[s.id] && versions?.[s.id] && new Date(checked[s.id]) >= new Date(versions[s.id]);
  const todo = all.filter((s) => !isDone(s));
  const queue = [...todo.filter((s) => !skipped.includes(s.id)), ...todo.filter((s) => skipped.includes(s.id))];
  const current = queue[0];
  const doneCount = all.length - todo.length;

  if (error) return <div className="lp-error">{error}</div>;
  if (!versions || !checked) return <p className="dim">{t("common.loading")}</p>;

  const send = async (verdict) => {
    setBusy(true);
    setError(null);
    try {
      await reviewSentence({
        sentenceId: current.id,
        verdict,
        seenVersion: versions[current.id],
        aspects: verdict === "issue" ? [...problem.aspects] : [],
        comment: verdict === "issue" ? problem.comment.trim() : "",
      });
      // An "ok" changes the sentence (checked by), so read its new version.
      const fresh = await sentenceVersions();
      setVersions(fresh);
      setChecked((c) => ({ ...c, [current.id]: fresh[current.id] }));
      setProblem(null);
      setSkipped((s) => s.filter((id) => id !== current.id));
      setThanks(verdict === "ok" ? t("review.thanksOk") : t("review.thanksIssue"));
      setTimeout(() => setThanks(null), 1500);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <div className="rv-head">
      <h2>{t("nav.nakijken")}</h2>
      <span className="dim">{t("review.progress", { done: doneCount, n: all.length })}</span>
    </div>
  );

  if (!all.length) {
    return (
      <div className="rv-page">
        {header}
        <p className="rv-empty">{t("review.none")}</p>
      </div>
    );
  }
  if (!current) {
    return (
      <div className="rv-page">
        {header}
        <div className="rv-empty">
          <div className="rv-big">🎉</div>
          <p>{t("review.allDone")}</p>
        </div>
      </div>
    );
  }

  const lines = summaryLines(current, t);
  return (
    <div className="rv-page">
      {header}
      <div className="rv-bar" aria-hidden="true">
        <div className="rv-bar-fill" style={{ width: `${(doneCount / all.length) * 100}%` }} />
      </div>
      {thanks && <div className="rv-thanks">{thanks}</div>}

      <div className="rv-card">
        <div className="rv-sentence">
          <SentenceParts nl={current.nl} parts={current.parts} pronouns={current.pronouns} marks={current.marks} />
        </div>
        {current.en && <div className="rv-en dim">{current.en}</div>}
        <dl className="rv-lines">
          {lines.map((l, i) => (
            <div key={i} className="rv-line">
              <dt>{l.key}</dt>
              <dd>
                <span className={`rv-mark rv-${l.kind}`}>{l.text}</span>
                {l.extra && <span className="dim"> · {l.extra}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {problem ? (
        <div className="rv-problem">
          <p>{t("review.whatWrong")}</p>
          <div className="rv-aspects">
            {ASPECTS.map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={problem.aspects.has(a)}
                onClick={() =>
                  setProblem((p) => {
                    const next = new Set(p.aspects);
                    if (next.has(a)) next.delete(a);
                    else next.add(a);
                    return { ...p, aspects: next };
                  })
                }
              >
                {t(`review.aspect.${a}`)}
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={problem.comment}
            onChange={(e) => setProblem((p) => ({ ...p, comment: e.target.value }))}
            placeholder={t("review.commentPlaceholder")}
            aria-label={t("review.comment")}
          />
          <div className="rv-buttons">
            <button type="button" className="rv-btn rv-cancel" onClick={() => setProblem(null)} disabled={busy}>
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="rv-btn rv-send"
              onClick={() => send("issue")}
              disabled={busy || (!problem.aspects.size && !problem.comment.trim())}
            >
              {t("review.send")}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="rv-buttons">
            <button type="button" className="rv-btn rv-no" onClick={() => setProblem({ aspects: new Set(), comment: "" })} disabled={busy}>
              {t("review.no")}
            </button>
            <button type="button" className="rv-btn rv-yes" onClick={() => send("ok")} disabled={busy}>
              {t("review.yes")}
            </button>
          </div>
          {queue.length > 1 && (
            <button type="button" className="fb-link rv-skip" onClick={() => setSkipped((s) => [...s.filter((id) => id !== current.id), current.id])}>
              {t("review.skip")}
            </button>
          )}
        </>
      )}
    </div>
  );
}
