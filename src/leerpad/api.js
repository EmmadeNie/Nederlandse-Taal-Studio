/**
 * Data access for the lesprogramma (master board) and leerpaden (student boards).
 * Permissions are enforced by RLS; see supabase/migrations/*_lesprogramma_and_leerpad.sql.
 */
import { supabase } from "../lib/supabase";
import { removeStoredFiles } from "./files";
import { LEVELS } from "../data/schema.js";

function check({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

const LESSON_FIELDS =
  "id, lane_id, position, title, level, label_ids, explanation, links, word_list, sentence_list, topic_ids, verb_ids, " +
  "attachments:lesson_attachments(id, file_name, mime_type, size_bytes, storage_path, created_at)";

export { positionBetween } from "./positions";

const nextPosition = (items) =>
  items.length ? Math.max(...items.map((i) => i.position)) + 1 : 1;

// ----- Lesprogramma -----

export async function loadProgram() {
  const [lanes, lessons] = await Promise.all([
    supabase.from("lesson_lanes").select("id, name, position, is_focus").order("position").then(check),
    supabase.from("lessons").select(LESSON_FIELDS).order("position").then(check),
  ]);
  return { lanes, lessons };
}

export const createLessonLane = (name, lanes) =>
  supabase
    .from("lesson_lanes")
    .insert({ name, position: nextPosition(lanes) })
    .select("id, name, position, is_focus")
    .single()
    .then(check);

export const renameLessonLane = (id, name) =>
  supabase.from("lesson_lanes").update({ name }).eq("id", id).then(check);

export const moveLessonLane = (id, position) =>
  supabase.from("lesson_lanes").update({ position }).eq("id", id).then(check);

/** Make a lane the board's middle lane (null: none). One per board, so clear first. */
export async function setFocusLessonLane(laneId) {
  await supabase.from("lesson_lanes").update({ is_focus: false }).eq("is_focus", true).then(check);
  if (laneId) await supabase.from("lesson_lanes").update({ is_focus: true }).eq("id", laneId).then(check);
}

export const deleteLessonLane = (id) =>
  supabase.from("lesson_lanes").delete().eq("id", id).then(check);

export const createLesson = (fields) =>
  supabase.from("lessons").insert(fields).select(LESSON_FIELDS).single().then(check);

export const updateLesson = (id, patch) =>
  supabase
    .from("lessons")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(LESSON_FIELDS)
    .single()
    .then(check);

export async function deleteLesson(id) {
  // Remember the stored files; their rows go with the lesson (cascade).
  const files = await supabase
    .from("lesson_attachments")
    .select("storage_path")
    .eq("lesson_id", id)
    .then(check);
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error?.code === "23503") {
    throw new Error("lp.err.lessonInUse");
  }
  if (error) throw new Error(error.message);
  await removeStoredFiles(files.map((f) => f.storage_path));
}

/** Students that have this lesson on their leerpad: [{ id, name }]. */
export async function studentsWithLesson(lessonId) {
  const rows = await supabase
    .from("steps")
    .select("student_id, student:profiles(display_name, email)")
    .eq("lesson_id", lessonId)
    .then(check);
  return rows.map((r) => ({
    id: r.student_id,
    name: r.student?.display_name || r.student?.email || "Onbekend",
  }));
}

// ----- Leerpaden -----

export const listStudents = () =>
  supabase
    .from("profiles")
    .select("id, user_id, display_name, email, invite_code")
    .eq("role", "leerling")
    .order("display_name")
    .then(check);

export const ensureLeerpad = (studentId) =>
  supabase.rpc("ensure_leerpad_lanes", { student: studentId }).then(check);

export async function loadLeerpad(studentId, { withNotes = false } = {}) {
  const [lanes, steps] = await Promise.all([
    supabase
      .from("leerpad_lanes")
      .select("id, name, position, is_focus")
      .eq("student_id", studentId)
      .order("position")
      .then(check),
    supabase
      .from("steps")
      .select(`*, lesson:lessons(${LESSON_FIELDS})`)
      .eq("student_id", studentId)
      .order("position")
      .then(check),
  ]);
  let notes = {};
  if (withNotes && steps.length) {
    const rows = await supabase
      .from("step_notes")
      .select("step_id, note")
      .in("step_id", steps.map((s) => s.id))
      .then(check);
    notes = Object.fromEntries(rows.map((r) => [r.step_id, r.note]));
  }
  return { lanes, steps, notes };
}

export const createLeerpadLane = (studentId, name, lanes) =>
  supabase
    .from("leerpad_lanes")
    .insert({ student_id: studentId, name, position: nextPosition(lanes) })
    .select("id, name, position, is_focus")
    .single()
    .then(check);

export const renameLeerpadLane = (id, name) =>
  supabase.from("leerpad_lanes").update({ name }).eq("id", id).then(check);

export const moveLeerpadLane = (id, position) =>
  supabase.from("leerpad_lanes").update({ position }).eq("id", id).then(check);

export async function setFocusLeerpadLane(studentId, laneId) {
  await supabase.from("leerpad_lanes").update({ is_focus: false }).eq("student_id", studentId).eq("is_focus", true).then(check);
  if (laneId) await supabase.from("leerpad_lanes").update({ is_focus: true }).eq("id", laneId).then(check);
}

export const deleteLeerpadLane = (id) =>
  supabase.from("leerpad_lanes").delete().eq("id", id).then(check);

export const moveStep = (id, laneId, position) =>
  supabase.rpc("move_step", { step: id, to_lane: laneId, new_position: position }).then(check);

export const createStep = (fields) =>
  supabase
    .from("steps")
    .insert(fields)
    .select(`*, lesson:lessons(${LESSON_FIELDS})`)
    .single()
    .then(check);

export const updateStep = (id, patch) =>
  supabase.from("steps").update(patch).eq("id", id).then(check);

export const deleteStep = (id) => supabase.from("steps").delete().eq("id", id).then(check);

export const setStepStatus = (id, status) =>
  supabase.rpc("set_step_status", { step: id, new_status: status }).then(check);

export const saveStepNote = (stepId, note) =>
  supabase
    .from("step_notes")
    .upsert({ step_id: stepId, note, updated_at: new Date().toISOString() })
    .then(check);

/** Put a lesson on a student's leerpad, in their first lane. */
export async function planLesson(lessonId, studentId) {
  await ensureLeerpad(studentId);
  const { lanes, steps } = await loadLeerpad(studentId);
  if (steps.some((s) => s.lesson_id === lessonId)) {
    throw new Error("lp.err.alreadyPlanned");
  }
  const lane = lanes[0];
  const inLane = steps.filter((s) => s.lane_id === lane.id);
  return createStep({
    student_id: studentId,
    lane_id: lane.id,
    lesson_id: lessonId,
    position: nextPosition(inLane),
  });
}

/** The lanes of a leerpad, creating the default ones if it doesn't have any yet. */
export async function leerpadLanes(studentId) {
  await ensureLeerpad(studentId);
  return supabase
    .from("leerpad_lanes")
    .select("id, name, position, is_focus")
    .eq("student_id", studentId)
    .order("position")
    .then(check);
}

/**
 * Put several lessons on a leerpad at the end of one lane, in the given order.
 * Lessons already on that leerpad are skipped. Returns { added, skipped }.
 */
/** Ids of the lessons that are on a student's leerpad already. */
export const plannedLessonIds = (studentId) =>
  supabase
    .from("steps")
    .select("lesson_id")
    .eq("student_id", studentId)
    .not("lesson_id", "is", null)
    .then(check)
    .then((rows) => new Set(rows.map((r) => r.lesson_id)));

/**
 * Put lessons on a student's leerpad, at the bottom of a lane. With levelOf
 * (lessonId → "A1" | null), each lesson goes to the lane named after its level
 * (made when missing); lessons without a level go to laneId.
 */
export async function planLessons(lessonIds, studentId, laneId, { levelOf } = {}) {
  await ensureLeerpad(studentId);
  const { lanes, steps } = await loadLeerpad(studentId);
  const fallback = lanes.find((l) => l.id === laneId) || lanes[0];
  const planned = new Set(steps.map((s) => s.lesson_id).filter(Boolean));
  const todo = lessonIds.filter((id) => !planned.has(id));

  // Missing level lanes are made first, A0 → B2, so they stand in level order.
  const allLanes = [...lanes];
  const named = (level) => allLanes.find((l) => l.name.trim().toUpperCase() === level);
  const needed = LEVELS.filter((lv) => todo.some((id) => levelOf?.(id) === lv));
  for (const level of needed) {
    if (!named(level)) allLanes.push(await createLeerpadLane(studentId, level, allLanes));
  }
  const laneFor = (lessonId) => named(levelOf?.(lessonId)) || fallback;

  const rows = [];
  const next = {}; // next position per lane
  for (const id of todo) {
    const lane = laneFor(id);
    next[lane.id] ??= nextPosition(steps.filter((s) => s.lane_id === lane.id));
    rows.push({ student_id: studentId, lane_id: lane.id, lesson_id: id, position: next[lane.id]++ });
  }
  if (rows.length) await supabase.from("steps").insert(rows).then(check);
  const used = [...new Set(rows.map((r) => allLanes.find((l) => l.id === r.lane_id)?.name))];
  return { added: rows.length, skipped: lessonIds.length - todo.length, lanes: used };
}
