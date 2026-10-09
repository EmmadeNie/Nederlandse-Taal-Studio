import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth, ROLES } from "../auth/context";
import { useI18n } from "../i18n/context";

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
export default function UserManagement() {
  const { profile: me } = useAuth();
  const { t, locale } = useI18n();
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, email, display_name, role, created_at")
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

      <table className="users-table">
        <thead>
          <tr>
            <th>{t("users.name")}</th>
            <th>{t("users.email")}</th>
            <th>{t("users.since")}</th>
            <th>{t("users.role")}</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
