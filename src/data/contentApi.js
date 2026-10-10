/**
 * Writing content (docent): content_items and sets in the database, then the
 * same change in src/data so the app shows it right away. The database checks
 * set membership itself; validate.js gives friendlier messages before that.
 */
import { supabase } from "../lib/supabase";
import { allItems, dropItem, dropSet, putItem, putSet, typeOfId } from "./index";

const ITEM = "id, type, data";
const SET = "id, type, title, level, item_ids";

function check({ data, error }) {
  if (error?.code === "23505") throw new Error("val.duplicateId");
  if (error) throw new Error(error.message);
  return data;
}

/** Split an item into its id and the fields stored in `data`. */
const toData = (item) => {
  // eslint-disable-next-line no-unused-vars -- id and sets are not stored in data
  const { id, sets, ...data } = item;
  return data;
};

export async function createItem(item) {
  const row = await supabase
    .from("content_items")
    .insert({ id: item.id, type: typeOfId(item.id), data: toData(item) })
    .select(ITEM)
    .single()
    .then(check);
  putItem(row);
  return row;
}

export async function updateItem(item) {
  const row = await supabase
    .from("content_items")
    .update({ data: toData(item) })
    .eq("id", item.id)
    .select(ITEM)
    .single()
    .then(check);
  putItem(row);
  return row;
}

/** Delete an item and take it out of whatever refers to it (sets do that in the database). */
export async function deleteItem(id) {
  check(await supabase.from("content_items").delete().eq("id", id));
  dropItem(id);
  await removeItemReferences(id);
}

// Fields of other items that refer to an item by id.
const REF_FIELDS = ["wordIds", "focusWordIds", "relatedWordIds", "exampleSentenceIds"];

async function removeItemReferences(id) {
  for (const item of allItems()) {
    const fixed = { ...item };
    let changed = false;
    REF_FIELDS.forEach((f) => {
      if (item[f]?.includes(id)) {
        fixed[f] = item[f].filter((x) => x !== id);
        changed = true;
      }
    });
    if (item.topicId === id) {
      delete fixed.topicId;
      changed = true;
    }
    if (changed) await updateItem(fixed);
  }
  if (typeOfId(id) === "topic") {
    const lessons = await supabase.from("lessons").select("id, topic_ids").contains("topic_ids", [id]).then(check);
    for (const l of lessons) {
      check(await supabase.from("lessons").update({ topic_ids: l.topic_ids.filter((x) => x !== id) }).eq("id", l.id));
    }
  }
}

export async function createSet({ id, type, title, level = null, itemIds = [] }) {
  const row = await supabase
    .from("sets")
    .insert({ id, type, title, level, item_ids: itemIds })
    .select(SET)
    .single()
    .then(check);
  putSet(row);
  return row;
}

/** patch: { title?, level?, itemIds? } */
export async function updateSet(id, patch) {
  const fields = {};
  if ("title" in patch) fields.title = patch.title;
  if ("level" in patch) fields.level = patch.level || null;
  if ("itemIds" in patch) fields.item_ids = patch.itemIds;
  const row = await supabase.from("sets").update(fields).eq("id", id).select(SET).single().then(check);
  putSet(row);
  return row;
}

/** Delete a set and the lesson lists built on it. */
export async function deleteSet(id) {
  check(await supabase.from("sets").delete().eq("id", id));
  dropSet(id);
  const lessons = await supabase
    .from("lessons")
    .select("id, word_list, sentence_list")
    .or(`word_list.cs.${JSON.stringify([{ set: id }])},sentence_list.cs.${JSON.stringify([{ set: id }])}`)
    .then(check);
  const without = (lists) => {
    const kept = (Array.isArray(lists) ? lists : lists ? [lists] : []).filter((x) => x.set !== id);
    return kept.length ? kept : null;
  };
  for (const l of lessons) {
    check(
      await supabase
        .from("lessons")
        .update({ word_list: without(l.word_list), sentence_list: without(l.sentence_list) })
        .eq("id", l.id)
    );
  }
}

/** Lessons that use an item or set: topics via topic_ids, sets via word/sentence lists. */
export async function lessonsUsing({ topicId, setId }) {
  let query = supabase.from("lessons").select("id, title");
  if (topicId) query = query.contains("topic_ids", [topicId]);
  else if (setId) {
    const list = JSON.stringify([{ set: setId }]);
    query = query.or(`word_list.cs.${list},sentence_list.cs.${list}`);
  }
  else return [];
  return query.order("title").then(check);
}
