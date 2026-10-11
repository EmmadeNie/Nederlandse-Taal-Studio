/**
 * "Mijn flashcards": the lists someone added (table flashcard_decks), kept in
 * memory and shared by every component that shows an "add" button.
 */
import { useSyncExternalStore } from "react";
import { supabase } from "../lib/supabase";

const FIELDS = "id, source, title, created_at";
let decks = null; // null until loaded
let loading = null;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

function check({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

export function loadDecks({ force = false } = {}) {
  if (loading && !force) return loading;
  loading = supabase
    .from("flashcard_decks")
    .select(FIELDS)
    .order("created_at")
    .then(check)
    .then((rows) => {
      decks = rows;
      emit();
      return rows;
    })
    .catch((e) => {
      loading = null;
      throw e;
    });
  return loading;
}

const subscribe = (fn) => {
  listeners.add(fn);
  if (decks === null) loadDecks().catch(() => {});
  return () => listeners.delete(fn);
};

/** My decks (null while loading). */
export const useDecks = () => useSyncExternalStore(subscribe, () => decks);

/** Same list? Sources are small objects: compare their keys. */
export const sameSource = (a, b) =>
  Object.keys({ ...a, ...b }).every((k) => a?.[k] === b?.[k]);

export const findDeck = (source) => decks?.find((d) => sameSource(d.source, source)) || null;

export async function addDeck(source, title) {
  const row = await supabase.from("flashcard_decks").insert({ source, title }).select(FIELDS).single().then(check);
  decks = [...(decks || []), row];
  emit();
  return row;
}

export async function removeDeck(id) {
  await supabase.from("flashcard_decks").delete().eq("id", id).then(check);
  decks = (decks || []).filter((d) => d.id !== id);
  emit();
}
