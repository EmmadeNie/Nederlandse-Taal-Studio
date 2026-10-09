/** Plain helpers shared by the lesprogramma and leerpad components. */

export const LEVELS = ["A0", "A1", "A2", "B1", "B2"];

/** "3 links" in the current language, or null for none. */
export const linkCount = (t, n) => (n ? t("board.links", { n }) : null);

export function matchesFilter({ title, level }, search, levelFilter) {
  if (search && !title.toLowerCase().includes(search.toLowerCase())) return false;
  if (levelFilter === "none") return !level;
  if (levelFilter && level !== levelFilter) return false;
  return true;
}

/** What a step shows: the lesson's content for a stap, its own content for a zijpad. */
export function stepContent(step) {
  if (step.lesson) {
    const l = step.lesson;
    return {
      title: l.title,
      level: l.level,
      categories: l.categories,
      explanation: l.explanation,
      links: l.links,
      attachments: l.attachments || [],
    };
  }
  return {
    title: step.title,
    level: step.level,
    categories: step.categories,
    explanation: step.explanation,
    links: [],
    attachments: [],
  };
}
