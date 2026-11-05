import { useI18n } from "../i18n/context";
import Markdown from "../components/Markdown";
import { knownTopics } from "./grammarTopics";
import { hasEnglish } from "../components/topicLang";

/**
 * Whether a lesson has something in English: its own title or explanation, or
 * one of its grammar topics. Then the lesson offers NL | EN.
 */
export const hasEnglishLesson = ({ titleEn, explanationEn, topicIds = [] }) =>
  Boolean(titleEn?.trim() || explanationEn?.trim() || knownTopics(topicIds).some(hasEnglish));

/**
 * The explanation of a lesson as a student reads it: in English when the
 * lesson is shown in English (NL | EN in the lesson, starting from the switch
 * top right) and it has an English explanation.
 */
export default function LessonExplanation({ explanation, explanationEn, hasEn, lang }) {
  const { t } = useI18n();
  // English when chosen and there is an English text; otherwise the Dutch one.
  const en = hasEn && lang === "en" && Boolean(explanationEn?.trim());
  const text = en ? explanationEn : explanation || "";
  if (!text.trim()) return null; // no explanation: no heading either
  return (
    <div className="lp-section">
      <h4>
        {t("lp.explanation")}
      </h4>
      <div lang={en ? "en" : "nl"}><Markdown className="lp-explanation">{text}</Markdown></div>
    </div>
  );
}
