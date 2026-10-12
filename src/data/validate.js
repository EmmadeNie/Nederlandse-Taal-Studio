/**
 * Content rules, shared by the editor in the app (and later by ChatGPT's
 * changesets). The same checks as scripts/validate-data.mjs, per item.
 *
 * Each problem is { field, key, vars }: `field` is the path of the field it is
 * about ("" = the whole item), `key` an i18n key under "val.".
 */
import { LEVELS, PARTS_OF_SPEECH, REVIEW_STATUSES, SENTENCE_TYPES, TENSES, WORD_ORDERS } from "./schema.js";
import { GRAMMAR_TAGS, TAGS, THEMES } from "./index.js";
import { PERFECT_FIELDS, hasNoPerfect } from "./verbForms.js";
import { TOPIC_CATEGORIES } from "./topicCategory.js";
import { CLAUSES, PART_ROLES, PERSONS, PRONOUN_TYPES, VERB_ROLES, locateParts } from "./sentenceParts.js";

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
      ]
        // A verb without a perfect ("zullen") leaves out all three perfect fields.
        .filter((f) => !(hasNoPerfect(item.conjugation) && PERFECT_FIELDS.includes(f)))
        .forEach(required);
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
    checkParts(item, add, ctx);
    checkPronouns(item, add);
  }

  if (type === "topic") {
    ["title", "introducedAtLevel"].forEach(required);
    oneOf("introducedAtLevel", item.introducedAtLevel, LEVELS);
    oneOf("category", item.category, TOPIC_CATEGORIES); // missing = grammar
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

/** sentence.parts: pieces of the Dutch text, in order, with a known role (see sentenceParts.js). */
function checkParts(item, add, ctx) {
  if (item.parts == null) return;
  if (!Array.isArray(item.parts)) {
    add("parts", "partsNotList");
    return;
  }
  const where = locateParts(item.nl || "", item.parts);
  item.parts.forEach((part, i) => {
    const n = i + 1;
    if (!part || typeof part !== "object" || typeof part.text !== "string" || !part.text.trim()) {
      add("parts", "partText", { n });
      return;
    }
    if (!PART_ROLES.includes(part.role)) add("parts", "partRole", { n, value: part.role });
    if (!where[i]) add("parts", "partNotInSentence", { n, text: part.text });
    if (part.person != null && (part.role !== "onderwerp" || !PERSONS.includes(part.person))) {
      add("parts", "partPerson", { n, value: part.person });
    }
    if (VERB_ROLES.includes(part.role) && !part.wordId) add("parts", "partVerbId", { n });
    if (part.clause != null && !CLAUSES.includes(part.clause)) add("parts", "partClause", { n, value: part.clause });
    if (part.wordId && !(part.wordId.startsWith("word.") && ctx.has(part.wordId))) {
      add("parts", "missingRef", { id: part.wordId });
    }
  });
}

/** sentence.pronouns: pronouns in the Dutch text, in order, with type and person. */
function checkPronouns(item, add) {
  if (item.pronouns == null) return;
  if (!Array.isArray(item.pronouns)) {
    add("pronouns", "partsNotList");
    return;
  }
  const where = locateParts(item.nl || "", item.pronouns);
  item.pronouns.forEach((p, i) => {
    const n = i + 1;
    if (!p || typeof p !== "object" || typeof p.text !== "string" || !p.text.trim()) {
      add("pronouns", "partText", { n });
      return;
    }
    if (!where[i]) add("pronouns", "pronounNotInSentence", { n, text: p.text });
    if (!PRONOUN_TYPES.includes(p.type)) add("pronouns", "pronounType", { n, value: p.type });
    if (!PERSONS.includes(p.person)) add("pronouns", "pronounPerson", { n, value: p.person });
    if (p.clause != null && !CLAUSES.includes(p.clause)) add("pronouns", "partClause", { n, value: p.clause });
  });
}
