import { useRef, useState } from "react";
import Brand from "../components/Brand";
import { supabase } from "../lib/supabase";
import { useI18n } from "../i18n/context";
import { EnvelopeSimple } from "../icons";
import DemoVideo from "./DemoVideo";

/**
 * Magic-link login: enter an email, receive a link, click it, done.
 * The same email has a code too: typing it here logs in on this device, handy
 * when the link opens in another browser (a mail app on a phone).
 * New email addresses get an account automatically (role: leerling).
 */
export default function LoginPage({ invited = false }) {
  const { t, lang } = useI18n();
  // The public pages in the page's language.
  const pages =
    lang === "en"
      ? { lessons: "/en/dutch-lessons/", plans: "/en/dutch-lessons/#plans", reviews: "/en/reviews/" }
      : { lessons: "/nederlandse-les/", plans: "/nederlandse-les/#abonnementen", reviews: "/reviews/" };
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState(null);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  // On a phone the form starts folded behind a button, so the video and the
  // footer fit on the screen; opened, it moves above the video.
  const [open, setOpen] = useState(invited);
  const card = useRef(null);
  const openForm = () => {
    setOpen(true);
    requestAnimationFrame(() => {
      // The form now sits at the top of the page (above the video).
      window.scrollTo({ top: 0, behavior: "smooth" });
      card.current?.querySelector("input")?.focus({ preventScroll: true });
    });
  };

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
    <div className={`auth-screen has-demo ${open || status !== "idle" ? "is-open" : ""}`}>
      <DemoVideo />
      <button type="button" className="fb-btn-primary auth-open" onClick={openForm}>
        {t("login.open")}
      </button>
      <div className="auth-card" ref={card}>
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
      <footer className="auth-footer">
        <nav aria-label={t("login.footerNav")}>
          <a href={pages.lessons}>{t("login.lessonsLink")}</a>
          <a href={pages.plans}>{t("login.plansLink")}</a>
          <a href={pages.reviews}>{t("login.reviewsLink")}</a>
        </nav>
        <p>{t("login.more")}</p>
      </footer>
    </div>
  );
}
