import { useI18n } from "../i18n/context";

/**
 * NL | EN switch in a lesson: the whole lesson (title, explanation, grammar)
 * in the other language. Starts in the app language (see useContentLang);
 * switching here is for this lesson only. Clicks stay inside.
 */
export default function TopicLangToggle({ lang, onChange }) {
  const { t } = useI18n();
  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- only stops clicks reaching the box; the buttons handle keys
    <span className="topic-lang" role="group" aria-label={t("topicLang.label")} onClick={stop}>
      {["nl", "en"].map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={(e) => {
            stop(e);
            onChange(l);
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </span>
  );
}
