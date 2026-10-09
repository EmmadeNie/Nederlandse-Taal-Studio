/**
 * Word lists on lessons: a recipe ({ theme, partOfSpeech, level, upTo }) over
 * the word data in src/data, stored in lessons.word_list. Like exercises, the
 * list is computed, so new words with a matching theme appear by themselves.
 */
import { THEMES, queryWords, queryWordsUpToLevel } from "../data";

export { THEMES };
export const WORD_POS = ["noun", "verb", "adjective", "adverb", "numeral", "conjunction", "other"];

export const hasWordList = (spec) => Boolean(spec && (spec.theme || spec.partOfSpeech || spec.level));

/** Words matching the recipe, alphabetical. */
export function wordsForList(spec) {
  if (!hasWordList(spec)) return [];
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
