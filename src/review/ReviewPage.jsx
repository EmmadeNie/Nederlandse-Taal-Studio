import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/context";
import { useI18n } from "../i18n/context";
import { LEVELS, sentences } from "../data";
import { useContentVersion } from "../data/useContent";
import SentenceParts from "../components/SentenceParts";
import { myReviews, reviewBatches, reviewSentence, sentenceVersions } from "./api";
import { navigate, useRoute } from "../hooks/useRoute";
import { pathFor } from "../routes";
import { summaryLines } from "./summary";
import "./review.css";
import FlagButton from "./FlagButton";

const ASPECTS = ["onderwerp", "werkwoord", "voornaamwoord", "woord", "zin"];
const MARK_ASPECTS = ["woord", "zin"];
const analysed = (s) => (s.parts?.length || 0) + (s.pronouns?.length || 0) + (s.marks?.length || 0) > 0;
// A checked sentence whose marked words (voorzetsels e.d.) changed since: only those need a look.
const marksOnly = (s) => s.reviewStatus === "human-verified" && s.marks?.length > 0 && !s.marksVerifiedAt;
const verified = (s) => s.reviewStatus === "human-verified" && !marksOnly(s);
const rank = (s) => {
  const i = LEVELS.indexOf(s.introducedAtLevel);
  return i < 0 ? LEVELS.length : i;
};

/**
 * Zinnen nakijken: one sentence at a time, big, with its subject, verbs and
 * pronouns; "Klopt" or "Klopt niet" (what, and a remark). Made for a phone.
 * Lowest level first; a sentence checked at its current version doesn't come
 * back, a changed one does.
 *
 * Nakijklijsten: every approved proposal is a list of its sentences
 * (/nakijken/<proposal id>); /nakijken shows the lists, /nakijken/alles every
 * sentence, /nakijken/overig the analysed sentences outside any list.
 */
