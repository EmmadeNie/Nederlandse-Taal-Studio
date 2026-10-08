import { createContext, useContext } from "react";
import { messages } from "./messages";

export const I18nContext = createContext(null);

/** Locale for dates and numbers per UI language. */
export const LOCALES = { nl: "nl-NL", en: "en-GB" };

/** Look up a UI text; unknown keys (e.g. server errors) are returned as-is. */
export function translate(lang, key, vars = {}) {
  const value = messages[lang]?.[key] ?? messages.nl[key];
  if (value === undefined) return key;
  if (typeof value === "function") return value(vars);
  return value.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}

/** { lang, setLang, t, locale } */
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
