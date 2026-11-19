// After a deploy, a tab that stays open keeps running the old code. Now and
// then (when the tab comes back into view, and every 15 minutes) we look at
// which app bundle the site serves; when it is newer than ours, the page
// reloads on the next page change, when nothing typed on a page is lost.
// The tour remembers its step, so it carries on after the reload.

const CHECK_EVERY = 15 * 60 * 1000;
const RELOADED_KEY = "nts-reloaded-for";

const bundleIn = (html) => html.match(/\/assets\/index-[\w-]+\.js/)?.[0] ?? null;
const ours = () => document.querySelector('script[type="module"][src*="/assets/index-"]')?.getAttribute("src") ?? null;

export function watchForNewVersion() {
  const current = ours();
  if (!current) return; // dev server: no built bundle to compare
  let newer = null;
  let lastCheck = 0;

  const check = async () => {
    if (newer || Date.now() - lastCheck < 60 * 1000) return;
    lastCheck = Date.now();
    try {
      const res = await fetch("/", { cache: "no-store" });
      const latest = res.ok ? bundleIn(await res.text()) : null;
      if (!latest || latest === current) return;
      // Reloaded for this version already and still old (e.g. a cache): don't loop.
      if (sessionStorage.getItem(RELOADED_KEY) === latest) return;
      newer = latest;
    } catch {
      // offline or private mode: try again next time
    }
  };

  let path = window.location.pathname;
  const onRoute = () => {
    if (window.location.pathname === path) return; // only filters changed
    path = window.location.pathname;
    if (!newer) return;
    try {
      sessionStorage.setItem(RELOADED_KEY, newer);
    } catch {
      return; // without the guard a stale cache could reload on every page change
    }
    window.location.reload();
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") check();
  });
  setInterval(() => document.visibilityState === "visible" && check(), CHECK_EVERY);
  window.addEventListener("popstate", onRoute);
  window.addEventListener("nts-url-changed", onRoute);
}
