/**
 * "Mijn flashcards": the lists someone added (table flashcard_decks), kept in
 * memory per person and shared by every component that shows an "add" button.
 * The docent can also manage a student's lists (klaarzetten), so everything is
 * keyed by profile id.
 */
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { supabase } from "../lib/supabase";

const FIELDS = "id, profile_id, source, title, created_at, done_at, done_kinds, added_by";
const decks = new Map(); // profile id → rows (missing until loaded)
const loading = new Map(); // profile id → promise
const listeners = new Set();
let version = 0;
const emit = () => {
  version += 1;
  listeners.forEach((fn) => fn());
};

function check({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

export function loadDecks(profileId, { force = false } = {}) {
  if (!profileId) return Promise.resolve([]);
  if (loading.has(profileId) && !force) return loading.get(profileId);
  const p = supabase
    .from("flashcard_decks")
    .select(FIELDS)
    .eq("profile_id", profileId)
    .order("created_at")
    .then(check)
    .then((rows) => {
      decks.set(profileId, rows);
      emit();
      return rows;
    })
    .catch((e) => {
      loading.delete(profileId);
      throw e;
    });
  loading.set(profileId, p);
  return p;
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** Someone's lists (null while loading). */
export function useDecks(profileId) {
  const get = useCallback(() => (profileId ? decks.get(profileId) ?? null : null), [profileId]);
  // Version in the snapshot key keeps React from caching a stale array.
  useSyncExternalStore(subscribe, () => version);
  useEffect(() => {
    if (profileId && !decks.has(profileId)) loadDecks(profileId).catch(() => {});
  }, [profileId]);
  return get();
}

/** Same list? Sources are small objects: compare their keys. */
export const sameSource = (a, b) => Object.keys({ ...a, ...b }).every((k) => a?.[k] === b?.[k]);

export const findDeck = (profileId, source) =>
  decks.get(profileId)?.find((d) => sameSource(d.source, source)) || null;

const replace = (profileId, fn) => {
  decks.set(profileId, fn(decks.get(profileId) || []));
  emit();
};

export async function addDeck(profileId, source, title) {
  const row = await supabase
    .from("flashcard_decks")
    .insert({ profile_id: profileId, source, title })
    .select(FIELDS)
    .single()
    .then(check);
  replace(profileId, (list) => [...list, row]);
  return row;
}

/** Set a list to done (or back to practising). */
export async function setDeckDone(deck, done) {
  const row = await supabase
    .from("flashcard_decks")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", deck.id)
    .select(FIELDS)
    .single()
    .then(check);
  replace(deck.profile_id, (list) => list.map((d) => (d.id === deck.id ? row : d)));
}

/**
 * Tick (or untick) one kind of practice on a list: "flashcards", "vervoegen",
 * "invullen". When every kind in `allKinds` is ticked, the list is afgerond
 * too; unticking one opens it again.
 */
export async function setDeckKindDone(deck, kind, done, allKinds) {
  const kinds = new Set(deck.done_kinds || []);
  if (done) kinds.add(kind);
  else kinds.delete(kind);
  const doneKinds = [...kinds];
  const allDone = allKinds.length > 0 && allKinds.every((k) => kinds.has(k));
  const patch = { done_kinds: doneKinds };
  if (allDone && !deck.done_at) patch.done_at = new Date().toISOString();
  if (!allDone && deck.done_at && !done) patch.done_at = null;
  const row = await supabase.from("flashcard_decks").update(patch).eq("id", deck.id).select(FIELDS).single().then(check);
  replace(deck.profile_id, (list) => list.map((d) => (d.id === deck.id ? row : d)));
  return row;
}

export async function removeDeck(deck) {
  await supabase.from("flashcard_decks").delete().eq("id", deck.id).then(check);
  replace(deck.profile_id, (list) => list.filter((d) => d.id !== deck.id));
}
