import { useSyncExternalStore } from "react";
import { resolvePath } from "../routes";

function subscribe(callback) {
  window.addEventListener("popstate", callback);
  window.addEventListener("nts-url-changed", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("nts-url-changed", callback);
  };
}

const getPath = () => window.location.pathname;

/** Current route: { pathname, page, param } (page/param are null for "/" or unknown paths). */
export function useRoute() {
  const pathname = useSyncExternalStore(subscribe, getPath, () => "/");
  const resolved = resolvePath(pathname);
  return { pathname, page: resolved?.page ?? null, param: resolved?.param ?? null };
}

/**
 * Go to a path. By default the query string (filters) is dropped and a
 * history entry is added; pass { replace: true } or { search } to change that.
 */
export function navigate(path, { replace = false, search = "" } = {}) {
  const url = path + (search ? (search.startsWith("?") ? search : `?${search}`) : "");
  if (url === window.location.pathname + window.location.search) return;
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  window.dispatchEvent(new Event("nts-url-changed"));
}
