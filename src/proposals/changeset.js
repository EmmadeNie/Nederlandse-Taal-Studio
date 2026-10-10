/**
 * Changesets from ChatGPT: parse, check and apply them, one change at a time.
 * The format is documented in docs/content-briefing-voor-chatgpt.md.
 *
 * Problems and notes are { key, vars } for t(); `key` lives under "pr.".
 */
import { VOCABULARIES, allItems, getItem, getSet, typeOfId } from "../data";
import { VOCAB_PATTERN, validateItem, validateSet } from "../data/validate";
import { hasNoPerfect } from "../data/verbForms";
import { addVocabulary, createItem, createSet, deleteItem, deleteSet, updateItem, updateSet } from "../data/contentApi";

export const ITEM_OPS = ["add", "update", "delete"];
export const SET_OPS = ["set.create", "set.update", "set.delete", "set.addItem", "set.removeItem", "set.moveItem"];
export const VOCAB_OPS = ["vocab.add"];
export const VOCAB_KINDS = ["theme", "tag", "grammarTag"];
// Item fields whose values come from a vocabulary.
const VOCAB_FIELDS = { themes: "theme", tags: "tag", grammarTags: "grammarTag" };
const ITEM_TYPES = ["word", "sentence", "topic", "exercise"];
const SET_TYPES = ["word", "sentence", "exercise"];

const p = (key, vars) => ({ key: `pr.${key}`, vars });

// ----- Parsing -----

/** Text pasted by the docent → { title, summary, changes }; throws Error("pr.…") with .vars. */
export function parseChangeset(text) {
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw Object.assign(new Error("pr.err.json"), { vars: {} });
  }
  if (Array.isArray(json)) json = { changes: json };
  const changes = json?.changes;
  if (!Array.isArray(changes) || changes.length === 0) {
    throw Object.assign(new Error("pr.err.noChanges"), { vars: {} });
  }
  changes.forEach((c, i) => {
    const bad = (why) => {
      throw Object.assign(new Error("pr.err.change"), { vars: { n: i + 1, why } });
    };
    if (!c || typeof c !== "object") bad("geen object");
    if (![...ITEM_OPS, ...SET_OPS, ...VOCAB_OPS].includes(c.op)) bad(`onbekende op "${c.op}"`);
    if (VOCAB_OPS.includes(c.op)) {
      if (!VOCAB_KINDS.includes(c.kind)) bad("kind moet theme, tag of grammarTag zijn");
      if (typeof c.value !== "string") bad("value ontbreekt");
    } else if (ITEM_OPS.includes(c.op)) {
      if (typeof c.id !== "string") bad("id ontbreekt");
      if (c.op !== "delete" && (typeof c.data !== "object" || c.data === null || Array.isArray(c.data))) {
        bad("data moet een object zijn");
      }
    } else {
      if (typeof c.set !== "string") bad("set ontbreekt");
      if (["set.addItem", "set.removeItem", "set.moveItem"].includes(c.op) && typeof c.item !== "string") bad("item ontbreekt");
      if (c.op === "set.create" && !SET_TYPES.includes(c.type)) bad("type moet word, sentence of exercise zijn");
    }
  });
  // Copied straight from the export, these are not fields.
  changes.forEach((c) => {
    if (c.data) {
      delete c.data.id;
      delete c.data.updatedAt;
    }
  });
  return {
    title: String(json.title || "").trim() || "Voorstel van ChatGPT",
    summary: String(json.summary || "").trim(),
    changes,
  };
}

// ----- Reading the current state -----

/** The ids a change touches (to fetch their current version). */
export const touchedIds = (change) =>
  ITEM_OPS.includes(change.op)
    ? { items: [change.id], sets: [] }
    : SET_OPS.includes(change.op)
      ? { items: [], sets: [change.set] }
      : { items: [], sets: [] };

/** Patch an item's fields: top-level keys replace, null removes. */
export function applyPatch(data, patch) {
  const next = { ...data };
  Object.entries(patch || {}).forEach(([k, v]) => {
    if (v === null) delete next[k];
    else next[k] = v;
  });
  return next;
}

const insertAfter = (ids, item, after) => {
  const rest = ids.filter((x) => x !== item);
  const at = after == null ? 0 : rest.indexOf(after) + 1;
  return [...rest.slice(0, at), item, ...rest.slice(at)];
};

// ----- Checking one change -----

/**
 * What would happen: { before, after, problems[], conflict, blockedBy, similar }.
 * `versions` maps ids ("word.x", "set:id") to the current updated_at;
 * `decisions` are this proposal's verdicts, `changes` all its changes.
 */
