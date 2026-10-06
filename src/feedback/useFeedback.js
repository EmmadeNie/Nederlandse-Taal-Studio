import { useSyncExternalStore } from "react";
import { getAllFeedback } from "./store";

function subscribe(callback) {
  window.addEventListener("nts-feedback-changed", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("nts-feedback-changed", callback);
    window.removeEventListener("storage", callback);
  };
}

// Cache so getSnapshot returns a stable reference between changes
let cache = null;
let cacheRaw = null;
function getSnapshot() {
  const raw = localStorage.getItem("nts-feedback-v1") || "[]";
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cache = getAllFeedback();
  }
  return cache;
}

/**
 * Live list of all feedback entries. Re-renders when feedback changes
 * (same tab via custom event, other tabs via storage event).
 */
export function useAllFeedback() {
  return useSyncExternalStore(subscribe, getSnapshot, () => []);
}

/** Count of feedback for a single item (for the badge on the button). */
export function useFeedbackCount(itemId) {
  const all = useAllFeedback();
  return all.filter((f) => f.itemId === itemId).length;
}
