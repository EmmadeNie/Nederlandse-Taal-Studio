/**
 * Word lists on lessons: a recipe ({ theme, partOfSpeech, level, upTo }) over
 * the word data in src/data, stored in lessons.word_list. Like exercises, the
 * list is computed, so new words with a matching theme appear by themselves.
 */
import { LEVELS, THEMES, queryWords, queryWordsUpToLevel, words as allWords } from "../data";

export { THEMES };
export const WORD_POS = ["noun", "verb", "adjective", "adverb", "numeral", "conjunction", "other"];

/** The word sets used in the word data (e.g. the verbs of an exercise), in order of first appearance. */
export const WORD_SETS = [...new Set(allWords.flatMap((w) => w.sets || []))];

export const hasWordList = (spec) => Boolean(spec && (spec.set || spec.theme || spec.partOfSpeech || spec.level));

/** Words matching the recipe, alphabetical. */
export function wordsForList(spec) {
  if (!hasWordList(spec)) return [];
  if (spec.set) {
    const lvl = LEVELS.indexOf(spec.level);
    return allWords
      .filter((w) => (w.sets || []).includes(spec.set))
      .filter((w) => !spec.theme || (w.themes || []).includes(spec.theme))
      .filter((w) => !spec.partOfSpeech || w.partOfSpeech === spec.partOfSpeech)
      .filter((w) => {
        if (!spec.level) return true;
        const idx = LEVELS.indexOf(w.introducedAtLevel);
        return spec.upTo ? idx <= lvl : idx === lvl;
      })
      .sort((a, b) => a.nl.localeCompare(b.nl, "nl"));
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
