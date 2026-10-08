import { useCallback, useEffect, useMemo, useState } from "react";
import { I18nContext, LOCALES, translate } from "./context";
import { LANGUAGES } from "./messages";

const STORAGE_KEY = "nts-lang";

/** Remembered choice, else the browser language (Dutch browsers get NL, everyone else EN). */
function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES.includes(saved)) return saved;
  } catch {
    // storage unavailable: fall through to the browser language
  }
  return navigator.language?.toLowerCase().startsWith("nl") ? "nl" : "en";
}

/**
 * Holds the UI language. Logged-in users also have it stored in their
 * profile; AuthProvider syncs that both ways.
 */
export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  const setLang = useCallback((next) => {
    if (!LANGUAGES.includes(next)) return;
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // not remembered in this browser; the profile still keeps it
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      locale: LOCALES[lang],
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang, setLang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
