import { useState } from "react";
import { useAuth } from "./context";

/** Shown once after first login, so feedback has a recognizable author. */
export default function NameSetup() {
  const { profile, updateDisplayName, signOut } = useAuth();
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
        <h1>Welkom! 👋</h1>
        <p className="subtitle">Ingelogd als {profile?.email}</p>
        <form onSubmit={handleSubmit}>
          <label className="fb-field">
            <span>Hoe mogen we je noemen?</span>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Je naam"
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button
            type="submit"
            className="fb-btn-primary auth-submit"
            disabled={saving || !name.trim()}
          >
            Verder
          </button>
        </form>
        <button className="fb-link" onClick={signOut}>
          Uitloggen
        </button>
      </div>
    </div>
  );
}
