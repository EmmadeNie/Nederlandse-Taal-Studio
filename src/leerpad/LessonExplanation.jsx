import { useI18n } from "../i18n/context";
import Markdown from "../components/Markdown";

/** Whether a lesson (its stepContent-like fields) has an English version. */
export const hasEnglishLesson = ({ titleEn, explanationEn }) => Boolean(titleEn?.trim() || explanationEn?.trim());

/**
 * The explanation of a lesson as a student reads it: in English when the app
 * is in English (the switch top right) and the lesson has an English version.
 */
export default function LessonExplanation({ explanation, explanationEn, hasEn, lang, empty }) {
  const { t } = useI18n();
  const en = hasEn && lang === "en";
  const text = en ? explanationEn || "" : explanation || "";
  if (!text.trim() && !hasEn && !empty) return null;
  return (
    <div className="lp-section">
      <h4>
        {t("lp.explanation")}
      </h4>
      <div lang={en ? "en" : "nl"}>{text.trim() ? <Markdown className="lp-explanation">{text}</Markdown> : empty}</div>
    </div>
  );
}
