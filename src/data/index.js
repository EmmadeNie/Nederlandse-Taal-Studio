import { LEVELS, THEMES, GRAMMAR_TAGS, TAGS } from "./schema.js";

/**
 * The content (words, sentences, grammar topics, exercises, sets) lives in the
 * database (tables content_items and sets). <ContentGate> loads it once after
 * login and fills these arrays in place via setContent(), so everything that
 * imports them keeps working. Items have the same shape as the old JSON:
 * { id, ...fields }. Sets: { id, type, title, level, itemIds }.
 */
export const words = [];
export const sentences = [];
export const topics = [];
export const exercises = [];
export const sets = [];

const BY_TYPE = { word: words, sentence: sentences, topic: topics, exercise: exercises };

/** Replace all content: rows from content_items and sets. */
export function setContent(itemRows, setRows) {
  Object.values(BY_TYPE).forEach((list) => (list.length = 0));
  itemRows.forEach((row) => BY_TYPE[row.type]?.push({ id: row.id, ...row.data }));
  sets.length = 0;
  setRows.forEach((row) =>
    sets.push({ id: row.id, type: row.type, title: row.title, level: row.level, itemIds: row.item_ids })
  );
}

/** The sets of one type ("word", "sentence", "exercise"), by title. */
export const setsOfType = (type) =>
  sets.filter((s) => s.type === type).sort((a, b) => a.title.localeCompare(b.title, "nl"));

export const getSet = (id) => sets.find((s) => s.id === id) || null;

/** The items of a set, in the set's order (unknown ids skipped). */
export function setItems(set) {
  if (!set) return [];
  const list = BY_TYPE[set.type] || [];
  const byId = new Map(list.map((item) => [item.id, item]));
  return set.itemIds.map((id) => byId.get(id)).filter(Boolean);
}

export { LEVELS, THEMES, GRAMMAR_TAGS, TAGS };

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

const isVerb = (w) => w.partOfSpeech === "verb";
const isNonVerbWord = (w) => w.partOfSpeech !== "verb";

/**
 * Stats for the dashboard.
 */
export function getStats() {
  const verbs = words.filter(isVerb);

  // Count verbs that are fully regular vs have any irregular form
  const fullyRegular = verbs.filter((v) => {
    const r = v.conjugation?.regularity;
    return r && r.past === "regular" && r.participle === "regular";
  });
  const hasIrregular = verbs.filter((v) => {
    const r = v.conjugation?.regularity;
    return r && (r.past === "irregular" || r.participle === "irregular");
  });

  // Review-status counts across ALL content types (not just words)
  const reviewByStatus = (status) => ({
    words: words.filter((w) => w.reviewStatus === status).length,
    sentences: sentences.filter((s) => s.reviewStatus === status).length,
    topics: topics.filter((t) => t.reviewStatus === status).length,
  });

  return {
    totalWords: words.length,
    totalSentences: sentences.length,
    totalTopics: topics.length,
    totalExercises: exercises.length,
    totalVerbs: verbs.length,
    fullyRegularVerbs: fullyRegular.length,
    hasIrregularVerbs: hasIrregular.length,
    review: {
      draft: reviewByStatus("draft"),
      "ai-reviewed": reviewByStatus("ai-reviewed"),
      "human-verified": reviewByStatus("human-verified"),
    },
    themes: getAllThemes(),
  };
}

/**
 * Content counts per CEFR level, split by content type.
 * This is the "Content per niveau" matrix: it never combines types into one number.
 * Words are split into vocabulary (non-verb) and verbs.
 */
export function getLevelMatrix() {
  return LEVELS.map((level) => ({
    level,
    words: words.filter((w) => isNonVerbWord(w) && w.introducedAtLevel === level)
      .length,
    verbs: words.filter((w) => isVerb(w) && w.introducedAtLevel === level).length,
    sentences: sentences.filter((s) => s.introducedAtLevel === level).length,
    topics: topics.filter((t) => t.introducedAtLevel === level).length,
    exercises: exercises.filter((e) => e.level === level).length,
  }));
}

