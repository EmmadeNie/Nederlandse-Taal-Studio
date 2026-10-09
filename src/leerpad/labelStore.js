/**
 * Lesson labels: { id, name_nl, name_en, color, position }. Loaded once and
 * shared by every board; the docent's edits update the shared list.
 */
import { useSyncExternalStore } from "react";
import { supabase } from "../lib/supabase";

export const LABEL_COLORS = ["gray", "blue", "green", "yellow", "orange", "red", "purple", "pink", "teal"];

const FIELDS = "id, name_nl, name_en, color, position";

let labels = [];
let loading = null;
const listeners = new Set();

function set(next) {
  labels = [...next].sort((a, b) => a.position - b.position);
  listeners.forEach((fn) => fn());
}

function check({ data, error }) {
  if (error?.code === "23505") throw new Error("labels.err.exists");
  if (error) throw new Error(error.message);
  return data;
}

export function loadLabels({ force = false } = {}) {
  if (!loading || force) {
    loading = supabase
      .from("labels")
      .select(FIELDS)
      .order("position")
      .then(check)
      .then(set)
      .catch(() => {
        loading = null;
      });
  }
  return loading;
}

const subscribe = (fn) => {
  listeners.add(fn);
  loadLabels();
  return () => listeners.delete(fn);
};

/** All labels, in order. */
export const useLabels = () => useSyncExternalStore(subscribe, () => labels);

/** The label's name in the UI language (falls back to Dutch). */
export const labelName = (label, lang) => (lang === "en" && label.name_en.trim()) || label.name_nl;

export async function createLabel(name) {
  const row = await supabase
    .from("labels")
    .insert({
      name_nl: name,
      name_en: "",
      color: LABEL_COLORS[(labels.length + 1) % LABEL_COLORS.length],
      position: labels.length ? Math.max(...labels.map((l) => l.position)) + 1 : 1,
    })
    .select(FIELDS)
    .single()
    .then(check);
  set([...labels, row]);
  return row;
}

export async function updateLabel(id, patch) {
  const row = await supabase.from("labels").update(patch).eq("id", id).select(FIELDS).single().then(check);
  set(labels.map((l) => (l.id === id ? row : l)));
  return row;
}

export async function deleteLabel(id) {
  check(await supabase.from("labels").delete().eq("id", id));
  set(labels.filter((l) => l.id !== id));
}
