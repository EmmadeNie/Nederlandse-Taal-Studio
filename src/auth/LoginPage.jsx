import { useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Magic-link login: enter an email, receive a link, click it, done.
 * New email addresses get an account automatically (role: leerling).
 */
export default function LoginPage() {
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
        <h1>🇳🇱 NL Studio</h1>
        <p className="subtitle">Nederlandse Taal Studio</p>

        {status === "sent" ? (
          <div className="auth-sent">
            <p>
              ✉️ We hebben een inloglink gestuurd naar <strong>{email}</strong>.
            </p>
            <p className="dim">Open de e-mail en klik op de link om in te loggen.</p>
            <button className="fb-link" onClick={() => setStatus("idle")}>
              Ander e-mailadres gebruiken
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="fb-field">
              <span>E-mailadres</span>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="naam@voorbeeld.nl"
              />
            </label>
            {error && <div className="auth-error">{error}</div>}
            <button
              type="submit"
              className="fb-btn-primary auth-submit"
              disabled={status === "sending" || !email.trim()}
            >
              {status === "sending" ? "Versturen…" : "Stuur inloglink"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
