/**
 * Lessons (the cards on the Lesprogramma board) in changesets from ChatGPT:
 *
 *   { "op": "lesson.add", "lane": "<laneId>", "after": "<lessonId>|null", "data": { …fields } }
 *   { "op": "lesson.update", "id": "<lessonId>", "baseVersion": "<updatedAt>",
 *     "data": { …changed fields; null clears }, "lane"?: "<laneId>", "after"?: "<lessonId>|null" }
 *
 * Fields (as in the export): title, level, labelIds, explanation (HTML), links [{label, url}],
 * wordLists, sentenceLists (recipes, as in the lesson editor), topicIds, verbIds.
 * Lessons keep their database ids (uuid); a new lesson gets one when it is created.
 */
import { supabase } from "../lib/supabase";
import { GRAMMAR_TAGS, LEVELS, THEMES, getItem, getSet } from "../data";
import { WORD_POS } from "../leerpad/wordLists";
import { positionBetween } from "../leerpad/positions";
import { createLesson, updateLesson } from "../leerpad/api";

export const LESSON_OPS = ["lesson.add", "lesson.update"];

// Field in a changeset → column in lessons.
const COLUMNS = {
  title: "title",
  level: "level",
  labelIds: "label_ids",
  explanation: "explanation",
  links: "links",
  wordLists: "word_list",
  sentenceLists: "sentence_list",
  topicIds: "topic_ids",
  verbIds: "verb_ids",
};
export const LESSON_FIELDS = Object.keys(COLUMNS);
const EMPTY = { level: null, labelIds: [], explanation: "", links: [], wordLists: [], sentenceLists: [], topicIds: [], verbIds: [] };

const p = (key, vars) => ({ key: `pr.${key}`, vars });

/** A lessons row → the shape of the export and of changesets. */
export function lessonFromRow(row) {
  const lists = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  return {
    id: row.id,
    updatedAt: row.updated_at,
    laneId: row.lane_id,
    position: row.position,
    title: row.title,
    level: row.level || null,
    labelIds: row.label_ids || [],
    explanation: row.explanation || "",
    links: row.links || [],
    wordLists: lists(row.word_list),
    sentenceLists: lists(row.sentence_list),
    topicIds: row.topic_ids || [],
    verbIds: row.verb_ids || [],
  };
}

const ROW = "id, lane_id, position, title, level, label_ids, explanation, links, word_list, sentence_list, topic_ids, verb_ids, updated_at";

/** Lanes, lessons (sorted per lane) and labels, for checking and the export. */
export async function loadBoard() {
  const check = ({ data, error }) => {
    if (error) throw new Error(error.message);
    return data;
  };
  const [lanes, rows, labels, files] = await Promise.all([
    supabase.from("lesson_lanes").select("id, name, position").order("position").then(check),
    supabase.from("lessons").select(ROW).order("position").then(check),
    supabase.from("labels").select("id, name_nl, name_en").order("position").then(check),
    supabase.from("lesson_attachments").select("lesson_id, file_name").then(check),
  ]);
  const lessons = rows.map(lessonFromRow);
  lessons.forEach((l) => (l.attachments = files.filter((f) => f.lesson_id === l.id).map((f) => f.file_name)));
  return { lanes, lessons, labels };
}

const inLane = (board, laneId) => board.lessons.filter((l) => l.laneId === laneId).sort((a, b) => a.position - b.position);

/** Position after lesson `after` in a lane (null: at the top; undefined: at the bottom). */
function positionIn(board, laneId, after, movingId) {
  const list = inLane(board, laneId).filter((l) => l.id !== movingId);
  if (after === undefined) return positionBetween(list[list.length - 1]?.position, null);
  if (after === null) return positionBetween(null, list[0]?.position);
  const i = list.findIndex((l) => l.id === after);
  return positionBetween(list[i]?.position, list[i + 1]?.position);
}

