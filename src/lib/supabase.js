import { createClient } from "@supabase/supabase-js";
import { activitySessionId } from "./activitySession";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** False when .env.local is missing; the app then shows setup instructions. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

/**
 * Every request says which visit and page it comes from, so the activity_log
 * trigger can tie edits to the session (see *_activity_log.sql).
 */
function fetchWithContext(input, init = {}) {
  const headers = new Headers(init.headers);
  // Writes are something the user did; reads may be background polling.
  const method = (init.method || "GET").toUpperCase();
  headers.set("x-nts-session", activitySessionId({ touch: method !== "GET" && method !== "HEAD" }));
  headers.set("x-nts-path", window.location.pathname);
  return fetch(input, { ...init, headers });
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, { global: { fetch: fetchWithContext } })
  : null;
