import { useContext, useMemo } from "react";
import { navigate } from "../hooks/useRoute";
import { useI18n } from "../i18n/context";
import { InternalLinkContext } from "./internalLinks";
import { sanitize, toHtml } from "../editor/richText";
import { playVideoCard, withVideoCards } from "../editor/videoCards";
import "../editor/rich.css";

/**
 * Shows an explanation: HTML from the rich editor, or older Markdown (GitHub
 * flavoured, converted). Always sanitized, see src/editor/richText.js.
 * Links to other pages of the app ("/lesprogramma/…") open in place;
 * other links open in a new tab.
 */
export default function Markdown({ children, className }) {
  const { lang, t } = useI18n();
  const handle = useContext(InternalLinkContext);
  const playLabel = t("video.play");
  const html = useMemo(
    () => withVideoCards(sanitize(toHtml(children || "")), { playLabel }),
    [children, playLabel]
  );
  if (!html) return null;

  const onClick = (e) => {
    if (playVideoCard(e.target)) {
      e.preventDefault();
      e.stopPropagation(); // don't fold the box it sits in
      return;
    }
    const a = e.target.closest?.("a");
    const href = a?.getAttribute("href") || "";
    if (!href.startsWith("/") || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (handle) handle(href);
    else navigate(href);
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- clicks on the links inside; links are keyboard-reachable themselves
    <div className={`rich ${className || ""}`} data-lang={lang} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
