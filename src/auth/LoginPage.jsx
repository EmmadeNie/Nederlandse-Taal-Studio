import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useI18n } from "../i18n/context";
import LanguageToggle from "../i18n/LanguageToggle";

/**
 * Magic-link login: enter an email, receive a link, click it, done.
 * New email addresses get an account automatically (role: leerling).
 */
export default function LoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      // Come back to the same page (keeps deep links working).
      options: { emailRedirectTo: window.location.href },
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <LanguageToggle />
        <h1>🇳🇱 NL Studio</h1>
        <p className="subtitle">Nederlandse Taal Studio</p>

        {status === "sent" ? (
          <div className="auth-sent">
            <p>
              ✉️ {t("login.sent")} <strong>{email}</strong>.
            </p>
            <p className="dim">{t("login.sentHint")}</p>
            <button className="fb-link" onClick={() => setStatus("idle")}>
              {t("login.otherEmail")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="fb-field">
              <span>{t("login.email")}</span>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.placeholder")}
              />
            </label>
            {error && <div className="auth-error">{error}</div>}
            <button
              type="submit"
              className="fb-btn-primary auth-submit"
              disabled={status === "sending" || !email.trim()}
            >
              {status === "sending" ? t("login.sending") : t("login.send")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
