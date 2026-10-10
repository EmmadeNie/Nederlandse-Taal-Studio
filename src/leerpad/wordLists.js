/**
 * Word lists on lessons: a recipe ({ set, theme, partOfSpeech, level, upTo }) over
 * the words in src/data, stored in lessons.word_list. Like exercises, the
 * list is computed, so new words with a matching theme appear by themselves.
 */
import { LEVELS, THEMES, getSet, queryWords, queryWordsUpToLevel, setItems } from "../data";

export { THEMES };
export const WORD_POS = ["noun", "verb", "adjective", "adverb", "numeral", "conjunction", "other"];


export const hasWordList = (spec) => Boolean(spec && (spec.set || spec.theme || spec.partOfSpeech || spec.level));

/** Words matching the recipe: a set in its own order, otherwise alphabetical. */
export function wordsForList(spec) {
  if (!hasWordList(spec)) return [];
  if (spec.set) {
    const set = getSet(spec.set);
    const lvl = LEVELS.indexOf(spec.level);
    return setItems(set?.type === "word" ? set : null)
      .filter((w) => !spec.theme || (w.themes || []).includes(spec.theme))
      .filter((w) => !spec.partOfSpeech || w.partOfSpeech === spec.partOfSpeech)
      .filter((w) => {
        if (!spec.level) return true;
        const idx = LEVELS.indexOf(w.introducedAtLevel);
        return spec.upTo ? idx <= lvl : idx === lvl;
      });
  }
  const filters = {
    themes: spec.theme ? [spec.theme] : undefined,
    partOfSpeech: spec.partOfSpeech || undefined,
  };
  const words = !spec.level
    ? queryWords(filters)
    : spec.upTo
      ? queryWordsUpToLevel(spec.level, filters)
      : queryWords({ ...filters, introducedAtLevel: spec.level });
  return [...words].sort((a, b) => a.nl.localeCompare(b.nl, "nl"));
}

/** "dagelijks-leven" → "dagelijks leven" */
export const themeLabel = (theme) => theme.replace(/-/g, " ");
