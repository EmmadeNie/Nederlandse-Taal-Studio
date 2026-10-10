import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../i18n/context";
import { getItem } from "../data";
import { useContentVersion } from "../data/useContent";
import { itemLabel } from "../library/fields";
import { ITEM_OPS, applyChange, evaluate } from "./changeset";
import { clearDecision, deleteProposal, fetchVersions, saveDecision } from "./api";

/** One proposal: ChatGPT's summary and a card per change to approve or reject. */
export default function ProposalView({ proposal, onBack, onChanged, onDeleted }) {
  const { t } = useI18n();
  useContentVersion(); // re-check after each applied change
  const [versions, setVersions] = useState(null);
  const [busy, setBusy] = useState(null); // index being handled, or "all"
  const [errors, setErrors] = useState({});

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

  const ctx = { changes: proposal.changes, decisions: proposal.decisions || {}, versions: versions || {} };
  const evaluations = proposal.changes.map((c, i) => evaluate(c, i, ctx));
  const decided = Object.keys(proposal.decisions || {}).length;

  const canApprove = (i) => {
    const e = evaluations[i];
    return !proposal.decisions?.[i] && !e.blockedBy && e.problems.length === 0;
  };

  // Apply, then record. Each step works on the latest proposal row.
  const decide = async (current, i, status, { force = false } = {}) => {
    const e = evaluate(current.changes[i], i, { ...ctx, decisions: current.decisions || {} });
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
    try {
      for (let i = 0; i < current.changes.length; i++) {
        if (current.decisions?.[i]) continue;
        const e = evaluate(current.changes[i], i, { ...ctx, decisions: current.decisions || {} });
        if (e.blockedBy || e.problems.length || e.conflict) continue;
        current = await decide(current, i, "approved");
      }
    } catch (err) {
      setErrors((x) => ({ ...x, all: err.message }));
    }
    onChanged(current);
    await refreshVersions();
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
      {versions === null && <p className="dim">{t("common.loading")}</p>}

      {versions !== null &&
        proposal.changes.map((change, i) => (
          <ChangeCard
            key={i}
            change={change}
            evaluation={evaluations[i]}
            decision={proposal.decisions?.[i]}
            busy={busy === i || busy === "all"}
            error={errors[i]}
            onApprove={(force) => handle(i, "approved", { force })}
            onReject={() => handle(i, "rejected")}
            onReopen={() => reopen(i)}
          />
        ))}

      <div className="lp-actions">
        <button className="lp-danger" onClick={remove}>
          {t("pr.delete")}
        </button>
      </div>
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
};

const show = (v) =>
  v === undefined || v === null || v === ""
    ? "—"
    : Array.isArray(v)
      ? v.join(", ") || "—"
      : typeof v === "object"
        ? JSON.stringify(v)
        : String(v);

const nameOf = (id) => itemLabel(getItem(id)) || id;

function ChangeCard({ change, evaluation, decision, busy, error, onApprove, onReject, onReopen }) {
  const { t } = useI18n();
  const { before, after, problems, conflict, blockedBy } = evaluation;
  const isItem = ITEM_OPS.includes(change.op);
  const label = (key) => {
    if (key === "introducedAtLevel") key = "level";
    const text = t(`f.${key}`);
    return text === `f.${key}` ? key : text;
  };

  // Rows: field | now | proposal
  let rows = [];
  if (isItem) {
    // eslint-disable-next-line no-unused-vars -- id is shown in the header
    const strip = (x) => (x ? (({ id, ...rest }) => rest)(x) : {});
    const b = strip(before);
    const a = strip(after);
    if (change.op === "add") rows = Object.keys(a).map((k) => [label(k), null, show(a[k])]);
    else if (change.op === "delete") rows = Object.keys(b).map((k) => [label(k), show(b[k]), null]);
    else
      rows = [...new Set([...Object.keys(b), ...Object.keys(a)])]
        .filter((k) => JSON.stringify(b[k]) !== JSON.stringify(a[k]))
        .map((k) => [label(k), show(b[k]), show(a[k])]);
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

  const what = isItem
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
    <article className={`pr-card ${conflict && !decision ? "is-conflict" : ""} ${decision?.status === "rejected" ? "is-rejected" : ""}`}>
      <header>
        <span className={`pr-kind pr-kind-${kind}`}>{t(`pr.kind.${kind}`)}</span>
        <strong>{what}</strong>
        <code>{isItem ? change.id : change.set}</code>
      </header>
      {setAction && <p className="pr-action">{setAction}</p>}
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
      {!decision && problems.length > 0 && (
        <ul className="pr-problems">
          {problems.map((x, j) => (
            <li key={j}>
              {x.field && <span className="dim">{label(x.field)}: </span>}
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
              <span className="dim">{field}</span>
              <span className={old !== null && next !== null ? "pr-old" : undefined}>{old ?? ""}</span>
              <span className={next !== null && old !== null ? "pr-new" : undefined}>{next ?? ""}</span>
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
