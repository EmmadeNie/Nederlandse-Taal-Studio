import { useContentLang } from "../components/useContentLang";
import { useI18n } from "../i18n/context";
import Markdown from "../components/Markdown";
import TopicLangToggle from "../components/TopicLangToggle";

/**
 * The explanation of a lesson as a student reads it, with NL | EN when the
 * lesson has an English version. Like grammar topics it starts in the app
 * language; in English the English title stands above the text.
 */
export default function LessonExplanation({ explanation, explanationEn, titleEn, empty }) {
  const { t } = useI18n();
  const [lang, setLang] = useContentLang();
  const hasEn = Boolean(explanationEn?.trim() || titleEn?.trim());
  const en = hasEn && lang === "en";
  const text = en ? explanationEn || "" : explanation || "";
  if (!text.trim() && !en && !empty) return null;
  return (
    <div className="lp-section">
      <h4>
        {t("lp.explanation")} {hasEn && <TopicLangToggle lang={lang} onChange={setLang} />}
      </h4>
      <div lang={en ? "en" : "nl"}>
        {en && titleEn && <p className="lp-title-en">{titleEn}</p>}
        {text.trim() ? <Markdown className="lp-explanation">{text}</Markdown> : empty}
      </div>
    </div>
  );
}
