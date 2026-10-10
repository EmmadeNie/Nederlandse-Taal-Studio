/**
 * Writing content (docent): content_items and sets in the database, then the
 * same change in src/data so the app shows it right away. The database checks
 * set membership itself; validate.js gives friendlier messages before that.
 */
import { supabase } from "../lib/supabase";
import { dropItem, dropSet, putItem, putSet, typeOfId } from "./index";

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

export async function deleteItem(id) {
  check(await supabase.from("content_items").delete().eq("id", id));
  dropItem(id);
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

export async function deleteSet(id) {
  check(await supabase.from("sets").delete().eq("id", id));
  dropSet(id);
}

/** Lessons that use an item or set: topics via topic_ids, sets via word/sentence lists. */
export async function lessonsUsing({ topicId, setId }) {
  let query = supabase.from("lessons").select("id, title");
  if (topicId) query = query.contains("topic_ids", [topicId]);
  else if (setId) query = query.or(`word_list->>set.eq.${setId},sentence_list->>set.eq.${setId}`);
  else return [];
  return query.order("title").then(check);
}
