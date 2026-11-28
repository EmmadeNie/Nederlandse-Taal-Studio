/**
 * The visit ("session") that activity events and edits belong to.
 *
 * One per browser tab (sessionStorage); after 30 minutes without activity a
 * new one starts. Kept apart from activity.js so supabase.js can use it
 * without an import cycle.
 */

const KEY = "nts-activity-session";
const IDLE_MS = 30 * 60 * 1000;

let memory = null; // fallback when sessionStorage is not available

function read() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY)) || memory;
  } catch {
    return memory;
  }
}

function write(s) {
  memory = s;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // private mode / storage full: the in-memory copy is enough
  }
}

function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  // Old browsers: a random v4-shaped uuid.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * The current session id; starts a new session after a long pause.
 * `touch: false` (background reads, polling) does not keep the session alive.
 */
export function activitySessionId({ touch = true } = {}) {
  const now = Date.now();
  let s = read();
  if (!s?.id || (touch && now - (s.lastAt || 0) > IDLE_MS)) s = { id: newId(), lastAt: now };
  else if (touch) s = { ...s, lastAt: now };
  else return s.id;
  write(s);
  return s.id;
}
