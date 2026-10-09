import { useCallback, useRef, useState } from "react";

/**
 * Save-as-you-go for the lesson and step dialogs. save(fn) runs fn after
 * the saves before it (so they never overtake each other) and tracks the
 * status for <SaveStatus>. Resolves to true on success, false on failure.
 */
export function useAutosave() {
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const [error, setError] = useState(null);
  const queue = useRef(Promise.resolve(true));

  const save = useCallback((fn) => {
    setStatus("saving");
    setError(null);
    queue.current = queue.current.then(async () => {
      try {
        await fn();
        setStatus("saved");
        return true;
      } catch (e) {
        setStatus("error");
        setError(e.message);
        return false;
      }
    });
    return queue.current;
  }, []);

  /** Wait for the saves in flight; true when the last one succeeded. */
  const settled = useCallback(() => queue.current, []);

  return { save, settled, status, error };
}
