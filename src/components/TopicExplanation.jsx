import { useState } from "react";
import { useI18n } from "../i18n/context";
import Markdown from "./Markdown";

/**
 * The explanation of a grammar topic. Folded, it shows the short version (just
 * enough to do the exercises) with "Lees de hele uitleg" to swap in the full
 * text and back. Without a short version: the full text, or, with
 * `foldWithoutShort` (in a lesson, where everything starts folded), the
 * summary with "Lees de uitleg".
 */
export default function TopicExplanation({ text, lang, className, foldWithoutShort = false }) {
  const { t } = useI18n();
  const [full, setFull] = useState(false);
  if (!text.short && !text.explanation) return null;
  const toggle = (e) => {
    e.stopPropagation(); // the topic card around it folds on a click
    setFull(!full);
  };
  const button = (label) => (
    <button type="button" className="fb-link topic-readmore" onClick={toggle} aria-expanded={full}>
      {label}
    </button>
  );

  if (!text.short) {
    if (!foldWithoutShort) {
      return (
        <div lang={lang}>
          <Markdown className={className}>{text.explanation}</Markdown>
        </div>
      );
    }
    return (
      <div lang={lang}>
        {full ? (
          <Markdown className={className}>{text.explanation}</Markdown>
        ) : (
          text.summary && <p className="topic-fold-summary">{text.summary}</p>
        )}
        {button(full ? t("lc.foldTopic") : t("lc.readTopic"))}
      </div>
    );
  }

  return (
    <div lang={lang}>
      <Markdown className={className}>{full ? text.explanation : text.short}</Markdown>
      {text.explanation && button(full ? t("lc.readShort") : t("lc.readFull"))}
    </div>
  );
}
