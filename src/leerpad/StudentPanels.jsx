import { useState } from "react";
import { useI18n } from "../i18n/context";
import { Dialog } from "./shared";
import {
  createStudent,
  deletePendingStudent,
  inviteUrl,
  linkAccountToStudent,
  updatePendingStudent,
} from "./students";
import "./students.css";

/** Docent: prepare a new leerling (name, optional email). */
export function AddStudentDialog({ onClose, onCreated }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      onCreated(await createStudent(name.trim(), email.trim()));
    } catch (err) {
      setError(t(err.message));
      setBusy(false);
    }
  };

  return (
    <Dialog title={t("students.addTitle")} onClose={onClose}>
      <form onSubmit={submit} className="students-form">
        <p className="dim students-hint">{t("students.addHint")}</p>
        <label className="fb-field">
          <span>{t("students.name")}</span>
          <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="fb-field">
          <span>{t("students.emailOptional")}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("login.placeholder")}
          />
        </label>
        {error && <div className="auth-error">{error}</div>}
        <div className="lp-actions">
          <button type="submit" className="fb-btn-primary" disabled={busy || !name.trim()}>
            {t("students.add")}
          </button>
          <button type="button" className="fb-btn-secondary" onClick={onClose}>
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

/**
 * For a leerling who hasn't logged in yet: how they get in (email or invite
 * link), and the docent's tools: edit, link an existing account, delete.
 */
export function PendingStudentPanel({ student, accounts, isDocent, onChanged, onDeleted }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(student.display_name || "");
  const [email, setEmail] = useState(student.email || "");
  const [linkTo, setLinkTo] = useState("");
  const [error, setError] = useState(null);
  const link = student.invite_code ? inviteUrl(student.invite_code) : null;

  const run = async (fn) => {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(t(err.message));
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // The link is shown as selectable text; copying by hand still works.
    }
  };

  return (
    <div className="students-pending">
      <div className="students-pending-head">
        <span className="tag pending-tag">{t("users.pending")}</span>
        <span className="dim">
          {student.email
            ? t("students.viaEmail", { email: student.email })
            : t("students.viaLinkOnly")}
        </span>
      </div>

      {link && (
        <div className="students-invite">
          <span className="dim">{t("students.inviteLink")}</span>
          <code>{link}</code>
          <button className="fb-btn-secondary" onClick={copy}>
            {copied ? t("copy.done") : t("students.copyLink")}
          </button>
        </div>
      )}

      {isDocent && (
        <div className="students-tools">
          {editing ? (
            <div className="lp-row">
              <input value={name} onChange={(e) => setName(e.target.value)} aria-label={t("students.name")} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("students.emailOptional")}
                aria-label={t("students.emailOptional")}
              />
              <button
                className="fb-btn-primary"
                onClick={() =>
                  run(async () => {
                    await updatePendingStudent(student.id, name, email);
                    setEditing(false);
                    onChanged();
                  })
                }
              >
                {t("common.save")}
              </button>
              <button className="fb-btn-secondary" onClick={() => setEditing(false)}>
                {t("common.cancel")}
              </button>
            </div>
          ) : (
            <button className="fb-link" onClick={() => setEditing(true)}>
              {t("students.edit")}
            </button>
          )}

          {accounts.length > 0 && (
            <div className="lp-row">
              <select value={linkTo} onChange={(e) => setLinkTo(e.target.value)} aria-label={t("students.linkLabel")}>
                <option value="">{t("students.linkLabel")}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.display_name || a.email} {a.email && a.display_name ? `(${a.email})` : ""}
                  </option>
                ))}
              </select>
              <button
                className="fb-btn-secondary"
                disabled={!linkTo}
                onClick={() =>
                  run(async () => {
                    const account = accounts.find((a) => a.id === linkTo);
                    if (!window.confirm(t("students.linkConfirm", { account: account.display_name || account.email, name: student.display_name }))) return;
                    await linkAccountToStudent(student.id, linkTo);
                    onChanged();
                  })
                }
              >
                {t("students.link")}
              </button>
            </div>
          )}

          <button
            className="lp-danger"
            onClick={() =>
              run(async () => {
                if (!window.confirm(t("students.deleteConfirm", { name: student.display_name }))) return;
                await deletePendingStudent(student.id);
                onDeleted();
              })
            }
          >
            {t("students.delete")}
          </button>
        </div>
      )}
      {error && <div className="auth-error">{error}</div>}
    </div>
  );
}