export default function ReviewPage() {
  const { t, locale } = useI18n();
  const { profile } = useAuth();
  const route = useRoute();
  const listId = route.page === "nakijken" ? route.param : null;
  useContentVersion();
  const [batches, setBatches] = useState(null);
  const [versions, setVersions] = useState(null);
  const [checked, setChecked] = useState(null); // sentence id → version I checked
  const [skipped, setSkipped] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(null); // { aspects: Set, comment } while filling in "klopt niet"
  const [thanks, setThanks] = useState(null);

  useEffect(() => {
    Promise.all([sentenceVersions(), myReviews(profile.id), reviewBatches()])
      .then(([v, reviews, lists]) => {
        setVersions(v);
        setBatches(lists);
        const mine = {};
        reviews.forEach((r) => {
          if (!mine[r.sentence_id]) mine[r.sentence_id] = r.item_version;
        });
        setChecked(mine);
      })
      .catch((e) => setError(e.message));
  }, [profile.id]);

  const isDone = (s) =>
    verified(s) || (checked?.[s.id] && versions?.[s.id] && new Date(checked[s.id]) >= new Date(versions[s.id]));
  const inAnyList = useMemo(() => new Set((batches || []).flatMap((b) => [...b.ids])), [batches]);
  const batch = batches?.find((b) => b.id === listId) || null;
  // The sentences of the chosen list (a proposal's, all, or the rest).
  const pick = (s) =>
    batch ? batch.ids.has(s.id) : listId === "overig" ? analysed(s) && !inAnyList.has(s.id) : analysed(s) || inAnyList.has(s.id);
  const all = useMemo(
    () => sentences.filter(pick).sort((a, b) => rank(a) - rank(b) || a.nl.localeCompare(b.nl, "nl")),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sentences is filled in place; versions reloads with it
    [versions, batches, listId]
  );
  const todo = all.filter((s) => !isDone(s));
  // Skipped sentences go last, in the order they were skipped (so "Deze later" keeps moving on).
  const queue = [
    ...todo.filter((s) => !skipped.includes(s.id)),
    ...skipped.map((id) => todo.find((s) => s.id === id)).filter(Boolean),
  ];
  const current = queue[0];
  const doneCount = all.length - todo.length;

  if (error) return <div className="lp-error">{error}</div>;
  if (!versions || !checked || !batches) return <p className="dim">{t("common.loading")}</p>;

  // No list chosen: the lists to choose from (straight to everything when there are none).
  if (!listId && batches.length) {
    const count = (ids) => {
      const list = sentences.filter((s) => ids(s));
      return { n: list.length, open: list.filter((s) => !isDone(s)).length };
    };
    const rows = batches.map((b) => ({ ...b, ...count((s) => b.ids.has(s.id)) }));
    const rest = count((s) => analysed(s) && !inAnyList.has(s.id));
    const open = rows.filter((r) => r.open > 0);
    const finished = rows.filter((r) => r.open === 0);
    const when = (ts) => (ts ? new Date(ts).toLocaleDateString(locale, { day: "numeric", month: "short" }) : "");
    const Row = ({ to, title, sub, n, left }) => (
      <button type="button" className="rv-list" onClick={() => navigate(pathFor("nakijken", to))}>
        <span className="rv-list-text">
          <strong>{title}</strong>
          <span className="dim">{sub}</span>
        </span>
        <span className={`rv-list-count ${left ? "" : "is-done"}`}>{left ? t("review.listLeft", { n: left, total: n }) : "✓"}</span>
        <span className="rv-bar" aria-hidden="true">
          <span className="rv-bar-fill" style={{ width: `${n ? ((n - left) / n) * 100 : 0}%` }} />
        </span>
      </button>
    );
    return (
      <div className="rv-page">
        <div className="rv-head">
          <h2>{t("nav.nakijken")}</h2>
        </div>
        <p className="dim">{t("review.listsIntro")}</p>
        {open.length === 0 && rest.open === 0 && <p className="rv-empty">{t("review.allDone")}</p>}
        {open.map((r) => (
          <Row key={r.id} to={r.id} title={r.title} sub={t("review.listFrom", { date: when(r.approvedAt) })} n={r.n} left={r.open} />
        ))}
        {rest.open > 0 && <Row to="overig" title={t("review.rest")} sub={t("review.restHint")} n={rest.n} left={rest.open} />}
        {finished.length > 0 && (
          <details className="rv-finished">
            <summary>{t("review.finished", { n: finished.length })}</summary>
            {finished.map((r) => (
              <Row key={r.id} to={r.id} title={r.title} sub={t("review.listFrom", { date: when(r.approvedAt) })} n={r.n} left={0} />
            ))}
          </details>
        )}
        <button type="button" className="fb-link rv-all-link" onClick={() => navigate(pathFor("nakijken", "alles"))}>
          {t("review.allSentences")}
        </button>
      </div>
    );
  }

  const onlyMarks = current ? marksOnly(current) : false;

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
        scope: onlyMarks ? "marks" : "all",
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

  const listTitle = batch ? batch.title : listId === "overig" ? t("review.rest") : listId === "alles" ? t("review.allSentences") : null;
  const header = (
    <>
      {listId && batches.length > 0 && (
        <button type="button" className="fb-link rv-back" onClick={() => navigate(pathFor("nakijken"))}>
          ← {t("review.backToLists")}
        </button>
      )}
      <div className="rv-head">
        <h2>{listTitle || t("nav.nakijken")}</h2>
        <span className="dim">{t("review.progress", { done: doneCount, n: all.length })}</span>
      </div>
    </>
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

  const lines = summaryLines(current, t).filter((l) => !onlyMarks || l.kind === "woord");
  return (
    <div className="rv-page">
      {header}
      <div className="rv-bar" aria-hidden="true">
        <div className="rv-bar-fill" style={{ width: `${(doneCount / all.length) * 100}%` }} />
      </div>
      {thanks && <div className="rv-thanks">{thanks}</div>}

      <div className="rv-card">
        <FlagButton sentence={current} />
        {onlyMarks && <div className="rv-only-marks">{t("review.onlyMarks")}</div>}
        <div className="rv-sentence">
          {onlyMarks ? (
            <SentenceParts nl={current.nl} marks={current.marks} />
          ) : (
            <SentenceParts nl={current.nl} parts={current.parts} pronouns={current.pronouns} marks={current.marks} />
          )}
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
            {(onlyMarks ? MARK_ASPECTS : ASPECTS).map((a) => (
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
