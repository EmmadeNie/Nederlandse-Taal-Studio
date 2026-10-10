import { useEffect, useState } from "react";
import { useI18n } from "../i18n/context";
import { loadContent } from "../data/load";

/** Loads the content from the database once, then shows the app. */
export default function ContentGate({ children }) {
  const { t } = useI18n();
  const [state, setState] = useState("loading"); // loading | ready | error
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadContent()
      .then(() => !cancelled && setState("ready"))
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "ready") return children;
  return (
    <div className="auth-screen">
      <div className="auth-card">
        {state === "loading" ? (
          <p className="dim">{t("content.loading")}</p>
        ) : (
          <>
            <p className="auth-error">{t("content.error")}</p>
            <p className="dim">{error}</p>
            <button className="fb-btn-secondary" onClick={() => window.location.reload()}>
              {t("content.retry")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
