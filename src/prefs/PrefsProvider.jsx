import { useEffect, useMemo, useState } from "react";
import { FEEDBACK_KEY, PrefsContext, THEME_KEY } from "./context";

const read = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the choice just isn't remembered.
  }
};

export function PrefsProvider({ children }) {
  const [theme, setThemeState] = useState(() => (read(THEME_KEY, "dark") === "light" ? "light" : "dark"));
  const [feedbackMode, setFeedbackModeState] = useState(() => read(FEEDBACK_KEY, "off") === "on");

  // index.html sets the theme before the first paint; keep it in sync after that.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (next) => {
        write(THEME_KEY, next);
        setThemeState(next);
      },
      feedbackMode,
      setFeedbackMode: (on) => {
        write(FEEDBACK_KEY, on ? "on" : "off");
        setFeedbackModeState(on);
        // Turning it on: the feedback buttons pop once (see .feedback-pop in App.css).
        if (on) {
          const root = document.documentElement;
          root.classList.remove("feedback-pop");
          requestAnimationFrame(() => root.classList.add("feedback-pop"));
          setTimeout(() => root.classList.remove("feedback-pop"), 1400);
        }
      },
    }),
    [theme, feedbackMode]
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}
