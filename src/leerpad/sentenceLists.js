/**
 * Sentence lists on lessons: a recipe ({ set } or { theme, grammarTag, level, upTo })
 * over the sentence bank in src/data, stored in lessons.sentence_list.
 * A set is a named group of sentences that belong together (a dialogue such as
 * "mijn-eerste-ontmoetingsgesprek"); its sentences keep the order of the data file.
 */
import { GRAMMAR_TAGS, LEVELS, sentences } from "../data";

export { GRAMMAR_TAGS };

/** The sets used in the sentence bank, in order of first appearance. */
export const SENTENCE_SETS = [...new Set(sentences.flatMap((s) => s.sets || []))];

export const hasSentenceList = (spec) =>
  Boolean(spec && (spec.set || spec.theme || spec.grammarTag || spec.level));

/** Sentences matching the recipe. */
export function sentencesForList(spec) {
  if (!hasSentenceList(spec)) return [];
  const max = spec.level ? LEVELS.indexOf(spec.level) : -1;
  return sentences.filter((s) => {
    if (spec.set && !(s.sets || []).includes(spec.set)) return false;
    if (spec.theme && !(s.themes || []).includes(spec.theme)) return false;
    if (spec.grammarTag && !(s.grammarTags || []).includes(spec.grammarTag)) return false;
    if (spec.level) {
      const idx = LEVELS.indexOf(s.introducedAtLevel);
      if (spec.upTo ? idx > max : idx !== max) return false;
    }
    return true;
  });
}

/** "mijn-eerste-ontmoetingsgesprek" → "mijn eerste ontmoetingsgesprek" */
export const slugLabel = (slug) => slug.replace(/-/g, " ");
