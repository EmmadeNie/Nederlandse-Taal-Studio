import wordsCore from "./words.json";
import wordsThema from "./words-thema.json";
import wordsVerbs from "./words-verbs.json";
import sentences from "./sentences.json";
import topics from "./topics.json";
import exercises from "./exercises.json";
import { LEVELS, THEMES, GRAMMAR_TAGS, TAGS } from "./schema.js";

// Merge all word lists into one, de-duping by id
const allWordsRaw = [...wordsCore, ...wordsThema, ...wordsVerbs];
const wordMap = new Map();
allWordsRaw.forEach((w) => {
  if (!wordMap.has(w.id)) wordMap.set(w.id, w);
});
export const words = Array.from(wordMap.values());

export { sentences, topics, exercises, LEVELS, THEMES, GRAMMAR_TAGS, TAGS };

// ----- Query helpers -----

/**
 * Filter words by criteria.
 * All filters are optional; unset filters match everything.
 */
export function queryWords({
  themes,
  tags,
  introducedAtLevel,
  partOfSpeech,
  search,
} = {}) {
  return words.filter((w) => {
    if (themes?.length && !themes.some((t) => w.themes?.includes(t)))
      return false;
    if (tags?.length && !tags.some((t) => w.tags?.includes(t))) return false;
    if (introducedAtLevel && w.introducedAtLevel !== introducedAtLevel)
      return false;
    if (partOfSpeech && w.partOfSpeech !== partOfSpeech) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        w.nl.toLowerCase().includes(s) || w.en.toLowerCase().includes(s)
      );
    }
    return true;
  });
}

/**
 * Filter words up to and including a level.
 * A0 returns only A0 words. A2 returns A0 + A1 + A2.
 */
export function queryWordsUpToLevel(maxLevel, filters = {}) {
  const maxIdx = LEVELS.indexOf(maxLevel);
  return queryWords(filters).filter(
    (w) => LEVELS.indexOf(w.introducedAtLevel) <= maxIdx
  );
}

/**
 * Filter sentences by criteria.
 */
export function querySentences({
  themes,
  grammarTags,
  introducedAtLevel,
  maxLevel,
  tense,
  sentenceType,
  wordOrder,
  search,
} = {}) {
  const maxIdx = maxLevel ? LEVELS.indexOf(maxLevel) : -1;

  return sentences.filter((s) => {
    if (themes?.length && !themes.some((t) => s.themes?.includes(t)))
      return false;
    if (
      grammarTags?.length &&
      !grammarTags.some((t) => s.grammarTags?.includes(t))
    )
      return false;
    if (introducedAtLevel && s.introducedAtLevel !== introducedAtLevel)
      return false;
    if (maxLevel && LEVELS.indexOf(s.introducedAtLevel) > maxIdx) return false;
    if (tense && s.tense !== tense) return false;
    if (sentenceType && s.sentenceType !== sentenceType) return false;
    if (wordOrder && s.wordOrder !== wordOrder) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.nl.toLowerCase().includes(q) || s.en.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

/**
 * Get all unique themes currently in use across words and sentences.
 */
export function getAllThemes() {
  const themeSet = new Set();
  words.forEach((w) => w.themes?.forEach((t) => themeSet.add(t)));
  sentences.forEach((s) => s.themes?.forEach((t) => themeSet.add(t)));
  return Array.from(themeSet).sort();
}

/**
 * Get all unique grammar tags currently in use.
 */
export function getAllGrammarTags() {
  const tagSet = new Set();
  sentences.forEach((s) => s.grammarTags?.forEach((t) => tagSet.add(t)));
  topics.forEach((t) => t.grammarTags?.forEach((g) => tagSet.add(g)));
  return Array.from(tagSet).sort();
}

/**
 * Stats for the dashboard.
 */
export function getStats() {
  const verbs = words.filter((w) => w.partOfSpeech === "verb");

  // Count verbs that are fully regular vs have any irregular form
  const fullyRegular = verbs.filter((v) => {
    const r = v.conjugation?.regularity;
    return r && r.past === "regular" && r.participle === "regular";
  });
  const hasIrregular = verbs.filter((v) => {
    const r = v.conjugation?.regularity;
    return r && (r.past === "irregular" || r.participle === "irregular");
  });

  return {
    totalWords: words.length,
    totalSentences: sentences.length,
    totalTopics: topics.length,
    totalExercises: exercises.length,
    totalVerbs: verbs.length,
    fullyRegularVerbs: fullyRegular.length,
    hasIrregularVerbs: hasIrregular.length,
    reviewDraft: words.filter((w) => w.reviewStatus === "draft").length,
    reviewAiReviewed: words.filter((w) => w.reviewStatus === "ai-reviewed")
      .length,
    reviewVerified: words.filter((w) => w.reviewStatus === "human-verified")
      .length,
    themes: getAllThemes(),
    levels: LEVELS.map((l) => ({
      level: l,
      wordCount: words.filter((w) => w.introducedAtLevel === l).length,
    })),
  };
}
