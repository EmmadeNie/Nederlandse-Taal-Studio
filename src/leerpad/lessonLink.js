import { pathFor } from "../routes";

/** Markdown link to a lesson: "[Perfectum](/lesprogramma/<id>)". */
export const lessonLinkMarkdown = (lesson) =>
  `[${lesson.title.replace(/([[\]\\])/g, "\\$1")}](${pathFor("lesprogramma", lesson.id)})`;

// Textareas the user has clicked or typed in: only there the cursor means something.
const touched = new WeakSet();

/** onFocus handler for a textarea that can get lesson links. */
export const rememberCursor = (e) => touched.add(e.target);

/**
 * Put `snippet` into a textarea's text at the cursor (or on a new line at the
 * end when the user hasn't been in the textarea yet) and put the cursor
 * after it. Returns the new text.
 */
export function insertAtCursor(textarea, text, snippet) {
  const useCursor = textarea && touched.has(textarea);
  const start = useCursor ? textarea.selectionStart : text.length;
  const end = useCursor ? textarea.selectionEnd : text.length;
  // At the end: as its own paragraph (Markdown needs a blank line for that).
  const gap = text.endsWith("\n\n") ? "" : text.endsWith("\n") ? "\n" : "\n\n";
  const piece = !useCursor && text.trim() ? gap + snippet : snippet;
  const next = text.slice(0, start) + piece + text.slice(end);
  if (textarea) {
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + piece.length, start + piece.length);
    });
  }
  return next;
}
