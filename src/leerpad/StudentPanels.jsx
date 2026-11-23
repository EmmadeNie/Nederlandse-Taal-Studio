import { useState } from "react";
import { useI18n } from "../i18n/context";
import { Dialog } from "./shared";
import {
  createStudent,
  deletePendingStudent,
  inviteUrl,
  linkAccountToStudent,
  sendInviteMail,
  updatePendingStudent,
} from "./students";
import { EnvelopeSimple } from "../icons";
import "./students.css";

/**
 * Docent: prepare a new leerling (name, optional email). With an email the
 * invitation can go out by mail right away; onCreated(profile, mailError).
 */
export function AddStudentDialog({ onClose, onCreated }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mailNow, setMailNow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    let profile;
    try {
      profile = await createStudent(name.trim(), email.trim());
    } catch (err) {
      setError(t(err.message));
      setBusy(false);
      return;
    }
    let mailError = null;
    if (mailNow && profile.email) {
      try {
        await sendInviteMail(profile.id);
      } catch (err) {
        mailError = t(err.message);
      }
    }
    onCreated(profile, mailError);
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
        {email.trim() && (
          <label className="students-check">
            <input type="checkbox" checked={mailNow} onChange={(e) => setMailNow(e.target.checked)} />{" "}
            {t("students.mailNow")}
          </label>
        )}
        {error && <div className="auth-error">{error}</div>}
        <div className="lp-actions">
          <button type="submit" className="fb-btn-primary" disabled={busy || !name.trim()}>
            {busy && mailNow && email.trim() ? t("students.mailSending") : t("students.add")}
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
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(student.display_name || "");
  const [email, setEmail] = useState(student.email || "");
  const [linkTo, setLinkTo] = useState("");
  const [error, setError] = useState(null);
  const [mail, setMail] = useState(null); // null | "sending" | "sent"
  const link = student.invite_code ? inviteUrl(student.invite_code) : null;
  const sentOn = student.invite_sent_at
    ? new Date(student.invite_sent_at).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;

  const mailInvite = async () => {
    setError(null);
    setMail("sending");
    try {
      await sendInviteMail(student.id);
      setMail("sent");
      onChanged();
    } catch (err) {
      setMail(null);
      setError(t(err.message));
    }
  };

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

      {isDocent && student.email && link && (
        <div className="students-invite">
          <button
            className={sentOn ? "fb-btn-secondary" : "fb-btn-primary"}
            onClick={mailInvite}
            disabled={mail === "sending"}
          >
            <EnvelopeSimple aria-hidden="true" />{" "}
            {mail === "sending" ? t("students.mailSending") : t(sentOn ? "students.mailAgain" : "students.mailSend")}
          </button>
          {mail === "sent" ? (
            <strong>✓ {t("students.mailSent", { email: student.email })}</strong>
          ) : (
            <span className="dim">{sentOn ? t("students.mailSentOn", { date: sentOn }) : t("students.mailNotYet")}</span>
          )}
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
