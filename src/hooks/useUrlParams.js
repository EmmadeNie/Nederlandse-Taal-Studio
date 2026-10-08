import { useCallback, useSyncExternalStore } from "react";

/**
 * Deep-link support via the URL query string, dependency-free.
 *
 * The URL is the single source of truth for which page is open and which
 * filters are active. A Trello card can link to e.g.
 *   https://app.example.com/?page=topics&topic=topic.de-het
 *   https://app.example.com/?page=sentences&grammar=perfectum&level=A2
 *   https://app.example.com/?page=words&theme=eten&level=A0
 *
 * Reading is reactive (components re-render on back/forward and on updates).
 */

function subscribe(callback) {
  window.addEventListener("popstate", callback);
  window.addEventListener("nts-url-changed", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("nts-url-changed", callback);
  };
}

function getSearchSnapshot() {
  return window.location.search;
}

/**
 * Returns the current query string reactively.
 */
function useSearchString() {
  return useSyncExternalStore(subscribe, getSearchSnapshot, () => "");
}

/**
 * Read all current URL params as a plain object.
 */
export function useUrlParams() {
  const search = useSearchString();
  const params = new URLSearchParams(search);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

/**
 * Returns a setter that merges the given params into the URL.
 * Pass a value of null/undefined/"" to remove a param.
 * Uses replaceState by default (no history spam from filter changes);
 * pass { push: true } to add a history entry (e.g. page navigation).
 */
export function useSetUrlParams() {
  return useCallback((updates, { push = false } = {}) => {
    const params = new URLSearchParams(window.location.search);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const qs = params.toString();
    const newUrl =
      window.location.pathname + (qs ? "?" + qs : "") + window.location.hash;
    if (push) {
      window.history.pushState(null, "", newUrl);
    } else {
      window.history.replaceState(null, "", newUrl);
    }
    window.dispatchEvent(new Event("nts-url-changed"));
  }, []);
}

/**
 * Build an absolute deep-link URL from a params object (for "copy link").
 */
export function buildDeepLink(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") search.set(k, v);
  });
  const qs = search.toString();
  return (
    window.location.origin + window.location.pathname + (qs ? "?" + qs : "")
  );
}
