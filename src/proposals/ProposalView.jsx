import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../i18n/context";
import { LEVELS, getItem } from "../data";
import { useContentVersion } from "../data/useContent";
import { itemLabel } from "../library/fields";
import { ITEM_OPS, applyChange, evaluate } from "./changeset";
import FieldValue from "./FieldValue";
import { fieldOrder, same, useFieldLabel } from "./fieldDiff";
import { usageOf } from "./usage";
import { LESSON_FIELDS, LESSON_OPS, loadBoard } from "./lessons";
import LessonValue from "./LessonValue";
import { clearDecision, deleteProposal, fetchVersions, saveDecision } from "./api";

/** One proposal: ChatGPT's summary and a card per change to approve or reject. */
export default function ProposalView({ proposal, onBack, onChanged, onDeleted }) {
  const { t } = useI18n();
  useContentVersion(); // re-check after each applied change
  const [versions, setVersions] = useState(null);
  const [busy, setBusy] = useState(null); // index being handled, or "all"
  const [errors, setErrors] = useState({});
  const [order, setOrder] = useState("proposed"); // or "level"
  // Lessons, lanes and labels, only when the proposal changes lessons.
  const hasLessons = proposal.changes.some((c) => LESSON_OPS.includes(c.op));
  const [board, setBoard] = useState(null);
  const refreshBoard = useCallback(async () => {
    if (!hasLessons) return null;
    const b = await loadBoard();
    setBoard(b);
    return b;
  }, [hasLessons]);
  useEffect(() => {
    refreshBoard().catch((e) => setErrors((x) => ({ ...x, all: e.message })));
  }, [refreshBoard]);

  const refreshVersions = useCallback(
    () =>
      fetchVersions(proposal.changes)
        .then(setVersions)
        .catch(() => setVersions({})),
    [proposal.changes]
  );

  useEffect(() => {
    refreshVersions();
  }, [refreshVersions]);

  const ctx = { changes: proposal.changes, decisions: proposal.decisions || {}, versions: versions || {}, board };
  const ready = versions !== null && (!hasLessons || board !== null);
  const evaluations = proposal.changes.map((c, i) => evaluate(c, i, ctx));
  const decided = Object.keys(proposal.decisions || {}).length;

  // Shown in the proposed order, or grouped by level (the proposed level, else the current one).
  const all = proposal.changes.map((_, i) => i);
  const levelOf = (i) => {
    const { before, after } = evaluations[i];
    return after?.introducedAtLevel || after?.level || before?.introducedAtLevel || before?.level || null;
  };
  const groups =
    order === "proposed"
      ? [{ level: null, indexes: all }]
      : [...LEVELS, null]
          .map((level) => ({ level, indexes: all.filter((i) => (levelOf(i) || null) === level) }))
          .filter((g) => g.indexes.length);

  const canApprove = (i) => {
    const e = evaluations[i];
    return !proposal.decisions?.[i] && !e.blockedBy && e.problems.length === 0;
  };

  // Apply, then record. Each step works on the latest proposal row.
  const decide = async (current, i, status, { force = false, boardNow = board } = {}) => {
    const e = evaluate(current.changes[i], i, { ...ctx, board: boardNow, decisions: current.decisions || {} });
    if (status === "approved") {
      if (e.blockedBy || e.problems.length) return current;
      if (e.conflict && !force) return current;
      await applyChange(current.changes[i], e);
    }
    return saveDecision(current, i, { status });
  };

  const handle = async (i, status, opts) => {
    setBusy(i);
    setErrors((x) => ({ ...x, [i]: null }));
    try {
      const updated = await decide(proposal, i, status, opts);
      onChanged(updated);
      await refreshVersions();
      await refreshBoard();
    } catch (err) {
      setErrors((x) => ({ ...x, [i]: err.message }));
    } finally {
      setBusy(null);
    }
  };

  const reopen = async (i) => {
    setBusy(i);
    try {
      onChanged(await clearDecision(proposal, i));
    } catch (err) {
      setErrors((x) => ({ ...x, [i]: err.message }));
    } finally {
      setBusy(null);
    }
  };

  // All changes that can go without questions (no problems, conflicts or waiting), in order.
  const approveAll = async () => {
    setBusy("all");
    let current = proposal;
    let boardNow = board;
    try {
      for (let i = 0; i < current.changes.length; i++) {
        if (current.decisions?.[i]) continue;
        const e = evaluate(current.changes[i], i, { ...ctx, board: boardNow, decisions: current.decisions || {} });
        if (e.blockedBy || e.problems.length || e.conflict) continue;
        current = await decide(current, i, "approved", { boardNow });
        // Positions and versions on the board change with each lesson.
        if (LESSON_OPS.includes(current.changes[i].op)) boardNow = await loadBoard();
      }
    } catch (err) {
      setErrors((x) => ({ ...x, all: err.message }));
    }
    onChanged(current);
    await refreshVersions();
    await refreshBoard();
    setBusy(null);
  };

  const rejectRest = async () => {
    if (!window.confirm(t("pr.confirmRejectRest"))) return;
    setBusy("all");
    let current = proposal;
    try {
      for (let i = 0; i < current.changes.length; i++) {
        if (!current.decisions?.[i]) current = await saveDecision(current, i, { status: "rejected" });
      }
    } catch (err) {
      setErrors((x) => ({ ...x, all: err.message }));
    }
    onChanged(current);
    setBusy(null);
  };

  const remove = async () => {
    if (!window.confirm(t("pr.confirmDelete"))) return;
    await deleteProposal(proposal.id);
    onDeleted();
  };

  return (
    <div className="proposal">
      <button type="button" className="fb-link" onClick={onBack}>
        ← {t("pr.back")}
      </button>
      <h2>{proposal.title}</h2>
      {proposal.summary && (
        <div className="pr-box">
          <span className="pr-box-label">{t("pr.summaryLabel")}</span>
          <p>{proposal.summary}</p>
        </div>
      )}
      <div className="pr-bar">
        <span>{t("pr.progress", { done: decided, n: proposal.changes.length })}</span>
        <span className="pr-bar-actions">
          <button type="button" className="fb-btn-secondary" onClick={rejectRest} disabled={busy !== null || decided === proposal.changes.length}>
            {t("pr.rejectRest")}
          </button>
          <button
            type="button"
            className="fb-btn-primary"
            onClick={approveAll}
            disabled={busy !== null || !proposal.changes.some((_, i) => canApprove(i) && !evaluations[i].conflict)}
          >
            {t("pr.approveAll")}
          </button>
        </span>
      </div>
      {errors.all && <div className="auth-error">{errors.all}</div>}
      {ready && <ProblemSummary proposal={proposal} evaluations={evaluations} errors={errors} />}
      {!ready && <p className="dim">{t("common.loading")}</p>}

      <div role="group" aria-label={t("pr.order.label")} className="pr-tabs">
        {["proposed", "level"].map((o) => (
          <button key={o} type="button" aria-pressed={order === o} onClick={() => setOrder(o)}>
            {t(`pr.order.${o}`)}
          </button>
        ))}
      </div>

      {ready &&
        groups.map(({ level, indexes }) => (
          <section key={level ?? "-"}>
            {order === "level" && <h3 className="pr-group">{level ?? t("pr.order.none")}</h3>}
            {indexes.map((i) => (
              <ChangeCard
                key={i}
                index={i}
                change={proposal.changes[i]}
                board={board}
                evaluation={evaluations[i]}
                decision={proposal.decisions?.[i]}
                busy={busy === i || busy === "all"}
                error={errors[i]}
                onApprove={(force) => handle(i, "approved", { force })}
                onReject={() => handle(i, "rejected")}
                onReopen={() => reopen(i)}
              />
            ))}
          </section>
        ))}

      <div className="lp-actions">
        <button className="lp-danger" onClick={remove}>
          {t("pr.delete")}
        </button>
      </div>
    </div>
  );
}

