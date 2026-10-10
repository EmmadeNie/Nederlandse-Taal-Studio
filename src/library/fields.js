/**
 * The fields of each content type in the editor, in display order.
 *
 * kind: text | textarea | markdown | select | multi | number | refs | topic | json
 * path: where the value lives in the item ("conjugation.present.ik")
 * label: i18n key; options: allowed values (select/multi);
 * optionLabel: (t, value) => text; when: (item) => shown?; group: heading above it.
 */
import { LEVELS, PARTS_OF_SPEECH, REVIEW_STATUSES, SENTENCE_TYPES, TENSES, WORD_ORDERS } from "../data/schema.js";
import { GRAMMAR_TAGS, TAGS, THEMES } from "../data/index.js";
import { EXERCISE_TYPES } from "../data/validate.js";

const slugText = (t, v) => v.replace(/-/g, " ");
const isNoun = (item) => item.partOfSpeech === "noun";
const isVerb = (item) => item.partOfSpeech === "verb";

const level = (path = "introducedAtLevel") => ({ path, label: "f.level", kind: "select", options: LEVELS });
const review = [
  { path: "reviewStatus", label: "f.reviewStatus", kind: "select", options: REVIEW_STATUSES, optionLabel: (t, v) => t(`review.${v}`) },
];
const regularity = (form) => ({
  path: `conjugation.regularity.${form}`,
  label: `f.regularity.${form}`,
  kind: "select",
  options: ["regular", "irregular"],
  optionLabel: (t, v) => t(`f.${v}`),
  when: isVerb,
});
const conj = (path, label) => ({ path: `conjugation.${path}`, label, kind: "text", when: isVerb });

export const FIELDS = {
  word: [
    { path: "nl", label: "f.nl", kind: "text" },
    { path: "en", label: "f.en", kind: "text" },
    { path: "partOfSpeech", label: "f.partOfSpeech", kind: "select", options: PARTS_OF_SPEECH, optionLabel: (t, v) => t(`pos.${v}`) },
    { path: "article", label: "f.article", kind: "select", options: ["de", "het"], when: isNoun },
    { path: "plural", label: "f.plural", kind: "text", when: isNoun },
    level(),
    { path: "themes", label: "f.themes", kind: "multi", options: THEMES, optionLabel: slugText },
    { path: "tags", label: "f.tags", kind: "multi", options: TAGS, optionLabel: slugText },
    { ...conj("infinitive", "f.infinitive"), group: "f.conjugation" },
    conj("stem", "f.stem"),
    conj("present.ik", "f.present.ik"),
    conj("present.jij", "f.present.jij"),
    conj("present.hij", "f.present.hij"),
    conj("present.wij", "f.present.wij"),
    conj("past.singular", "f.past.singular"),
    conj("past.plural", "f.past.plural"),
    conj("participle", "f.participle"),
    { path: "conjugation.auxiliary", label: "f.auxiliary", kind: "select", options: ["hebben", "zijn", "hebben/zijn"], when: isVerb },
    regularity("present"),
    regularity("past"),
    regularity("participle"),
    { ...review[0], group: "f.review" },
    { path: "reviewNotes", label: "f.reviewNotes", kind: "textarea" },
  ],
  sentence: [
    { path: "nl", label: "f.nl", kind: "text" },
    { path: "en", label: "f.en", kind: "text" },
    level(),
    { path: "difficulty", label: "f.difficulty", kind: "number", min: 1, max: 5 },
    { path: "themes", label: "f.themes", kind: "multi", options: THEMES, optionLabel: slugText },
    { path: "grammarTags", label: "f.grammarTags", kind: "multi", options: GRAMMAR_TAGS, optionLabel: slugText },
    { path: "tense", label: "f.tense", kind: "select", options: TENSES, optionLabel: slugText },
    { path: "sentenceType", label: "f.sentenceType", kind: "select", options: SENTENCE_TYPES, optionLabel: (t, v) => t(`f.st.${v}`) },
    { path: "wordOrder", label: "f.wordOrder", kind: "select", options: WORD_ORDERS, optionLabel: (t, v) => t(`f.wo.${v}`) },
    { path: "wordIds", label: "f.wordIds", kind: "refs", refType: "word" },
    { path: "focusWordIds", label: "f.focusWordIds", kind: "refs", refType: "word" },
    { ...review[0], group: "f.review" },
    { path: "reviewNotes", label: "f.reviewNotes", kind: "textarea" },
  ],
  topic: [
    { path: "title", label: "f.title", kind: "text" },
    level(),
    { path: "summary", label: "f.summary", kind: "textarea" },
    { path: "explanation", label: "f.explanation", kind: "rich" },
    { path: "grammarTags", label: "f.grammarTags", kind: "multi", options: GRAMMAR_TAGS, optionLabel: slugText },
    { path: "themes", label: "f.themes", kind: "multi", options: THEMES, optionLabel: slugText },
    { path: "titleEn", label: "f.titleEn", kind: "text", group: "f.english" },
    { path: "summaryEn", label: "f.summaryEn", kind: "textarea" },
    { path: "explanationEn", label: "f.explanationEn", kind: "rich" },
    { path: "relatedWordIds", label: "f.relatedWordIds", kind: "refs", refType: "word", group: "f.links" },
    { path: "exampleSentenceIds", label: "f.exampleSentenceIds", kind: "refs", refType: "sentence" },
    { ...review[0], group: "f.review" },
    { path: "reviewNotes", label: "f.reviewNotes", kind: "textarea" },
  ],
  exercise: [
    { path: "title", label: "f.title", kind: "text" },
    { path: "type", label: "f.exerciseType", kind: "select", options: EXERCISE_TYPES, optionLabel: (t, v) => t(`f.ex.${v}`) },
    level("level"),
    { path: "topicId", label: "f.topic", kind: "topic" },
    { path: "query", label: "f.query", kind: "json" },
  ],
};