/** Problems with a lesson's fields (all references must exist). */
function checkFields(lesson, board) {
  const out = [];
  const bad = (field, value) => out.push({ field, key: "val.unknown", vars: { value } });
  const missing = (field, id) => out.push({ field, key: "val.missingRef", vars: { id } });
  if (!String(lesson.title || "").trim()) out.push({ field: "title", key: "val.required" });
  if (lesson.level && !LEVELS.includes(lesson.level)) bad("level", lesson.level);
  const arr = (field) => {
    if (!Array.isArray(lesson[field])) {
      out.push({ field, key: "pr.notList" });
      return [];
    }
    return lesson[field];
  };
  arr("labelIds").forEach((id) => !board.labels.some((l) => l.id === id) && missing("labelIds", id));
  arr("topicIds").forEach((id) => !(id.startsWith("topic.") && getItem(id)) && missing("topicIds", id));
  arr("verbIds").forEach((id) => {
    const w = getItem(id);
    if (!(w?.partOfSpeech === "verb" && w.conjugation)) missing("verbIds", id);
  });
  arr("links").forEach((l) => {
    if (!l || typeof l.url !== "string" || !/^(https?:\/\/\S+|\/\S*)$/.test(l.url)) bad("links", JSON.stringify(l));
  });
  const recipe = (field, type, keys) =>
    arr(field).forEach((spec) => {
      if (!spec || typeof spec !== "object" || Array.isArray(spec)) return bad(field, JSON.stringify(spec));
      Object.keys(spec).forEach((k) => !keys.includes(k) && bad(field, k));
      if (spec.set && getSet(spec.set)?.type !== type) missing(field, spec.set);
      if (spec.theme && !THEMES.includes(spec.theme)) bad(field, spec.theme);
      if (spec.level && !LEVELS.includes(spec.level)) bad(field, spec.level);
      if (spec.partOfSpeech && !WORD_POS.includes(spec.partOfSpeech)) bad(field, spec.partOfSpeech);
      if (spec.grammarTag && !GRAMMAR_TAGS.includes(spec.grammarTag)) bad(field, spec.grammarTag);
      if (!spec.set && !spec.theme && !spec.level && !spec.partOfSpeech && !spec.grammarTag) out.push({ field, key: "pr.emptyList" });
    });
  recipe("wordLists", "word", ["set", "theme", "partOfSpeech", "level", "upTo"]);
  recipe("sentenceLists", "sentence", ["set", "theme", "grammarTag", "level", "upTo"]);
  return out;
}

/** What a lesson change would do: { before, after, problems, conflict, laneId, position }. */
export function evaluateLesson(change, board) {
  const problems = [];
  if (!board) return { before: null, after: null, problems: [p("boardLoading")], conflict: false };
  const lane = (id) => board.lanes.find((l) => l.id === id);
  const patchKeys = Object.keys(change.data || {});
  patchKeys.filter((k) => !LESSON_FIELDS.includes(k)).forEach((k) => problems.push(p("unknownField", { field: k })));

  let before = null;
  let base = { ...EMPTY };
  if (change.op === "lesson.update") {
    before = board.lessons.find((l) => l.id === change.id) || null;
    if (!before) return { before, after: null, problems: [p("missing", { id: change.id })], conflict: false };
    base = before;
  }
  const after = { ...base };
  patchKeys.filter((k) => LESSON_FIELDS.includes(k)).forEach((k) => {
    after[k] = change.data[k] === null ? EMPTY[k] ?? null : change.data[k];
  });

  // Where on the board: a lane and a place in it.
  const moves = change.op === "lesson.add" || "lane" in change || "after" in change;
  after.laneId = change.lane || base.laneId || null;
  if (!after.laneId || !lane(after.laneId)) problems.push(p("laneMissing", { id: change.lane || "—" }));
  else if (moves) {
    if (change.after && !inLane(board, after.laneId).some((l) => l.id === change.after && l.id !== change.id)) {
      problems.push(p("afterMissing", { id: change.after }));
    }
    after.position = positionIn(board, after.laneId, "after" in change ? change.after : undefined, change.id);
  }
  after.laneName = lane(after.laneId)?.name;
  after.afterTitle = change.after ? board.lessons.find((l) => l.id === change.after)?.title : null;

  problems.push(...checkFields(after, board));
  const conflict = Boolean(
    before && change.baseVersion && new Date(before.updatedAt) > new Date(change.baseVersion)
  );
  return { before, after, problems, conflict, moves };
}

/** Write a lesson change; returns the saved row. */
export function applyLesson(change, { after, moves }) {
  const row = {};
  const keys = change.op === "lesson.add" ? LESSON_FIELDS : Object.keys(change.data || {});
  keys.forEach((k) => {
    const v = after[k];
    row[COLUMNS[k]] = (k === "wordLists" || k === "sentenceLists") && !v?.length ? null : v;
  });
  if (moves) {
    row.lane_id = after.laneId;
    row.position = after.position;
  }
  return change.op === "lesson.add" ? createLesson(row) : updateLesson(change.id, row);
}
