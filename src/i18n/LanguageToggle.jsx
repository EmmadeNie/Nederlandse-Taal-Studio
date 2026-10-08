import { useContext } from "react";
import { AuthContext } from "../auth/context";
import { useI18n } from "./context";
import { LANGUAGES } from "./messages";

/** NL | EN switch. Saves the choice to the profile when someone is logged in. */
export default function LanguageToggle() {
  const { lang, setLang, t } = useI18n();
  const auth = useContext(AuthContext);

  const choose = (next) => {
    if (next === lang) return;
    setLang(next);
    if (auth?.user) auth.saveLanguage(next);
  };

  return (
    <div className="lang-toggle" role="group" aria-label={t("lang.label")}>
      {LANGUAGES.map((l) => (
        <button key={l} aria-pressed={l === lang} onClick={() => choose(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
