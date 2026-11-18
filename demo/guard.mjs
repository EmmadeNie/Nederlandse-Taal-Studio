// Keeps the real data safe while we film.
//
// 1. readOnly(context): every write to Supabase (insert, update, delete, a
//    write RPC, a storage upload, an edge function, a sign-out) is answered by
//    a fake "ok" inside the browser and never reaches the database. Dragging a
//    card still looks right on screen, because the app updates its own state
//    first. Reads and the session refresh pass through.
// 2. snapshot / compare / restore: a copy of the student's board before
//    filming, checked again afterwards. If anything differs anyway, restore()
//    puts the old values back.
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { SUPABASE_URL, SUPABASE_ANON_KEY, AUTH_FILE, SNAPSHOT_DIR, STUDENT_NAME } from "./config.mjs";

/** RPCs that only read. Every other RPC is treated as a write. */
const READ_RPCS = new Set(["hidden_sentence_ids", "review_batches"]);

/** Stands in for a missing account, so a pending student looks signed up on screen. */
const FAKE_USER_ID = "00000000-0000-4000-8000-000000000000";

/** Paths that may POST: refreshing the login. Not /auth/v1/logout. */
const ALLOWED_POSTS = [/^\/auth\/v1\/token/];

export async function readOnly(context, { onBlocked = () => {}, rename = null, lang = null } = {}) {
  const blocked = [];
  await context.route(`${SUPABASE_URL}/**`, async (route) => {
    const req = route.request();
    const method = req.method();
    const url = new URL(req.url());
    const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/([a-z_]+)/)?.[1];

    const isRead = method === "GET" || (method === "POST" && rpc && READ_RPCS.has(rpc));
    // Data on its way to the screen: swap real names for made-up ones, and show
    // students without an account as signed up (no "(not signed in yet)").
    if (isRead && rename && url.pathname.startsWith("/rest/v1/")) {
      try {
        const res = await route.fetch();
        let body = rename(await res.text());
        if (url.pathname === "/rest/v1/profiles") {
          body = body.replace(/"user_id":null/g, `"user_id":"${FAKE_USER_ID}"`);
          // The profile's language wins over the browser's, so set it here for this recording.
          if (lang) body = body.replace(/"language":(null|"[a-z]+")/g, `"language":"${lang}"`);
        }
        return await route.fulfill({ response: res, body });
      } catch {
        // The page navigated away or the browser closed while this was in flight.
        return route.abort().catch(() => {});
      }
    }

    const passes =
      isRead ||
      ["HEAD", "OPTIONS"].includes(method) ||
      (method === "POST" && ALLOWED_POSTS.some((re) => re.test(url.pathname)));
    if (passes) return route.continue();

    const entry = { method, path: url.pathname + url.search, body: req.postData()?.slice(0, 300) };
    blocked.push(entry);
    onBlocked(entry);
    return route.fulfill(fakeResponse(req, rpc));
  });
  return blocked;
}

/** What PostgREST would have answered, so the app carries on as if it worked. */
function fakeResponse(req, rpc) {
  const headers = { "access-control-allow-origin": "*", "content-type": "application/json" };
  if (rpc) return { status: 200, headers, body: "null" };

  const prefer = req.headers()["prefer"] || "";
  const accept = req.headers()["accept"] || "";
  if (!prefer.includes("return=representation")) return { status: 204, headers };

  let body = {};
  try {
    body = JSON.parse(req.postData() || "{}");
  } catch {
    // not JSON (a file upload): answer with an empty object
  }
  const row = Array.isArray(body) ? body[0] ?? {} : body;
  const one = accept.includes("vnd.pgrst.object");
  return { status: 200, headers, body: JSON.stringify(one ? row : Array.isArray(body) ? body : [row]) };
}

/** A Supabase client logged in as the docent, from the saved Playwright login. */
export async function docentClient() {
  const state = JSON.parse(readFileSync(AUTH_FILE, "utf8"));
  const item = state.origins.flatMap((o) => o.localStorage).find((i) => /^sb-.*-auth-token$/.test(i.name));
  if (!item) throw new Error("No Supabase session in .auth/state.json. Run `npm run login` first.");
  const session = JSON.parse(item.value);
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false }, realtime: { transport: ws } });
  // A refresh hands out a new refresh token and retires the old one: write the
  // new session back, so the browser picks it up next time.
  client.auth.onAuthStateChange((event, next) => {
    if (event !== "TOKEN_REFRESHED" || !next) return;
    item.value = JSON.stringify(next);
    writeFileSync(AUTH_FILE, JSON.stringify(state, null, 2));
  });
  const { error } = await client.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
  if (error) throw new Error(`Saved login no longer works (${error.message}). Run \`npm run login\` again.`);
  return client;
}

