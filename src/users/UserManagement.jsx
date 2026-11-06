import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth, ROLES } from "../auth/context";
import { translate, useI18n } from "../i18n/context";
import { PLANS } from "../auth/plan";
import { Trash } from "../icons";

function formatDate(iso, locale) {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Docent-only: list everyone who has logged in and assign roles.
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

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, email, display_name, role, can_review, created_at, plan, language")
      .order("created_at");
    if (error) setError(error.message);
    else setProfiles(data);
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
    else setTrialEnded(p.plan === "trial" && newPlan === "gratis" ? p : null);
    await load();
  };

  // The e-mail to a student whose trial ended, in their language, opened in the docent's mail app.
  const trialEndedMail = (p) => {
    const lang = p.language === "en" ? "en" : "nl";
    const vars = { name: p.display_name || "", docent: me.display_name || "" };
    const subject = translate(lang, "plan.mail.subject", vars);
    const body = translate(lang, "plan.mail.body", vars);
    return `mailto:${encodeURIComponent(p.email || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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

  const counts = Object.fromEntries(
    ROLES.map((r) => [r, profiles.filter((p) => p.role === r).length])
  );

  return (
    <div>
      <h2>{t("nav.users")}</h2>
      <p className="result-count">
        {t("users.count", { n: profiles.length })} ·{" "}
        {ROLES.map((r) => `${counts[r]} ${t(`role.${r}`).toLowerCase()}`).join(" · ")}
      </p>
      <p className="dim users-hint">{t("users.hint")}</p>

      {error && <div className="auth-error">{error}</div>}
      {trialEnded && (
        <div className="plan-mail">
          <span>{t("plan.mail.done", { name: trialEnded.display_name || trialEnded.email })}</span>
          {trialEnded.email && (
            <a className="fb-btn-primary" href={trialEndedMail(trialEnded)} onClick={() => setTrialEnded(null)}>
              {t("plan.mail.send")}
            </a>
          )}
          <button type="button" className="fb-link" onClick={() => setTrialEnded(null)}>
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
    </div>
  );
}
