/**
 * Experiment: text on a board card that shows in the other language (Dutch ↔
 * English) while the card is hovered. Without `alt` (or the same text) just `main`.
 */
export function HoverAlt({ main, alt }) {
  if (!alt || alt === main) return main;
  return (
    <>
      <span className="hover-main">{main}</span>
      <span className="hover-alt" aria-hidden="true">
        {alt}
      </span>
    </>
  );
}

/** The other UI language: what a hovered card switches to. */
export const otherLang = (lang) => (lang === "en" ? "nl" : "en");