/** A new, empty item of a type (the docent writes it, so it starts verified). */
export function newItem(type, extra = {}) {
  const base = {
    word: { nl: "", en: "", partOfSpeech: "noun", introducedAtLevel: "A0", themes: [], tags: [], reviewStatus: "human-verified" },
    sentence: { nl: "", en: "", introducedAtLevel: "A0", themes: [], grammarTags: [], wordIds: [], focusWordIds: [], reviewStatus: "human-verified" },
    topic: { title: "", introducedAtLevel: "A0", summary: "", explanation: "", grammarTags: [], themes: [], docLinks: [], reviewStatus: "human-verified" },
    exercise: { title: "", type: "fill-in", level: "A0", query: { maxLevel: "A0", limit: 10 } },
  }[type];
  return { id: "", ...base, ...extra };
}

/** Value at a dotted path. */
export const getPath = (obj, path) => path.split(".").reduce((o, k) => o?.[k], obj);

/** Copy of obj with the value at path set (empty strings and lists removed). */
export function setPath(obj, path, value) {
  const keys = path.split(".");
  const copy = structuredClone(obj);
  let node = copy;
  keys.slice(0, -1).forEach((k) => {
    if (typeof node[k] !== "object" || node[k] === null) node[k] = {};
    node = node[k];
  });
  const last = keys[keys.length - 1];
  if (value === "" || value === null || value === undefined) delete node[last];
  else node[last] = value;
  return copy;
}

/** "Mijn eerste ontmoetingsgesprek" → "mijn-eerste-ontmoetingsgesprek" */
export const slugify = (text) =>
  (text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Suggested id for a new item, from its Dutch text or title. */
export const suggestId = (type, item) => {
  const slug = slugify(item.nl || item.title || "");
  return slug ? `${type}.${slug}` : "";
};

/** Short name of an item for lists ("de hond", "Hoe heet je?", a title). */
export const itemLabel = (item) =>
  item ? item.title || `${item.article ? item.article + " " : ""}${item.nl}` : "";
