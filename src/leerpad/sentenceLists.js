/**
 * Sentence lists on lessons: a recipe ({ set } or { theme, grammarTag, level, upTo })
 * over the sentence bank in src/data, stored in lessons.sentence_list.
 * A set is a named group of sentences that belong together (a dialogue such as
 * "mijn-eerste-ontmoetingsgesprek", a row in the sets table); its sentences keep the set's order.
 */
import { GRAMMAR_TAGS, LEVELS, getSet, sentences, setItems } from "../data";
import { toLists, unique } from "./wordLists";

export { GRAMMAR_TAGS };


export const hasSentenceList = (spec) =>
  Boolean(spec && (spec.set || spec.theme || spec.grammarTag || spec.level));

/** Lowest level first; within a level the list keeps its order (a dialogue stays in order). */
const byLevel = (list) => {
  const rank = (s) => {
    const i = LEVELS.indexOf(s.introducedAtLevel);
    return i === -1 ? LEVELS.length : i;
  };
  return [...list].sort((a, b) => rank(a) - rank(b));
};

/** Sentences matching the recipe, A0 first. */
export function sentencesForList(spec) {
  if (!hasSentenceList(spec)) return [];
  const max = spec.level ? LEVELS.indexOf(spec.level) : -1;
  let pool = sentences;
  if (spec.set) {
    const set = getSet(spec.set);
    pool = setItems(set?.type === "sentence" ? set : null);
  }
  return byLevel(pool).filter((s) => {
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

/** All sentences of a lesson's sentence lists, each once. */
export const sentencesForLists = (value) => unique(toLists(value).flatMap(sentencesForList));
