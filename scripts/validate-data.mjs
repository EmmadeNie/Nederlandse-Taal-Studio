// Data validation script for Nederlandse Taal Studio.
// Checks the datasets against the v2 schema: IDs, references, levels,
// canonical tag vocabularies, verb conjugation completeness, enums.
//
// Run with:  node scripts/validate-data.mjs
// Exits with code 1 if any issue is found (useful for CI / pre-commit).

import { readFileSync } from "fs";
import {
  LEVELS,
  THEMES,
  GRAMMAR_TAGS,
  TAGS,
  TENSES,
  SENTENCE_TYPES,
  WORD_ORDERS,
  PARTS_OF_SPEECH,
  REVIEW_STATUSES,
} from "../src/data/schema.js";

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));

const words = [
  ...read("../src/data/words.json"),
  ...read("../src/data/words-thema.json"),
  ...read("../src/data/words-verbs.json"),
];
const sentences = read("../src/data/sentences.json");
const topics = read("../src/data/topics.json");
const exercises = read("../src/data/exercises.json");

const issues = [];
const warn = (msg) => issues.push(msg);

const wordIds = new Set(words.map((w) => w.id));
const topicIds = new Set(topics.map((t) => t.id));

const vLevels = new Set(LEVELS);
const vThemes = new Set(THEMES);
const vGrammar = new Set(GRAMMAR_TAGS);
const vTags = new Set(TAGS);
const vPos = new Set(PARTS_OF_SPEECH);
const vReview = new Set(REVIEW_STATUSES);
const vTenses = new Set(TENSES);
const vSentTypes = new Set(SENTENCE_TYPES);
const vWordOrders = new Set(WORD_ORDERS);

// --- 1. Duplicate IDs ---
const allWordIds = words.map((w) => w.id);
[...new Set(allWordIds.filter((id, i) => allWordIds.indexOf(id) !== i))].forEach(
  (id) => warn(`Duplicate word ID: ${id}`)
);
[sentences, topics, exercises].forEach((coll) => {
  const ids = coll.map((x) => x.id);
  [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))].forEach((id) =>
    warn(`Duplicate ID: ${id}`)
  );
});

// --- 2. ID prefix conventions ---
const checkPrefix = (coll, prefix) =>
  coll.forEach((x) => {
    if (!x.id.startsWith(prefix)) warn(`Bad ID prefix (expected ${prefix}): ${x.id}`);
  });
checkPrefix(words, "word.");
checkPrefix(sentences, "sentence.");
checkPrefix(topics, "topic.");
checkPrefix(exercises, "exercise.");

// --- 3. Reference integrity ---
sentences.forEach((s) => {
  (s.wordIds || []).forEach((wid) => {
    if (!wordIds.has(wid)) warn(`${s.id} references missing word: ${wid}`);
  });
  (s.focusWordIds || []).forEach((wid) => {
    if (!wordIds.has(wid)) warn(`${s.id} focusWordId references missing word: ${wid}`);
  });
});
exercises.forEach((e) => {
  if (e.topicId && !topicIds.has(e.topicId))
    warn(`${e.id} references missing topic: ${e.topicId}`);
});

// --- 4. Valid levels ---
[...words, ...sentences, ...topics].forEach((x) => {
  if (!vLevels.has(x.introducedAtLevel))
    warn(`Invalid introducedAtLevel on ${x.id}: ${x.introducedAtLevel}`);
});
exercises.forEach((e) => {
  if (e.level && !vLevels.has(e.level))
    warn(`Invalid level on ${e.id}: ${e.level}`);
  if (e.query?.maxLevel && !vLevels.has(e.query.maxLevel))
    warn(`Invalid query.maxLevel on ${e.id}: ${e.query.maxLevel}`);
});

// --- 5. Canonical vocabularies ---
words.forEach((w) => {
  (w.themes || []).forEach((t) => {
    if (!vThemes.has(t)) warn(`Unknown theme "${t}" on ${w.id}`);
  });
  (w.tags || []).forEach((t) => {
    if (!vTags.has(t)) warn(`Unknown tag "${t}" on ${w.id}`);
  });
  if (!vPos.has(w.partOfSpeech)) warn(`Unknown partOfSpeech on ${w.id}: ${w.partOfSpeech}`);
  if (!vReview.has(w.reviewStatus)) warn(`Unknown reviewStatus on ${w.id}: ${w.reviewStatus}`);
});
sentences.forEach((s) => {
  (s.themes || []).forEach((t) => {
    if (!vThemes.has(t)) warn(`Unknown theme "${t}" on ${s.id}`);
  });
  (s.grammarTags || []).forEach((t) => {
    if (!vGrammar.has(t)) warn(`Unknown grammarTag "${t}" on ${s.id}`);
  });
  (s.sets || []).forEach((set) => {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(set)) warn(`Set "${set}" on ${s.id} is not a slug (lowercase-with-dashes)`);
  });
});
topics.forEach((t) => {
  (t.grammarTags || []).forEach((g) => {
    if (!vGrammar.has(g)) warn(`Unknown grammarTag "${g}" on ${t.id}`);
  });
});

// --- 6. Verb conjugation completeness ---
words
  .filter((w) => w.partOfSpeech === "verb")
  .forEach((v) => {
    const c = v.conjugation;
    if (!c) {
      warn(`Verb missing conjugation: ${v.id}`);
      return;
    }
    ["infinitive", "stem", "present", "past", "participle", "auxiliary", "regularity"].forEach(
      (k) => {
        if (c[k] === undefined) warn(`Verb ${v.id} missing conjugation.${k}`);
      }
    );
    if (c.regularity) {
      if (!c.regularity.past) warn(`Verb ${v.id} missing regularity.past`);
      if (!c.regularity.participle) warn(`Verb ${v.id} missing regularity.participle`);
    }
    if (c.auxiliary && !["hebben", "zijn"].includes(c.auxiliary))
      warn(`Verb ${v.id} invalid auxiliary: ${c.auxiliary}`);
  });

// --- 7. Sentence enums ---
sentences.forEach((s) => {
  if (s.tense && !vTenses.has(s.tense)) warn(`Invalid tense "${s.tense}" on ${s.id}`);
  if (s.sentenceType && !vSentTypes.has(s.sentenceType))
    warn(`Invalid sentenceType "${s.sentenceType}" on ${s.id}`);
  if (s.wordOrder && !vWordOrders.has(s.wordOrder))
    warn(`Invalid wordOrder "${s.wordOrder}" on ${s.id}`);
  if (s.difficulty !== undefined && (s.difficulty < 1 || s.difficulty > 5))
    warn(`difficulty out of range (1-5) on ${s.id}: ${s.difficulty}`);
});

// --- Report ---
console.log("");
if (issues.length === 0) {
  console.log("All validation checks passed.");
} else {
  console.log(`Found ${issues.length} issue(s):`);
  issues.forEach((i) => console.log("  - " + i));
}
console.log(
  `\nTotals: ${words.length} words | ${sentences.length} sentences | ${topics.length} topics | ${exercises.length} exercises`
);

process.exit(issues.length === 0 ? 0 : 1);
