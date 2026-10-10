import { useState } from "react";
import Brand from "../components/Brand";
import { supabase } from "../lib/supabase";
import { useI18n } from "../i18n/context";
import { EnvelopeSimple } from "../icons";

/**
 * Magic-link login: enter an email, receive a link, click it, done.
 * The same email has a code too: typing it here logs in on this device, handy
 * when the link opens in another browser (a mail app on a phone).
 * New email addresses get an account automatically (role: leerling).
 */
export default function LoginPage({ invited = false }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState(null);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);

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

  // On success the auth listener takes over and shows the app.
  const handleCode = async (e) => {
    e.preventDefault();
    setChecking(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    if (error) {
      setError(t("login.codeWrong"));
      setChecking(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <Brand tagline />
        {invited && <p className="auth-invited">{t("invite.loginHint")}</p>}

        {status === "sent" ? (
          <div className="auth-sent">
            <p>
              <EnvelopeSimple /> {t("login.sent")} <strong>{email}</strong>.
            </p>
            <p className="dim">{t("login.sentHint")}</p>
            <form className="auth-code" onSubmit={handleCode}>
              <label className="fb-field">
                <span>{t("login.codeLabel")}</span>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={10}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                />
              </label>
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" className="fb-btn-primary auth-submit" disabled={checking || code.length < 6}>
                {checking ? t("login.codeChecking") : t("login.codeSubmit")}
              </button>
            </form>
            <button
              className="fb-link"
              onClick={() => {
                setStatus("idle");
                setCode("");
                setError(null);
              }}
            >
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