/** Keeps the browser's (possibly refreshed) login for the next run. */
export const saveLogin = (context) => context.storageState({ path: AUTH_FILE });

const ok = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Looks up each student in ALIASES and returns a function that replaces their
 * full name, first name, last name(s) and e-mail address in a piece of text
 * (a JSON response) with the made-up name. Longest matches go first, so
 * "Jan de Vries" becomes the made-up full name, not made-up first name + "de Vries".
 */
export async function buildRename(client, aliases) {
  const pairs = [];
  for (const [first, alias] of Object.entries(aliases)) {
    const rows = ok(await client.from("profiles").select("display_name, email").ilike("display_name", `${first}%`));
    if (rows.length !== 1) throw new Error(`Expected one student whose name starts with "${first}", found ${rows.length}`);
    const { display_name: real, email } = rows[0];
    const [aFirst, ...aRest] = alias.split(" ");
    const [rFirst, ...rRest] = real.trim().split(/\s+/);
    pairs.push([real.trim(), alias], [rFirst, aFirst]);
    if (rRest.length) pairs.push([rRest.join(" "), aRest.join(" ") || aFirst]);
    if (email) pairs.push([email, `${aFirst.toLowerCase()}@voorbeeld.nl`]);
  }
  pairs.sort((a, b) => b[0].length - a[0].length);
  // Whole words only: a name like "Ad" must not change "Adam" or "Canada".
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${pairs.map(([real]) => escapeRe(real)).join("|")})(?![\\p{L}\\p{N}])`, "giu");
  const lookup = new Map(pairs.map(([real, alias]) => [real.toLowerCase(), alias]));
  const rename = (text) => text.replace(re, (m) => lookup.get(m.toLowerCase()) ?? m);
  rename.realNames = pairs.map(([real]) => real);
  rename.pattern = re;
  return rename;
}

/** Throws when a real name from ALIASES is visible on the page anyway. */
export async function assertNoRealNames(page, rename, where) {
  if (!rename) return;
  const text = await page.evaluate(() => document.body.innerText);
  const leaks = text.match(new RegExp(rename.pattern.source, "giu")) ?? [];
  if (leaks.length) throw new Error(`A real student name is visible on ${where} (${leaks.length} match). Stopped.`);
}

export async function findStudent(client, name = STUDENT_NAME) {
  const rows = ok(await client.from("profiles").select("id, display_name").ilike("display_name", `%${name}%`));
  if (rows.length !== 1) throw new Error(`Expected one student matching "${name}", found ${rows.length}: ${rows.map((r) => r.display_name).join(", ")}`);
  return rows[0];
}

/** Everything on the student's board that the demo could touch. */
export async function snapshot(client, studentId) {
  const lanes = ok(await client.from("leerpad_lanes").select("*").eq("student_id", studentId).order("id"));
  const steps = ok(await client.from("steps").select("*").eq("student_id", studentId).order("id"));
  const notes = steps.length
    ? ok(await client.from("step_notes").select("*").in("step_id", steps.map((s) => s.id)).order("step_id"))
    : [];
  return { takenAt: new Date().toISOString(), studentId, lanes, steps, notes };
}

export function saveSnapshot(snap) {
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const file = path.join(SNAPSHOT_DIR, `board-${snap.takenAt.replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify(snap, null, 2));
  return file;
}

const TABLES = [
  ["lanes", "leerpad_lanes", "id"],
  ["steps", "steps", "id"],
  ["notes", "step_notes", "step_id"],
];

/** Rows that changed, appeared or disappeared since `before`. Empty when nothing changed. */
export function compare(before, after) {
  const diffs = [];
  for (const [key, table, pk] of TABLES) {
    const was = new Map(before[key].map((r) => [r[pk], r]));
    const now = new Map(after[key].map((r) => [r[pk], r]));
    for (const [id, row] of was) {
      if (!now.has(id)) diffs.push({ table, id, kind: "removed", row });
      else if (JSON.stringify(row) !== JSON.stringify(now.get(id))) diffs.push({ table, id, kind: "changed", row, now: now.get(id) });
    }
    for (const [id, row] of now) if (!was.has(id)) diffs.push({ table, id, kind: "added", row });
  }
  return diffs;
}

/**
 * Puts changed rows back to their snapshot values. Rows that were added or
 * removed are only reported: deleting or re-creating data is for a person to decide.
 */
export async function restore(client, diffs) {
  const pkOf = Object.fromEntries(TABLES.map(([, t, pk]) => [t, pk]));
  const left = [];
  for (const d of diffs) {
    if (d.kind !== "changed") {
      left.push(d);
      continue;
    }
    const { [pkOf[d.table]]: _pk, created_at: _c, ...values } = d.row;
    ok(await client.from(d.table).update(values).eq(pkOf[d.table], d.id));
  }
  return left;
}
