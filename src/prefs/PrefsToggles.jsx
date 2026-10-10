import { useI18n } from "../i18n/context";
import { ChatCircleDots, Moon, Sun } from "../icons";
import { usePrefs } from "./context";

/** Sun/moon button: switch between the dark and the light theme. */
export function ThemeToggle() {
  const { t } = useI18n();
  const { theme, setTheme } = usePrefs();
  const toLight = theme === "dark";
  const label = toLight ? t("prefs.toLight") : t("prefs.toDark");
  return (
    <button type="button" className="corner-btn" title={label} aria-label={label} onClick={() => setTheme(toLight ? "light" : "dark")}>
      {toLight ? <Sun /> : <Moon />}
    </button>
  );
}

/** Feedback mode on/off: shows or hides the feedback buttons. */
export function FeedbackModeToggle() {
  const { t } = useI18n();
  const { feedbackMode, setFeedbackMode } = usePrefs();
  const label = feedbackMode ? t("prefs.feedbackOn") : t("prefs.feedbackOff");
  return (
    <button
      type="button"
      className="corner-btn"
      title={label}
      aria-label={t("prefs.feedbackMode")}
      aria-pressed={feedbackMode}
      onClick={() => setFeedbackMode(!feedbackMode)}
    >
      <ChatCircleDots />
    </button>
  );
}
