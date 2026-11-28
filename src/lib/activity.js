/**
 * Activity log: what logged-in users do in the app, for later dashboards.
 *
 *   track("lesson_open", { targetType: "lesson", targetId: id, data: { from: "leerpad" } })
 *
 * Events go into public.activity_log (see *_activity_log.sql), in batches every
 * few seconds and when the tab is hidden or closed. Edits are logged by the
 * database itself; this file is for views and clicks.
 *
 * Only for logged-in users: events wait until the login is known and are
 * dropped for visitors without an account.
 */
import { supabaseKey, supabaseUrl } from "./supabase";
import { activitySessionId } from "./activitySession";
import { resolvePath } from "../routes";

const FLUSH_MS = 5000;
const BATCH = 50; // keepalive requests may carry at most 64 KB
const MAX_QUEUE = 500;

let auth = "unknown"; // "unknown" | "in" | "out"
let token = null;
let queue = [];
let timer = null;
let announced = null; // session id that has its app_open in this page load (a reload logs a new one)

const enabled = () => Boolean(supabaseUrl && supabaseKey) && typeof window !== "undefined";

/** Called by the AuthProvider whenever the login changes (also on token refresh). */
export function setActivityAuth(session) {
  const before = auth;
  token = session?.access_token ?? null;
  auth = token ? "in" : "out";
  if (auth === "out") {
    queue = [];
    announced = null;
    return;
  }
  if (before === "out") {
    // Logged in without a page load (code typed in): log it and the page they are on.
    track("sign_in");
    lastPath = null;
    if (started) onUrl();
  }
  schedule();
}

/** Log one event. `data` is a small plain object (it ends up as jsonb). */
export function track(event, { targetType = null, targetId = null, data = null, path } = {}) {
  if (!enabled() || auth === "out") return;
  const sessionId = activitySessionId();
  if (sessionId !== announced) {
    announced = sessionId;
    queue.push(row("app_open", sessionId, { data: visitInfo() }));
  }
  queue.push(row(event, sessionId, { targetType, targetId, data, path }));
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
  schedule();
}

function row(event, sessionId, { targetType = null, targetId = null, data = null, path }) {
  return {
    source: "app",
    event,
    session_id: sessionId,
    client_at: new Date().toISOString(),
    target_type: targetType,
    target_id: targetId == null ? null : String(targetId),
    path: path || window.location.pathname,
    data: clean(data),
  };
}

/** The query string without login secrets (?token_hash=… from a login link). */
function safeQuery(search) {
  if (!search) return undefined;
  const params = new URLSearchParams(search);
  for (const k of [...params.keys()]) if (/token|^code$/i.test(k)) params.delete(k);
  const out = params.toString();
  return out ? `?${out}` : undefined;
}

// Leave out empty values so rows stay small.
function clean(data) {
  if (!data) return null;
  const out = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== ""));
  return Object.keys(out).length ? out : null;
}

/** Where a visit comes from: referrer, utm tags (from the videos), device. */
function visitInfo() {
  const params = new URLSearchParams(window.location.search);
  const utm = Object.fromEntries([...params].filter(([k]) => k.startsWith("utm_")));
  let referrer = null;
  try {
    const ref = document.referrer && new URL(document.referrer);
    if (ref && ref.host !== window.location.host) referrer = ref.host;
  } catch {
    // not a valid URL
  }
  return {
    referrer,
    ...utm,
    width: window.innerWidth,
    standalone: window.matchMedia?.("(display-mode: standalone)").matches || undefined,
    browser_lang: navigator.language,
  };
}

function schedule() {
  if (auth !== "in" || !queue.length || timer) return;
  timer = setTimeout(() => {
    timer = null;
    flushActivity();
  }, FLUSH_MS);
}

/** Send what is waiting now (also used right before signing out). */
export function flushActivity() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (auth !== "in" || !queue.length) return Promise.resolve();
  const sends = [];
  while (queue.length) sends.push(send(queue.splice(0, BATCH)));
  return Promise.all(sends);
}

async function send(rows) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/activity_log`, {
      method: "POST",
      keepalive: true, // still arrives when the tab closes
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(rows),
    });
    // Server errors: try again later. Refused (4xx): drop, it will not get better.
    if (res.status >= 500) requeue(rows);
  } catch {
    requeue(rows); // offline
  }
}

function requeue(rows) {
  queue = [...rows, ...queue].slice(-MAX_QUEUE);
  schedule();
}

// ---------------------------------------------------------------------------
// Automatic events: page views, filter changes, the tab going away and back.

let started = false;
let lastPath = null;
let lastSearch = null;
let filterTimer = null;
let pendingFilter = null;

function sendFilter() {
  clearTimeout(filterTimer);
  const f = pendingFilter;
  pendingFilter = null;
  if (!f) return;
  const route = resolvePath(f.pathname);
  track("filter", { targetType: "page", targetId: route?.page ?? null, path: f.pathname, data: { query: safeQuery(f.search) } });
}

function onUrl() {
  const { pathname, search } = window.location;
  if (pathname !== lastPath) {
    sendFilter(); // a search typed just before moving on still counts
    lastPath = pathname;
    lastSearch = search;
    const route = resolvePath(pathname);
    track("page_view", {
      targetType: "page",
      targetId: route?.page ?? (pathname === "/" ? "home" : null),
      data: { param: route?.param, query: safeQuery(search) },
    });
  } else if (search !== lastSearch) {
    // Filters live in the query string; wait until someone stops typing.
    lastSearch = search;
    clearTimeout(filterTimer);
    pendingFilter = { pathname, search };
    filterTimer = setTimeout(sendFilter, 1500);
  }
}

function onVisibility() {
  if (document.visibilityState === "hidden") {
    sendFilter();
    track("app_hide");
    flushActivity();
  } else {
    track("app_show");
  }
}

/** Start the automatic events once, at app start. */
export function startActivityTracking() {
  if (started || !enabled()) return;
  started = true;
  window.addEventListener("popstate", onUrl);
  window.addEventListener("nts-url-changed", onUrl);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", () => flushActivity());
  onUrl();
}
