import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../i18n/context";
import { useRoute, navigate } from "../hooks/useRoute";
import { pathFor } from "../routes";
import { DownloadSimple, Plus } from "../icons";
import { parseChangeset } from "./changeset";
import { createProposal, exportContent, listProposals } from "./api";
import ProposalView from "./ProposalView";
import "./proposals.css";

/**
 * Voorstellen: content changes from ChatGPT, reviewed one by one (docent).
 * Paste a changeset, review it at /voorstellen/<id>. "Exporteren" downloads
 * the current content for ChatGPT to work from.
 */
export default function ProposalsPage({ onCountChange }) {
  const { t, locale } = useI18n();
  const route = useRoute();
  const [proposals, setProposals] = useState(null);
  const [tab, setTab] = useState("open");
  const [pasting, setPasting] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const list = await listProposals();
      setProposals(list);
      onCountChange?.(list.filter((p) => p.status === "open").length);
    } catch (e) {
      setError(e.message);
    }
  }, [onCountChange]);

  useEffect(() => {
    load();
  }, [load]);

  const open = proposals?.find((p) => p.id === route.param);
  if (route.param && open) {
    return (
      <ProposalView
        key={open.id}
        proposal={open}
        onBack={() => navigate(pathFor("proposals"))}
        onChanged={(updated) => {
          setProposals((list) => list.map((p) => (p.id === updated.id ? updated : p)));
          load();
        }}
        onDeleted={() => {
          navigate(pathFor("proposals"));
          load();
        }}
      />
    );
  }

  const shown = (proposals || []).filter((p) => p.status === tab);
  const done = (p) => Object.keys(p.decisions || {}).length;

  return (
    <div className="proposals">
      <h2>{t("nav.proposals")}</h2>
      <p className="lp-intro">{t("pr.intro")}</p>

      <div className="pr-actions">
        <button type="button" className="fb-btn-primary pr-btn" onClick={() => setPasting((v) => !v)}>
          <Plus aria-hidden="true" /> {t("pr.paste")}
        </button>
        <ExportButton />
      </div>

      {pasting && (
        <PasteForm
          onCreated={(p) => {
            setPasting(false);
            load();
            navigate(pathFor("proposals", p.id));
          }}
        />
      )}

      {error && <div className="lp-error">{error}</div>}

      <div role="group" aria-label={t("pr.filter")} className="pr-tabs">
        {["open", "done"].map((s) => (
          <button key={s} type="button" aria-pressed={tab === s} onClick={() => setTab(s)}>
            {t(`pr.tab.${s}`)} ({(proposals || []).filter((p) => p.status === s).length})
          </button>
        ))}
      </div>

      {proposals === null ? (
        <p className="dim">{t("common.loading")}</p>
      ) : shown.length === 0 ? (
        <p className="dim lp-empty">{tab === "open" ? t("pr.noneOpen") : t("pr.noneDone")}</p>
      ) : (
        <ul className="pr-list">
          {shown.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => navigate(pathFor("proposals", p.id))}>
                <span className="pr-title">{p.title}</span>
                {p.summary && <span className="pr-summary">{p.summary}</span>}
                <span className="dim pr-meta">
                  {new Date(p.created_at).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                  {t("pr.progress", { done: done(p), n: p.changes.length })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PasteForm({ onCreated }) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    let parsed;
    try {
      parsed = parseChangeset(text);
    } catch (err) {
      setError(t(err.message, err.vars));
      return;
    }
    setBusy(true);
    try {
      onCreated(await createProposal(parsed));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="pr-paste" onSubmit={submit}>
      <label className="fb-field">
        <span>{t("pr.pasteLabel")}</span>
        <textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          placeholder='{ "title": "…", "summary": "…", "changes": [ … ] }'
        />
      </label>
      {error && <div className="auth-error">{error}</div>}
      <div className="lp-actions">
        <button type="submit" className="fb-btn-primary" disabled={!text.trim() || busy}>
          {t("pr.pasteSubmit")}
        </button>
      </div>
    </form>
  );
}

/** Download the current content (with versions) for ChatGPT. */
function ExportButton() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await exportContent();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `taalstudio-inhoud-${data.exportedAt.slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button type="button" className="fb-btn-secondary pr-btn" onClick={run} disabled={busy}>
        <DownloadSimple aria-hidden="true" /> {busy ? t("common.loading") : t("pr.export")}
      </button>
      {error && <span className="auth-error">{error}</span>}
    </>
  );
}