// ----- All problems at the top, to copy to ChatGPT -----

/** "update word.hond", "lesson.add Werkwoorden oefenen", "vocab.add theme tijd". */
const changeName = (change, evaluation) =>
  [
    change.op,
    change.id || change.set || (change.kind && `${change.kind} ${change.value}`) || evaluation?.after?.title || "",
    change.item ? `(${change.item})` : null,
  ]
    .filter(Boolean)
    .join(" ");

function ProblemSummary({ proposal, evaluations, errors }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const open = proposal.changes
    .map((change, i) => {
      if (proposal.decisions?.[i]) return null;
      const e = evaluations[i];
      const lines = [
        ...(e.problems || []).map((x) => `${x.field ? `${x.field}: ` : ""}${t(x.key, x.vars)}`),
        e.conflict && t("pr.conflict"),
        e.blockedBy && (e.blockedBy.rejected ? t("pr.blockedRejected", { name: e.blockedBy.name }) : t("pr.blocked", { name: e.blockedBy.name })),
        errors[i] && `${t("pr.applyError")}: ${t(errors[i])}`,
      ].filter(Boolean);
      return lines.length ? { i, name: changeName(change, e), lines, waiting: Boolean(e.blockedBy && !e.problems?.length) } : null;
    })
    .filter(Boolean);
  if (!open.length) return null;

  const text = [
    t("pr.copyIntro", { title: proposal.title }),
    "",
    ...open.flatMap((x) => [`#${x.i + 1} ${x.name}`, ...x.lines.map((l) => `- ${l}`), ""]),
    t("pr.copyAsk"),
  ].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t("pr.copyFallback"), text);
    }
  };

  return (
    <div className="pr-summary-box">
      <div className="pr-summary-head">
        <strong>{t("pr.problemCount", { n: open.length })}</strong>
        <button type="button" className="fb-btn-secondary" onClick={copy}>
          {copied ? t("pr.copied") : t("pr.copyForChat")}
        </button>
      </div>
      <ul>
        {open.map((x) => (
          <li key={x.i}>
            <button
              type="button"
              className="fb-link"
              onClick={() => document.getElementById(`pr-card-${x.i}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
            >
              #{x.i + 1} {x.name}
            </button>
            <ul>
              {x.lines.map((l, j) => (
                <li key={j}>{l}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ----- One change -----

const KIND = {
  add: "add",
  update: "update",
  delete: "delete",
  "set.create": "add",
  "set.update": "update",
  "set.delete": "delete",
  "set.addItem": "update",
  "set.removeItem": "update",
  "set.moveItem": "update",
  "vocab.add": "add",
  "lesson.add": "add",
  "lesson.update": "update",
};

const show = (v) =>
  v === undefined || v === null || v === ""
    ? "—"
    : Array.isArray(v)
      ? v.join(", ") || "—"
      : typeof v === "object"
        ? JSON.stringify(v)
        : String(v);

/** Where a deleted item or set is still used (null while loading, or when not a delete). */
function useUsage(change, active) {
  const [usage, setUsage] = useState(null);
  const isDelete = change.op === "delete" || change.op === "set.delete";
  useEffect(() => {
    if (!active || !isDelete) return;
    let live = true;
    usageOf(change)
      .then((u) => live && setUsage(u))
      .catch(() => live && setUsage(null));
    return () => {
      live = false;
    };
  }, [change, active, isDelete]);
  return active && isDelete ? usage : null;
}

const nameOf = (id) => itemLabel(getItem(id)) || id;

function ChangeCard({ index, change, evaluation, decision, busy, error, onApprove, onReject, onReopen, board }) {
  const { t } = useI18n();
  const { before, after, problems, conflict, blockedBy, similar, noPerfect } = evaluation;
  const isItem = ITEM_OPS.includes(change.op);
  const usage = useUsage(change, !decision);
  const itemType = change.type || change.id?.split(".")[0];
  const label = useFieldLabel(itemType);

  // Rows: field | now | proposal (null = no column)
  let rows = [];
  const isLesson = LESSON_OPS.includes(change.op);
  if (isLesson && after) {
    const b = before || {};
    const lv = (x, k) => <LessonValue key={k} field={k} value={x[k]} board={board} />;
    rows = LESSON_FIELDS.filter((k) =>
      change.op === "lesson.add" ? k === "title" || (after[k] != null && after[k] !== "" && !(Array.isArray(after[k]) && !after[k].length)) : !same(b[k], after[k])
    ).map((k) => [t(`pr.lesson.${k}`), change.op === "lesson.add" ? null : lv(b, k), lv(after, k)]);
    if (evaluation.moves) {
      const place = `${after.laneName || "—"} · ${
        change.after ? t("pr.lesson.after", { title: after.afterTitle || change.after }) : "after" in change ? t("pr.lesson.top") : t("pr.lesson.bottom")
      }`;
      const was = before ? board?.lanes.find((l) => l.id === before.laneId)?.name : null;
      rows.push([
        t("pr.lesson.place"),
        change.op === "lesson.add" ? null : (
          <span key="was" className="pr-text">
            {was || "—"}
          </span>
        ),
        <span key="place" className="pr-text">
          {place}
        </span>,
      ]);
    }
  } else if (isItem) {
    const b = before || {};
    const a = after || {};
    const val = (item, k) => <FieldValue type={itemType} field={k} value={item[k]} item={item} />;
    if (change.op === "add") rows = fieldOrder(itemType, a).map((k) => [label(k), null, val(a, k)]);
    else if (change.op === "delete") rows = fieldOrder(itemType, b).map((k) => [label(k), val(b, k), null]);
    else
      rows = fieldOrder(itemType, b, a)
        .filter((k) => !same(b[k], a[k]))
        .map((k) => [label(k), val(b, k), val(a, k)]);
  } else if (change.op === "set.create") {
    rows = [
      [t("pr.setTitle"), null, show(after?.title)],
      [t("pr.setType"), null, t(`sets.type.${change.type}`)],
      [t("pr.setItems"), null, (after?.itemIds || []).map(nameOf).join(", ") || "—"],
    ];
  } else if (change.op === "set.update") {
    rows = [
      ["title", t("pr.setTitle")],
      ["level", t("f.level")],
    ]
      .filter(([k]) => k in change)
      .map(([k, l]) => [l, show(before?.[k]), show(after?.[k])]);
  } else if (change.op === "set.delete") {
    rows = [[t("pr.setTitle"), show(before?.title), null], [t("pr.setItems"), (before?.itemIds || []).length, null]];
  } else if (before && after) {
    rows = [[t("pr.order"), before.itemIds.map(nameOf).join(", "), after.itemIds.map(nameOf).join(", ")]];
  }

  const isVocab = change.op === "vocab.add";
  const what = isLesson
    ? `${t("pr.type.lesson")} · ${after?.title || before?.title || change.id || ""}`
    : isVocab
    ? `${t(`pr.vocab.${change.kind}`)} · ${change.value}`
    : isItem
    ? `${t(`pr.type.${change.type || change.id.split(".")[0]}`)} · ${itemLabel(getItem(change.id)) || change.data?.nl || change.data?.title || change.id}`
    : `${t("pr.type.set")} · ${before?.title || change.title || change.set}`;
  const where = change.after ? "" : "Start";
  const setAction =
    change.op === "set.addItem" || change.op === "set.moveItem"
      ? t(`pr.${change.op.slice(4)}${where}`, { item: nameOf(change.item), after: change.after && nameOf(change.after) })
      : change.op === "set.removeItem"
        ? t("pr.removeItem", { item: nameOf(change.item) })
        : null;

  const kind = KIND[change.op];
  return (
    <article id={`pr-card-${index}`} className={`pr-card ${conflict && !decision ? "is-conflict" : ""} ${decision?.status === "rejected" ? "is-rejected" : ""}`}>
      <header>
        <span className={`pr-kind pr-kind-${kind}`}>{t(`pr.kind.${kind}`)}</span>
        <strong>{what}</strong>
        {!isVocab && !(isLesson && !change.id) && <code>{isItem || isLesson ? change.id : change.set}</code>}
      </header>
      {setAction && <p className="pr-action">{setAction}</p>}
      {isVocab && <p className="pr-action">{t(`pr.vocab.hint.${change.kind}`, { value: change.value })}</p>}
      {change.reason && (
        <p className="pr-reason">
          <span className="dim">{t("pr.reason")}: </span>
          {change.reason}
        </p>
      )}

      {!decision && blockedBy && (
        <div className="pr-note">
          {blockedBy.rejected ? t("pr.blockedRejected", { name: blockedBy.name }) : t("pr.blocked", { name: blockedBy.name })}
        </div>
      )}
      {!decision && conflict && <div className="pr-note pr-note-warn">{t("pr.conflict")}</div>}
      {usage &&
        (usage.length ? (
          <div className="pr-note pr-note-warn">
            {t("pr.usedIn")}
            <ul>
              {usage.map((u, j) => (
                <li key={j}>{t(u.key, u.vars)}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="pr-note dim">{t("pr.unused")}</div>
        ))}
      {!decision && noPerfect && <div className="pr-note pr-note-warn">{t("pr.noPerfect")}</div>}
      {!decision && similar && (
        <div className="pr-note pr-note-warn">{t("pr.similar", { name: itemLabel(similar), id: similar.id })}</div>
      )}
      {!decision && problems.length > 0 && (
        <ul className="pr-problems">
          {problems.map((x, j) => (
            <li key={j}>
              {x.field && <span className="dim">{isLesson ? t(`pr.lesson.${x.field}`) : label(x.field)}: </span>}
              {t(x.key, x.vars)}
            </li>
          ))}
        </ul>
      )}

      {rows.length > 0 && (
        <div className="pr-diff">
          <span className="pr-diff-head">{t("pr.field")}</span>
          <span className="pr-diff-head">{t("pr.now")}</span>
          <span className="pr-diff-head">{t("pr.proposed")}</span>
          {rows.map(([field, old, next], j) => (
            <div key={j} className="pr-diff-row">
              <div className="dim">{field}</div>
              <div className={old !== null && next !== null ? "pr-old" : undefined}>{old ?? ""}</div>
              <div className={next !== null && old !== null ? "pr-new" : undefined}>{next ?? ""}</div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="auth-error">{error}</div>}

      <footer>
        {decision ? (
          <>
            <span className={`pr-decided pr-decided-${decision.status}`}>
              {decision.status === "approved" ? t("pr.approved") : t("pr.rejected")}
            </span>
            {decision.status === "rejected" && (
              <button type="button" className="fb-link" onClick={onReopen} disabled={busy}>
                {t("pr.reopen")}
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" className="fb-btn-secondary" onClick={onReject} disabled={busy}>
              {t("pr.reject")}
            </button>
            {conflict ? (
              <button
                type="button"
                className="fb-btn-primary"
                onClick={() => window.confirm(t("pr.confirmForce")) && onApprove(true)}
                disabled={busy || Boolean(blockedBy) || problems.length > 0}
              >
                {t("pr.approveAnyway")}
              </button>
            ) : (
              <button type="button" className="fb-btn-primary" onClick={() => onApprove(false)} disabled={busy || Boolean(blockedBy) || problems.length > 0}>
                {t("pr.approve")}
              </button>
            )}
          </>
        )}
      </footer>
    </article>
  );
}
