import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth, ROLES } from "../auth/context";
import { useI18n } from "../i18n/context";
import { PLANS } from "../auth/plan";
import { EnvelopeSimple, Trash } from "../icons";
import { AddStudentDialog, PendingStudentPanel } from "../leerpad/StudentPanels";
import { Dialog } from "../leerpad/shared";
import { navigate } from "../hooks/useRoute";
import { useSetUrlParams, useUrlParams } from "../hooks/useUrlParams";
import { pathFor } from "../routes";

function formatDate(iso, locale) {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Docent-only: everyone in Taal Studio. Add and invite new students here (a
 * prepared student gets a learning path before their first login), and assign
 * roles and plans.
 * Role changes go through the set_user_role() database function, which
 * re-checks that the caller is a docent.
 */
// Roles that can check sentences anyway; others get it with the can_review tick.
const REVIEW_ROLES = ["nakijker", "docent", "reviewer"];

export default function UserManagement() {
  const { profile: me } = useAuth();
  const { t, locale } = useI18n();
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState(null);
  const [trialEnded, setTrialEnded] = useState(null); // student just moved Trial → Gratis: offer the e-mail
  const [mail, setMail] = useState(null); // null | "sending" | "sent" | error text
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(null); // { profile, mailed, mailError } after adding a student
  // The invite dialog of a student who hasn't logged in yet (?uitnodigen=<id>, so Leerpaden can link here).
  const { uitnodigen: inviting } = useUrlParams();
  const setParams = useSetUrlParams();
  const openInvite = (id) => setParams({ uitnodigen: id });
  const closeInvite = () => setParams({ uitnodigen: null });

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, email, display_name, role, can_review, created_at, plan, language, invite_code, invite_sent_at")
      .order("created_at");
    if (error) setError(error.message);
    else setProfiles(data);
    return data ?? [];
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (targetId, newRole) => {
    setError(null);
    const { error } = await supabase.rpc("set_user_role", {
      target_user: targetId,
      new_role: newRole,
    });
    if (error) setError(error.message);
    await load();
  };

  const changePlan = async (p, newPlan) => {
    setError(null);
    const { error } = await supabase.rpc("set_user_plan", { target_user: p.id, new_plan: newPlan });
    if (error) setError(error.message);
    else {
      setTrialEnded(p.plan === "trial" && newPlan === "gratis" ? p : null);
      setMail(null);
    }
    await load();
  };

  // The e-mail to a student whose trial ended: sent by the app (Taal Studio styling, in the
  // student's language), with the docent's own address to reply to.
  const sendTrialEndedMail = async (p) => {
    setMail("sending");
    const { data, error } = await supabase.functions.invoke("send-plan-mail", { body: { student: p.id } });
    if (error) {
      let text = error.message;
      try {
        text = (await error.context.json()).error || text;
      } catch {
        // no JSON body: keep the message
      }
      setMail(text);
    } else setMail(data?.sent || data?.dryRun ? "sent" : t("plan.mail.failed"));
  };

  const changeCanReview = async (targetId, allowed) => {
    setError(null);
    const { error } = await supabase.rpc("set_can_review", { target_user: targetId, allowed });
    if (error) setError(error.message);
    await load();
  };

  // Leerlingen only: their leerpad, profile and login go; feedback stays without a name.
  const removeStudent = async (p) => {
    const name = p.display_name || p.email;
    if (!window.confirm(t("users.confirmDelete", { name }))) return;
    setError(null);
    const { error } = await supabase.rpc("delete_student", { student: p.id });
    if (error) setError(error.message);
    await load();
  };

  const created = async (profile, mailError) => {
    setAdding(false);
    const rows = await load();
    const fresh = rows.find((p) => p.id === profile.id) || profile;
    setAdded({ profile: fresh, mailed: !!fresh.invite_sent_at, mailError });
  };

  // Accounts that could belong to a prepared student (they signed up with another email).
  const inviteStudent = profiles.find((p) => p.id === inviting && !p.user_id);
  const accounts = profiles.filter((p) => p.role === "leerling" && p.user_id && p.id !== inviting);
  const name = (p) => p.display_name || p.email;

  const counts = Object.fromEntries(
    ROLES.map((r) => [r, profiles.filter((p) => p.role === r).length])
  );

  return (
    <div>
      <div className="users-head">
        <h2>{t("nav.users")}</h2>
        <button type="button" className="fb-btn-primary" onClick={() => setAdding(true)}>
          {t("students.addButton")}
        </button>
      </div>
      <p className="result-count">
        {t("users.count", { n: profiles.length })} ·{" "}
        {ROLES.map((r) => `${counts[r]} ${t(`role.${r}`).toLowerCase()}`).join(" · ")}
      </p>
      <p className="dim users-hint">{t("users.hint")}</p>

      {error && <div className="auth-error">{error}</div>}
      {added && (
        <div className="plan-mail">
          {added.mailError ? (
            <span className="ie-error">{t("students.mailCreatedFailed", { name: name(added.profile), error: added.mailError })}</span>
          ) : (
            <span>{t(added.mailed ? "users.addedMailed" : "users.added", { name: name(added.profile) })}</span>
          )}
          {!added.mailed && (
            <button type="button" className="fb-btn-secondary" onClick={() => openInvite(added.profile.id)}>
              <EnvelopeSimple aria-hidden="true" /> {t("users.invite")}
            </button>
          )}
          <button type="button" className="fb-btn-primary" onClick={() => navigate(pathFor("leerpaden", added.profile.id))}>
            {t("users.prepareBoard")}
          </button>
          <button type="button" className="fb-link" onClick={() => setAdded(null)}>
            {t("common.close")}
          </button>
        </div>
      )}
      {trialEnded && (
        <div className="plan-mail">
          <span>{t("plan.mail.done", { name: trialEnded.display_name || trialEnded.email })}</span>
          {trialEnded.email && mail === null && (
            <button type="button" className="fb-btn-primary" onClick={() => sendTrialEndedMail(trialEnded)}>
              {t("plan.mail.send")}
            </button>
          )}
          {mail === "sending" && <span className="dim">{t("plan.mail.sending")}</span>}
          {mail === "sent" && <strong>✓ {t("plan.mail.sent", { email: trialEnded.email })}</strong>}
          {mail && mail !== "sending" && mail !== "sent" && <span className="ie-error">{mail}</span>}
          <button
            type="button"
            className="fb-link"
            onClick={() => {
              setTrialEnded(null);
              setMail(null);
            }}
          >
            {t("common.close")}
          </button>
        </div>
      )}

      <table className="users-table">
        <thead>
          <tr>
            <th>{t("users.name")}</th>
            <th>{t("users.email")}</th>
            <th>{t("users.since")}</th>
            <th>{t("users.role")}</th>
            <th>{t("users.canReview")}</th>
            <th>{t("users.plan")}</th>
            <th aria-label={t("users.actions")} />
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id}>
              <td>
                {p.display_name || <span className="dim">—</span>}
                {!p.user_id && <span className="tag pending-tag">{t("users.pending")}</span>}
              </td>
              <td>{p.email || <span className="dim">—</span>}</td>
              <td className="dim">{formatDate(p.created_at, locale)}</td>
              <td>
                {p.id === me.id ? (
                  <span className="tag">{t(`role.${p.role}`)} {t("users.you")}</span>
                ) : (
                  <select
                    value={p.role}
                    onChange={(e) => changeRole(p.id, e.target.value)}
                    aria-label={t("users.roleOf", { name: p.display_name || p.email })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {t(`role.${r}`)}
                      </option>
                    ))}
                  </select>
                )}
              </td>
              <td>
                {REVIEW_ROLES.includes(p.role) ? (
                  <span className="dim" title={t("users.canReviewByRole")}>✓</span>
                ) : (
                  <input
                    type="checkbox"
                    checked={!!p.can_review}
                    onChange={(e) => changeCanReview(p.id, e.target.checked)}
                    title={t("users.canReviewHint")}
                    aria-label={t("users.canReviewOf", { name: p.display_name || p.email })}
                  />
                )}
              </td>
              <td>
                {/* Subscriptions are for leerlingen; staff always have everything. */}
                {p.role === "leerling" ? (
                  <select
                    value={p.plan}
                    onChange={(e) => changePlan(p, e.target.value)}
                    aria-label={t("users.planOf", { name: p.display_name || p.email })}
                  >
                    {PLANS.map((plan) => (
                      <option key={plan} value={plan}>
                        {t(`plan.${plan}`)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="dim">—</span>
                )}
              </td>
              <td className="users-actions">
                {!p.user_id && (
                  <button
                    type="button"
                    className="fb-btn-secondary users-invite"
                    aria-label={t("users.inviteAria", { name: name(p) })}
                    onClick={() => openInvite(p.id)}
                  >
                    <EnvelopeSimple aria-hidden="true" /> {t("users.invite")}
                  </button>
                )}
                {p.role === "leerling" && p.id !== me.id && (
                  <button
                    type="button"
                    className="board-icon-btn users-delete"
                    title={t("users.delete")}
                    aria-label={t("users.deleteAria", { name: p.display_name || p.email })}
                    onClick={() => removeStudent(p)}
                  >
                    <Trash />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {adding && <AddStudentDialog onClose={() => setAdding(false)} onCreated={created} />}
      {inviteStudent && (
        <Dialog title={t("lpd.manageTitle", { name: name(inviteStudent) })} onClose={closeInvite} wide>
          <PendingStudentPanel
            key={inviteStudent.id}
            student={inviteStudent}
            accounts={accounts}
            isDocent
            onChanged={load}
            onDeleted={async () => {
              closeInvite();
              await load();
            }}
          />
        </Dialog>
      )}
    </div>
  );
}