/**
 * How many example sentences reference each grammar topic (via grammarTags).
 * Lets us spot topics that are under-illustrated.
 */
export function getTopicCoverage() {
  return topics
    .map((t) => {
      const count = sentences.filter((s) =>
        (s.grammarTags || []).some((g) => (t.grammarTags || []).includes(g))
      ).length;
      return {
        id: t.id,
        title: t.title,
        level: t.introducedAtLevel,
        sentenceCount: count,
      };
    })
    .sort((a, b) => a.sentenceCount - b.sentenceCount);
}

/**
 * Resolve how many content items an exercise's query currently matches.
 * Flashcard exercises match words; others match sentences.
 */
export function getExerciseMatchCount(exercise) {
  const q = exercise.query || {};
  if (exercise.type === "flashcards") {
    return queryWordsUpToLevel(q.maxLevel || exercise.level, {
      themes: q.themes,
    }).length;
  }
  return querySentences({
    grammarTags: q.grammarTags,
    maxLevel: q.maxLevel || exercise.level,
    themes: q.themes,
    tense: q.tense,
  }).length;
}

/**
 * Data-quality / gap indicators. Pure read-only diagnostics — never corrects content.
 * A threshold marks "thin" exercises/topics so gaps are easy to spot.
 */
export function getQualityIndicators({ thinThreshold = 3 } = {}) {
  // Words never used in any sentence (as wordId or focusWordId)
  const usedWordIds = new Set();
  sentences.forEach((s) => {
    (s.wordIds || []).forEach((id) => usedWordIds.add(id));
    (s.focusWordIds || []).forEach((id) => usedWordIds.add(id));
  });
  const unusedWords = words.filter((w) => !usedWordIds.has(w.id));

  // Verbs with incomplete conjugation metadata
  const requiredConj = [
    "infinitive",
    "stem",
    "present",
    "past",
    "participle",
    "auxiliary",
    "regularity",
  ];
  const incompleteVerbs = words.filter((w) => {
    if (!isVerb(w)) return false;
    const c = w.conjugation;
    if (!c) return true;
    if (requiredConj.some((k) => c[k] === undefined)) return true;
    if (!c.regularity?.past || !c.regularity?.participle) return true;
    return false;
  });

  // Topics with few example sentences
  const thinTopics = getTopicCoverage().filter(
    (t) => t.sentenceCount < thinThreshold
  );

  // Exercises whose query returns too little content
  const thinExercises = exercises
    .map((e) => ({
      id: e.id,
      title: e.title,
      level: e.level,
      matchCount: getExerciseMatchCount(e),
    }))
    .filter((e) => e.matchCount < thinThreshold)
    .sort((a, b) => a.matchCount - b.matchCount);

  // Broken references (orphaned IDs)
  const wordIdSet = new Set(words.map((w) => w.id));
  const topicIdSet = new Set(topics.map((t) => t.id));
  const brokenRefs = [];
  sentences.forEach((s) => {
    (s.wordIds || []).forEach((id) => {
      if (!wordIdSet.has(id))
        brokenRefs.push({ from: s.id, type: "wordId", missing: id });
    });
    (s.focusWordIds || []).forEach((id) => {
      if (!wordIdSet.has(id))
        brokenRefs.push({ from: s.id, type: "focusWordId", missing: id });
    });
  });
  exercises.forEach((e) => {
    if (e.topicId && !topicIdSet.has(e.topicId))
      brokenRefs.push({ from: e.id, type: "topicId", missing: e.topicId });
  });

  // Levels with insufficient vocabulary (words + verbs below threshold)
  const vocabThreshold = 10;
  const thinVocabLevels = LEVELS.map((level) => ({
    level,
    vocabCount: words.filter((w) => w.introducedAtLevel === level).length,
  })).filter((l) => l.vocabCount < vocabThreshold);

  return {
    thinThreshold,
    vocabThreshold,
    unusedWords,
    incompleteVerbs,
    thinTopics,
    thinExercises,
    brokenRefs,
    thinVocabLevels,
  };
}
