import { useState } from "react";
import { useI18n } from "../i18n/context";
import Markdown from "./Markdown";

/**
 * The explanation of a grammar topic: the short version (just enough to do the
 * exercises) when there is one, with "Lees meer" to swap in the full text and
 * back. Without a short version, the full text as before.
 */
export default function TopicExplanation({ text, lang, className }) {
  const { t } = useI18n();
  const [full, setFull] = useState(false);
  if (!text.short && !text.explanation) return null;
  const showFull = full || !text.short;
  const toggle = (e) => {
    e.stopPropagation(); // the topic card around it folds on a click
    setFull(!full);
  };
  return (
    <div lang={lang}>
      <Markdown className={className}>{showFull ? text.explanation : text.short}</Markdown>
      {text.short && text.explanation && (
        <button type="button" className="fb-link topic-readmore" onClick={toggle} aria-expanded={full}>
          {full ? t("topics.short") : t("topics.more")}
        </button>
      )}
    </div>
  );
}
