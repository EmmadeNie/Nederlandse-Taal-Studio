/**
 * Explanations (grammar topics, lessons, zijpaden) are stored as HTML written
 * by the rich editor. Older ones are Markdown; they are shown as before and
 * become HTML the first time someone edits them.
 *
 * Everything is sanitized before it is shown: only formatting survives
 * (headings, lists, tables, links, colours, callouts, example blocks).
 */
import DOMPurify from "dompurify";
import { marked } from "marked";

/** HTML from the editor starts with a tag; Markdown practically never does. */
export const isHtml = (text) => /^\s*<(p|h[1-6]|ul|ol|div|table|blockquote|hr|pre)[\s>]/i.test(text || "");

/** HTML for any stored explanation (Markdown is converted). */
export const toHtml = (text) => {
  if (!text || !text.trim()) return "";
  return isHtml(text) ? text : marked.parse(text, { gfm: true, breaks: true });
};

/** An editor document with nothing in it. */
export const isEmptyHtml = (html) => !html || html.replace(/<[^>]*>/g, "").trim() === "" && !/<(table|hr)/i.test(html);

const purify = DOMPurify();

// Links: other pages of the app stay in the tab (handled by <RichText>),
// everything else opens in a new tab without access to this page.
purify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    const href = node.getAttribute("href") || "";
    if (href.startsWith("/")) {
      node.removeAttribute("target");
      node.setAttribute("class", "md-internal-link");
    } else {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  }
  // Inline styles: only text and highlight colours.
  if (node.hasAttribute?.("style")) {
    const kept = (node.getAttribute("style") || "")
      .split(";")
      .map((rule) => rule.trim())
      .filter((rule) => /^(color|background-color)\s*:\s*(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i.test(rule))
      // "inherit" & co. would undo the readable text colour on a highlight.
      .filter((rule) => !/:\s*(inherit|initial|unset|currentcolor)$/i.test(rule));
    if (kept.length) node.setAttribute("style", kept.join("; "));
    else node.removeAttribute("style");
  }
});

/** Safe HTML for display. */
export const sanitize = (html) =>
  purify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "mark", "span", "a",
      "ul", "ol", "li", "blockquote", "hr", "code", "pre",
      "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col", "div",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "style", "colspan", "rowspan", "data-callout", "data-example", "data-color"],
    ALLOW_DATA_ATTR: false,
  });
