/**
 * Links inside the app (e.g. "/lesprogramma/<lesson id>" in a lesson's uitleg).
 * <Markdown> opens them without leaving the page; a dialog can provide a
 * handler to save first or to open the step on the current leerpad instead.
 */
import { createContext } from "react";

export const InternalLinkContext = createContext(null);

/** "/lesprogramma/<id>" → "<id>", anything else → null. */
export const lessonIdFromHref = (href) => href.match(/^\/lesprogramma\/([^/?#]+)/)?.[1] ?? null;
