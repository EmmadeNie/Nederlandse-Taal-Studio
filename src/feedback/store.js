/**
 * Feedback store — backed by the Supabase `feedback` table.
 *
 * Entries reference the content item they belong to (itemType + itemId + a
 * human-readable itemLabel), so the exported JSON is meaningful to the
 * teacher and to ChatGPT during review.
 *
 * An entry with itemType "app" is general feedback about the application
 * itself rather than a specific piece of content.
 *
 * What a user can see is decided by RLS: leerlingen see their own feedback,
 * docent and reviewers see everything. The store keeps an in-memory copy that
 * is refreshed after every write and on Realtime change events, so components
 * can read it synchronously via useSyncExternalStore (see useFeedback.js).
 */

import { supabase } from "../lib/supabase";

/**
 * Feedback categories shown in the dialog (labels: "fb.cat.<value>" in
 * src/i18n/messages.js). Keep in sync with the DB check constraint.
 */
export const FEEDBACK_CATEGORIES = [
  "taalfout",
  "verkeerd-niveau",
  "te-moeilijk",
  "te-makkelijk",
  "vertaling",
  "tag-metadata",
  "onduidelijk",
  "app",
  "overig",
];

/** Lessons get the categories that fit a lesson; everything else gets the full list. */
export const categoriesFor = (itemType) =>
  itemType === "lesson" || itemType === "zijpad"
    ? ["onduidelijk", "te-moeilijk", "te-makkelijk", "verkeerd-niveau", "taalfout", "overig"]
    : FEEDBACK_CATEGORIES;

const VALID_CATEGORIES = new Set(FEEDBACK_CATEGORIES);

// Old localStorage key, only read to offer a one-time migration.
const LEGACY_STORAGE_KEY = "nts-feedback-v1";

// ----- In-memory snapshot + subscriptions -----

const EMPTY = [];
let entries = EMPTY;
let currentUserId = null;
let channel = null;
const listeners = new Set();

function setEntries(next) {
  entries = next;
  listeners.forEach((l) => l());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Current snapshot, newest first. Stable reference between changes. */
export function getAllFeedback() {
  return entries;
}

function fromRow(row) {
  return {
    id: row.id,
    authorId: row.author_id,
    author: row.author_name || row.profile?.display_name || row.profile?.email || null,
    itemType: row.item_type,
    itemId: row.item_id,
    itemLabel: row.item_label,
    category: row.category,
    message: row.message,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function refreshFeedback() {
  const { data, error } = await supabase
    .from("feedback")
    .select("*, profile:profiles(display_name, email)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Feedback laden mislukt:", error.message);
    return;
  }
  setEntries(data.map(fromRow));
}

/** Called by AuthProvider after login: initial load + live updates. */
export function startFeedbackSync(userId) {
  if (currentUserId === userId && channel) return;
  stopFeedbackSync();
  currentUserId = userId;
  refreshFeedback();
  channel = supabase
    .channel("feedback-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "feedback" }, () =>
      refreshFeedback()
    )
    .subscribe();
}

/** Called on logout. */
export function stopFeedbackSync() {
  if (channel) supabase.removeChannel(channel);
  channel = null;
  currentUserId = null;
  setEntries(EMPTY);
}

// ----- Writes -----

export async function addFeedback({ itemType, itemId, itemLabel, category, message }) {
  const { error } = await supabase.from("feedback").insert({
    item_type: itemType,
    item_id: itemId || null,
    item_label: itemLabel || null,
    category,
    message: message.trim(),
  });
  if (error) throw new Error(error.message);
  await refreshFeedback();
}

export async function deleteFeedback(id) {
  const { error } = await supabase.from("feedback").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await refreshFeedback();
}

// ----- Import / export -----

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Insert raw entries in the old export shape. Duplicate ids are skipped, so
 * importing the same file twice is harmless.
 * keepAuthorNames stores the original author name per entry; RLS only allows
 * that for the docent. Without it the entries are attributed to the importer.
 * Returns { added, skipped, total }.
 */
async function importEntries(incoming, { keepAuthorNames }) {
  let skipped = 0;
  const rows = [];
  incoming.forEach((raw) => {
    // Minimal validation: an entry needs a message to be useful.
    if (!raw || typeof raw.message !== "string" || !raw.message.trim()) {
      skipped++;
      return;
    }
    rows.push({
      // Old ids were "fb-..." or crypto.randomUUID(); keep real UUIDs for dedupe.
      id: UUID_RE.test(raw.id ?? "") ? raw.id : crypto.randomUUID(),
      author_name: keepAuthorNames ? raw.author || "Onbekend" : null,
      item_type: raw.itemType ?? "overig",
      item_id: raw.itemId ?? null,
      item_label: raw.itemLabel ?? null,
      category: VALID_CATEGORIES.has(raw.category) ? raw.category : "overig",
      message: raw.message.trim(),
      created_at: new Date(
        typeof raw.createdAt === "number" ? raw.createdAt : Date.now()
      ).toISOString(),
    });
  });

  let added = 0;
  if (rows.length) {
    const { data, error } = await supabase
      .from("feedback")
      .upsert(rows, { onConflict: "id", ignoreDuplicates: true })
      .select("id");
    if (error) throw new Error(error.message);
    added = data.length;
    skipped += rows.length - added;
  }
  await refreshFeedback();
  return { added, skipped, total: incoming.length };
}

/** Import feedback from an exported JSON string (old file format). Docent only. */
export function importFeedbackJson(jsonText) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("fb.err.invalidJson");
  }

  // Accept either our export shape ({ feedback: [...] }) or a bare array.
  const incoming = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.feedback)
      ? parsed.feedback
      : null;

  if (!incoming) {
    throw new Error("fb.err.noFeedback");
  }
  return importEntries(incoming, { keepAuthorNames: true });
}

/** Feedback still sitting in this browser's localStorage from before accounts existed. */
export function getLegacyLocalFeedback() {
  try {
    return JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * Move old localStorage feedback into Supabase, then clear it locally.
 * Pass keepAuthorNames=true for the docent (entries may have been written by
 * several people on a shared device); otherwise they become the user's own.
 */
export async function migrateLegacyLocalFeedback({ keepAuthorNames = false } = {}) {
  const result = await importEntries(getLegacyLocalFeedback(), { keepAuthorNames });
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  return result;
}

/**
 * Export the feedback visible to this user as a formatted JSON string,
 * ready to download and share (e.g. with ChatGPT).
 */
export function exportFeedbackJson() {
  const payload = {
    exportedAt: new Date().toISOString(),
    appVersion: "nts-v2",
    count: entries.length,
    feedback: entries.map((f) => ({
      ...f,
      createdAtISO: new Date(f.createdAt).toISOString(),
    })),
  };
  return JSON.stringify(payload, null, 2);
}
