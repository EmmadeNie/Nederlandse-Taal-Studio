/**
 * Content rules, shared by the editor in the app (and later by ChatGPT's
 * changesets). The same checks as scripts/validate-data.mjs, per item.
 *
 * Each problem is { field, key, vars }: `field` is the path of the field it is
 * about ("" = the whole item), `key` an i18n key under "val.".
 */
import { LEVELS, PARTS_OF_SPEECH, REVIEW_STATUSES, SENTENCE_TYPES, TENSES, WORD_ORDERS } from "./schema.js";
import { GRAMMAR_TAGS, TAGS, THEMES } from "./index.js";

/** Allowed value of a vocabulary (theme, tag, grammar tag): lower case, digits, single hyphens. */
export const VOCAB_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const ID_PATTERN = /^(word|sentence|topic|exercise)\.[a-z0-9][a-z0-9._-]*$/;
export const SET_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const EXERCISE_TYPES = ["flashcards", "fill-in", "translate", "multiple-choice"];

const blank = (v) => v == null || String(v).trim() === "";

/**
 * Problems with one item. `ctx.has(id)` tells whether an item exists (for
 * references); `isNew` adds the id checks.
 */
export function validateItem(type, item, ctx, { isNew = false } = {}) {
  const out = [];
  const add = (field, key, vars) => out.push({ field, key: `val.${key}`, vars });
  const required = (field) => blank(field.split(".").reduce((o, k) => o?.[k], item)) && add(field, "required");
  const oneOf = (field, value, list) => value != null && value !== "" && !list.includes(value) && add(field, "unknown", { value });
  const allOf = (field, values, list) => (values || []).forEach((v) => !list.includes(v) && add(field, "unknown", { value: v }));
  const refs = (field, ids, refType) =>
    (ids || []).forEach((id) => !(id.startsWith(`${refType}.`) && ctx.has(id)) && add(field, "missingRef", { id }));

  if (isNew) {
    if (!ID_PATTERN.test(item.id || "") || !item.id.startsWith(`${type}.`)) add("id", "badId", { prefix: `${type}.` });
    else if (ctx.has(item.id)) add("id", "duplicateId", { id: item.id });
  }

  if (type !== "exercise") oneOf("reviewStatus", item.reviewStatus, REVIEW_STATUSES);

  if (type === "word") {
    ["nl", "en", "partOfSpeech", "introducedAtLevel"].forEach(required);
    oneOf("partOfSpeech", item.partOfSpeech, PARTS_OF_SPEECH);
    oneOf("introducedAtLevel", item.introducedAtLevel, LEVELS);
    allOf("themes", item.themes, THEMES);
    allOf("tags", item.tags, TAGS);
    if (item.partOfSpeech === "noun") oneOf("article", item.article, ["de", "het"]);
    if (item.partOfSpeech === "verb") {
      [
        "conjugation.infinitive",
        "conjugation.stem",
        "conjugation.present.ik",
        "conjugation.present.jij",
        "conjugation.present.hij",
        "conjugation.present.wij",
        "conjugation.past.singular",
        "conjugation.past.plural",
        "conjugation.participle",
        "conjugation.auxiliary",
        "conjugation.regularity.past",
        "conjugation.regularity.participle",
      ].forEach(required);
      oneOf("conjugation.auxiliary", item.conjugation?.auxiliary, ["hebben", "zijn", "hebben/zijn"]);
    }
  }

  if (type === "sentence") {
    ["nl", "en", "introducedAtLevel"].forEach(required);
    oneOf("introducedAtLevel", item.introducedAtLevel, LEVELS);
    allOf("themes", item.themes, THEMES);
    allOf("grammarTags", item.grammarTags, GRAMMAR_TAGS);
    oneOf("tense", item.tense, TENSES);
    oneOf("sentenceType", item.sentenceType, SENTENCE_TYPES);
    oneOf("wordOrder", item.wordOrder, WORD_ORDERS);
    if (item.difficulty != null && !(Number.isInteger(item.difficulty) && item.difficulty >= 1 && item.difficulty <= 5)) {
      add("difficulty", "difficulty");
    }
    refs("wordIds", item.wordIds, "word");
    refs("focusWordIds", item.focusWordIds, "word");
  }

  if (type === "topic") {
    ["title", "introducedAtLevel"].forEach(required);
    oneOf("introducedAtLevel", item.introducedAtLevel, LEVELS);
    allOf("themes", item.themes, THEMES);
    allOf("grammarTags", item.grammarTags, GRAMMAR_TAGS);
    refs("relatedWordIds", item.relatedWordIds, "word");
    refs("exampleSentenceIds", item.exampleSentenceIds, "sentence");
  }

  if (type === "exercise") {
    ["title", "type", "level"].forEach(required);
    oneOf("type", item.type, EXERCISE_TYPES);
    oneOf("level", item.level, LEVELS);
    if (item.topicId) refs("topicId", [item.topicId], "topic");
    if (item.query != null && (typeof item.query !== "object" || Array.isArray(item.query))) add("query", "notObject");
    oneOf("query", item.query?.maxLevel, LEVELS);
  }

  return out;
}

/** Problems with a set (its items: exist, right type, once). */
export function validateSet(set, ctx, { isNew = false } = {}) {
  const out = [];
  const add = (field, key, vars) => out.push({ field, key: `val.${key}`, vars });
  if (isNew) {
    if (!SET_ID_PATTERN.test(set.id || "")) add("id", "badSetId");
    else if (ctx.hasSet(set.id)) add("id", "duplicateId", { id: set.id });
  }
  if (blank(set.title)) add("title", "required");
  if (set.level) {
    if (!LEVELS.includes(set.level)) add("level", "unknown", { value: set.level });
  }
  const seen = new Set();
  (set.itemIds || []).forEach((id) => {
    if (seen.has(id)) add("itemIds", "doubleInSet", { id });
    seen.add(id);
    if (!(id.startsWith(`${set.type}.`) && ctx.has(id))) add("itemIds", "missingRef", { id });
  });
  return out;
}
