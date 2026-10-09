import { useEffect, useRef, useState } from "react";
import { useAuth } from "./context";
import { useI18n } from "../i18n/context";
import { navigate } from "../hooks/useRoute";
import { claimInvite } from "../leerpad/students";

/**
 * Shown after logging in via /uitnodiging/<code>: links this account to the
 * leerling the docent prepared, then opens their leerpad.
 */
export default function InviteClaim({ code }) {
  const { reloadProfile } = useAuth();
  const { t } = useI18n();
  const [error, setError] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice in development; claim only once.
    if (started.current) return;
    started.current = true;
    claimInvite(code)
      .then(async () => {
        await reloadProfile();
        navigate("/leerpad", { replace: true });
      })
      .catch((e) => setError(e.message));
  }, [code, reloadProfile]);

  return (
    <div className="auth-screen">
      <div className="auth-card">
        {error ? (
          <>
            <p className="auth-error">{t(error)}</p>
            <button className="fb-link" onClick={() => navigate("/", { replace: true })}>
              {t("invite.continue")}
            </button>
          </>
        ) : (
          <p className="dim">{t("invite.linking")}</p>
        )}
      </div>
    </div>
  );
}
