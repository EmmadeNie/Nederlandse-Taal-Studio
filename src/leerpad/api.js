/**
 * Data access for the lesprogramma (master board) and leerpaden (student boards).
 * Permissions are enforced by RLS; see supabase/migrations/*_lesprogramma_and_leerpad.sql.
 */
import { supabase } from "../lib/supabase";

function check({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

const LESSON_FIELDS = "id, lane_id, position, title, level, categories, explanation, links";

/** Position for a card dropped between two neighbours (either may be missing). */
export function positionBetween(before, after) {
  if (before == null && after == null) return 1;
  if (before == null) return after - 1;
  if (after == null) return before + 1;
  return (before + after) / 2;
}

const nextPosition = (items) =>
  items.length ? Math.max(...items.map((i) => i.position)) + 1 : 1;

// ----- Lesprogramma -----

export async function loadProgram() {
  const [lanes, lessons] = await Promise.all([
    supabase.from("lesson_lanes").select("id, name, position").order("position").then(check),
    supabase.from("lessons").select(LESSON_FIELDS).order("position").then(check),
  ]);
  return { lanes, lessons };
}

export const createLessonLane = (name, lanes) =>
  supabase
    .from("lesson_lanes")
    .insert({ name, position: nextPosition(lanes) })
    .select("id, name, position")
    .single()
    .then(check);

export const renameLessonLane = (id, name) =>
  supabase.from("lesson_lanes").update({ name }).eq("id", id).then(check);

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
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error?.code === "23503") {
    throw new Error("Deze les staat nog op een leerpad. Haal hem daar eerst af.");
  }
  if (error) throw new Error(error.message);
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
    .select("id, display_name, email")
    .eq("role", "leerling")
    .order("display_name")
    .then(check);

export const ensureLeerpad = (studentId) =>
  supabase.rpc("ensure_leerpad_lanes", { student: studentId }).then(check);

export async function loadLeerpad(studentId, { withNotes = false } = {}) {
  const [lanes, steps] = await Promise.all([
    supabase
      .from("leerpad_lanes")
      .select("id, name, position")
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
    .select("id, name, position")
    .single()
    .then(check);

export const renameLeerpadLane = (id, name) =>
  supabase.from("leerpad_lanes").update({ name }).eq("id", id).then(check);

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
    throw new Error("Deze les staat al op dit leerpad.");
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
