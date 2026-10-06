/**
 * Feedback store — localStorage-based, no backend.
 *
 * Feedback entries are keyed by a generated id and reference the content item
 * they belong to (itemType + itemId + a human-readable itemLabel), so the
 * exported JSON is meaningful to the teacher and to ChatGPT during review.
 *
 * An entry with itemType "app" is general feedback about the application
 * itself rather than a specific piece of content.
 */

const STORAGE_KEY = "nts-feedback-v1";

/** Feedback categories shown in the dialog. */
export const FEEDBACK_CATEGORIES = [
  { value: "taalfout", label: "Taalfout" },
  { value: "verkeerd-niveau", label: "Verkeerd niveau" },
  { value: "te-moeilijk", label: "Te moeilijk" },
  { value: "te-makkelijk", label: "Te makkelijk" },
  { value: "vertaling", label: "Vertaling klopt niet" },
  { value: "tag-metadata", label: "Tag / metadata" },
  { value: "app", label: "Over de app" },
  { value: "overig", label: "Overig" },
];

export const CATEGORY_LABELS = Object.fromEntries(
  FEEDBACK_CATEGORIES.map((c) => [c.value, c.label])
);

const NAME_KEY = "nts-feedback-name-v1";

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** The reviewer's name is remembered so it doesn't have to be re-typed. */
export function getReviewerName() {
  return localStorage.getItem(NAME_KEY) || "";
}

export function setReviewerName(name) {
  localStorage.setItem(NAME_KEY, name.trim());
  window.dispatchEvent(new Event("nts-feedback-changed"));
}

function write(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  // Notify listeners in the same tab (storage event only fires cross-tab)
  window.dispatchEvent(new Event("nts-feedback-changed"));
}

export function getAllFeedback() {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getFeedbackForItem(itemId) {
  return read().filter((f) => f.itemId === itemId);
}

export function addFeedback({ itemType, itemId, itemLabel, category, message }) {
  const entries = read();
  const entry = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "fb-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    author: getReviewerName() || null,
    itemType,
    itemId: itemId || null,
    itemLabel: itemLabel || null,
    category,
    message: message.trim(),
    createdAt: Date.now(),
  };
  entries.push(entry);
  write(entries);
  return entry;
}

export function deleteFeedback(id) {
  write(read().filter((f) => f.id !== id));
}

export function clearAllFeedback() {
  write([]);
}

/**
 * Import feedback from an exported JSON string.
 * Merges by entry id: existing ids are skipped, new ones are added.
 * Returns { added, skipped, total } or throws on invalid input.
 */
export function importFeedbackJson(jsonText) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Dit is geen geldig JSON-bestand.");
  }

  // Accept either our export shape ({ feedback: [...] }) or a bare array.
  const incoming = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.feedback)
      ? parsed.feedback
      : null;

  if (!incoming) {
    throw new Error("Geen feedback gevonden in dit bestand.");
  }

  const existing = read();
  const existingIds = new Set(existing.map((f) => f.id));

  let added = 0;
  let skipped = 0;

  incoming.forEach((raw) => {
    // Minimal validation: an entry needs a message to be useful.
    if (!raw || typeof raw.message !== "string" || !raw.message.trim()) {
      skipped++;
      return;
    }
    const id =
      raw.id && !existingIds.has(raw.id)
        ? raw.id
        : raw.id && existingIds.has(raw.id)
          ? null
          : "fb-import-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

    if (id === null) {
      skipped++; // duplicate id already present
      return;
    }

    existing.push({
      id,
      author: raw.author ?? null,
      itemType: raw.itemType ?? "overig",
      itemId: raw.itemId ?? null,
      itemLabel: raw.itemLabel ?? null,
      category: raw.category ?? "overig",
      message: raw.message.trim(),
      createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
    });
    existingIds.add(id);
    added++;
  });

  write(existing);
  return { added, skipped, total: incoming.length };
}

/**
 * Export all feedback as a formatted JSON string, ready to download and share.
 */
export function exportFeedbackJson() {
  const payload = {
    exportedAt: new Date().toISOString(),
    appVersion: "nts-v2",
    reviewer: getReviewerName() || null,
    count: read().length,
    feedback: getAllFeedback().map((f) => ({
      ...f,
      createdAtISO: new Date(f.createdAt).toISOString(),
    })),
  };
  return JSON.stringify(payload, null, 2);
}
