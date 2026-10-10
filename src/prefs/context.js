import { createContext, useContext } from "react";

/**
 * Per-device preferences: theme ("dark" | "light") and feedback mode (shows the
 * feedback buttons on cards and "Feedback over de app"; off by default).
 */
export const PrefsContext = createContext(null);

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside <PrefsProvider>");
  return ctx;
}

export const THEME_KEY = "nts-theme";
export const FEEDBACK_KEY = "nts-feedback-mode";
