import { useSyncExternalStore } from "react";
import { getAllFeedback, subscribe } from "./store";

/**
 * Live list of all feedback entries visible to the current user.
 * Re-renders when the store refreshes (after writes and on Realtime events).
 */
export function useAllFeedback() {
  return useSyncExternalStore(subscribe, getAllFeedback, getAllFeedback);
}

/** Count of feedback for a single item (for the badge on the button). */
export function useFeedbackCount(itemId) {
  const all = useAllFeedback();
  return all.filter((f) => f.itemId === itemId).length;
}
