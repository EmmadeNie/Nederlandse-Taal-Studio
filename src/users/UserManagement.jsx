import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth, ROLE_LABELS } from "../auth/context";

const ROLES = Object.keys(ROLE_LABELS);

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("nl-NL", {
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
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, role, created_at")
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
      <h2>Gebruikers</h2>
      <p className="result-count">
        {profiles.length} gebruikers ·{" "}
        {ROLES.map((r) => `${counts[r]} ${ROLE_LABELS[r].toLowerCase()}`).join(" · ")}
      </p>
      <p className="dim users-hint">
        Iedereen kan inloggen met een e-mailadres en wordt dan automatisch
        leerling. Maak hier iemand reviewer of docent.
      </p>

      {error && <div className="auth-error">{error}</div>}

      <table className="users-table">
        <thead>
          <tr>
            <th>Naam</th>
            <th>E-mail</th>
            <th>Sinds</th>
            <th>Rol</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id}>
              <td>{p.display_name || <span className="dim">—</span>}</td>
              <td>{p.email}</td>
              <td className="dim">{formatDate(p.created_at)}</td>
              <td>
                {p.id === user.id ? (
                  <span className="tag">{ROLE_LABELS[p.role]} (jij)</span>
                ) : (
                  <select
                    value={p.role}
                    onChange={(e) => changeRole(p.id, e.target.value)}
                    aria-label={`Rol van ${p.display_name || p.email}`}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
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