export function evaluate(change, index, { changes, decisions, versions }) {
  const problems = [];
  let before = null;
  let after = null;
  let conflict = false;

  // Depends on an earlier change in this proposal that adds what it refers to.
  const refs = new Set(
    ITEM_OPS.includes(change.op)
      ? [change.id]
      : [`set:${change.set}`, change.item, ...(change.items || []), change.after].filter(Boolean)
  );
  let blockedBy = null;
  changes.forEach((other, j) => {
    if (j >= index || blockedBy) return;
    const adds = other.op === "add" ? other.id : other.op === "set.create" ? `set:${other.set}` : null;
    if (adds && refs.has(adds) && decisions[j]?.status !== "approved") {
      blockedBy = { index: j, rejected: decisions[j]?.status === "rejected", name: other.data?.nl || other.data?.title || other.title || adds };
    }
  });

  const stale = (key) => {
    const current = versions[key];
    return Boolean(change.baseVersion && current && new Date(current) > new Date(change.baseVersion));
  };
  const ctx = { has: (id) => Boolean(getItem(id)), hasSet: (id) => Boolean(getSet(id)) };

  if (VOCAB_OPS.includes(change.op)) {
    if (!VOCAB_PATTERN.test(change.value || "")) problems.push(p("badVocab", { value: change.value }));
    else if (VOCABULARIES[change.kind]?.includes(change.value)) problems.push(p("vocabExists", { value: change.value }));
    return { before, after, problems, conflict, blockedBy: null, similar: null };
  }

  if (ITEM_OPS.includes(change.op)) {
    const type = change.type || typeOfId(change.id);
    if (!ITEM_TYPES.includes(type) || !change.id.startsWith(`${type}.`)) problems.push(p("badType", { id: change.id }));
    const current = getItem(change.id);
    before = current;
    if (change.op === "add") {
      if (current) problems.push(p("exists", { id: change.id }));
      after = { id: change.id, ...change.data };
      if (!current && !blockedBy) problems.push(...validateItem(type, after, ctx, { isNew: true }));
    } else if (!current) {
      if (!blockedBy) problems.push(p("missing", { id: change.id }));
    } else {
      conflict = stale(change.id);
      if (change.op === "update") {
        // eslint-disable-next-line no-unused-vars -- id is not a field
        const { id, ...data } = current;
        after = { id: change.id, ...applyPatch(data, change.data) };
        problems.push(...validateItem(type, after, ctx));
      }
    }
  } else {
    const current = getSet(change.set);
    before = current;
    if (change.op === "set.create") {
      if (current) problems.push(p("setExists", { id: change.set }));
      after = { id: change.set, type: change.type, title: change.title || change.set, level: change.level || null, itemIds: change.items || [] };
      if (!current && !blockedBy) problems.push(...validateSet(after, ctx, { isNew: true }));
    } else if (!current) {
      if (!blockedBy) problems.push(p("setMissing", { id: change.set }));
    } else {
      conflict = stale(`set:${change.set}`);
      const ids = current.itemIds;
      if (change.op === "set.update") {
        after = { ...current, ...("title" in change ? { title: change.title } : {}), ...("level" in change ? { level: change.level } : {}) };
      } else if (change.op === "set.addItem") {
        if (ids.includes(change.item)) problems.push(p("alreadyInSet", { id: change.item }));
        if (change.after != null && !ids.includes(change.after)) problems.push(p("afterMissing", { id: change.after }));
        after = { ...current, itemIds: insertAfter(ids, change.item, change.after) };
      } else if (change.op === "set.removeItem") {
        if (!ids.includes(change.item)) problems.push(p("notInSet", { id: change.item }));
        after = { ...current, itemIds: ids.filter((x) => x !== change.item) };
      } else if (change.op === "set.moveItem") {
        if (!ids.includes(change.item)) problems.push(p("notInSet", { id: change.item }));
        if (change.after != null && !ids.includes(change.after)) problems.push(p("afterMissing", { id: change.after }));
        after = { ...current, itemIds: insertAfter(ids, change.item, change.after) };
      }
      if (after && change.op !== "set.update" && !blockedBy) {
        problems.push(...validateSet(after, ctx).filter((x) => x.field === "itemIds"));
      }
    }
  }

  // An unknown theme/tag that an earlier vocab.add in this proposal adds: wait for it.
  if (!blockedBy) {
    const pending = (field, value) =>
      changes.findIndex(
        (o, j) => j < index && o.op === "vocab.add" && o.kind === VOCAB_FIELDS[field] && o.value === value && decisions[j]?.status !== "approved"
      );
    for (let k = problems.length - 1; k >= 0; k--) {
      const x = problems[k];
      if (x.key !== "val.unknown" || !VOCAB_FIELDS[x.field]) continue;
      const j = pending(x.field, x.vars?.value);
      if (j === -1) continue;
      problems.splice(k, 1);
      blockedBy ||= { index: j, rejected: decisions[j]?.status === "rejected", name: x.vars.value };
    }
  }

  // A new item with the same Dutch text (or title) as an existing one: maybe a double.
  let similar = null;
  if (change.op === "add" && after) {
    const norm = (x) => (x.nl || x.title || "").trim().toLowerCase();
    const mine = norm(after);
    const type = change.type || typeOfId(change.id);
    similar = (mine && allItems().find((x) => x.id !== change.id && typeOfId(x.id) === type && norm(x) === mine)) || null;
  }

  // A verb without a perfect is allowed, but worth a conscious look.
  const noPerfect = Boolean(after?.partOfSpeech === "verb" && after.conjugation && hasNoPerfect(after.conjugation));

  return { before, after, problems, conflict, blockedBy, similar, noPerfect };
}

// ----- Applying one change -----

export async function applyChange(change, evaluation) {
  const { after } = evaluation;
  switch (change.op) {
    case "vocab.add":
      return addVocabulary(change.kind, change.value);
    case "add":
      return createItem(after);
    case "update":
      return updateItem(after);
    case "delete":
      return deleteItem(change.id);
    case "set.create":
      return createSet(after);
    case "set.update":
      return updateSet(change.set, { title: after.title, level: after.level });
    case "set.delete":
      return deleteSet(change.set);
    default:
      return updateSet(change.set, { itemIds: after.itemIds });
  }
}
