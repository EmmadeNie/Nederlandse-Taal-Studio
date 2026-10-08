import { useState } from "react";
import { useAuth } from "./context";
import { useI18n } from "../i18n/context";

/** Shown once after first login, so feedback has a recognizable author. */
export default function NameSetup() {
  const { profile, updateDisplayName, signOut } = useAuth();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateDisplayName(name);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1>{t("name.welcome")}</h1>
        <p className="subtitle">{t("name.signedInAs", { email: profile?.email })}</p>
        <form onSubmit={handleSubmit}>
          <label className="fb-field">
            <span>{t("name.question")}</span>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("name.placeholder")}
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button
            type="submit"
            className="fb-btn-primary auth-submit"
            disabled={saving || !name.trim()}
          >
            {t("name.continue")}
          </button>
        </form>
        <button className="fb-link" onClick={signOut}>
          {t("app.signOut")}
        </button>
      </div>
    </div>
  );
}
