import { useI18n } from "../i18n/context";
import Markdown from "../components/Markdown";
import TopicLangToggle from "../components/TopicLangToggle";

/** Whether a lesson (its stepContent-like fields) has an English version. */
export const hasEnglishLesson = ({ titleEn, explanationEn }) => Boolean(titleEn?.trim() || explanationEn?.trim());

/**
 * The explanation of a lesson as a student reads it, with NL | EN when the
 * lesson has an English version. The language (`lang`, from useContentLang)
 * lives in the dialog, so the title at the top switches along with it.
 */
export default function LessonExplanation({ explanation, explanationEn, hasEn, lang, onLang, empty }) {
  const { t } = useI18n();
  const en = hasEn && lang === "en";
  const text = en ? explanationEn || "" : explanation || "";
  if (!text.trim() && !hasEn && !empty) return null;
  return (
    <div className="lp-section">
      <h4>
        {t("lp.explanation")} {hasEn && <TopicLangToggle lang={lang} onChange={onLang} />}
      </h4>
      <div lang={en ? "en" : "nl"}>{text.trim() ? <Markdown className="lp-explanation">{text}</Markdown> : empty}</div>
    </div>
  );
}
