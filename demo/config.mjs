// Shared settings for the demo recording. Reads the app's own .env.local, so the
// demo talks to the same Supabase project as `npm run dev`.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const DEMO_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(DEMO_DIR, "..");

function readEnv(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
  );
}

const env = { ...readEnv(path.join(ROOT, ".env.local")), ...process.env };

export const SUPABASE_URL = env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing in .env.local");

/**
 * A dev server of its own (port 5180, see .claude/launch.json), started after
 * .env.local was set, so it talks to the same Supabase as these scripts.
 * A long-running `npm run dev` may still point at the local Supabase.
 */
export const APP_URL = env.DEMO_APP_URL || "http://localhost:5180";

/**
 * Which students the video involves. Real names stay out of the repository: they
 * live in students.local.json (gitignored); see students.example.json.
 *   board:   whose leerpad we film { name: start of profiles.display_name, slug: path on screen }
 *   aliases: students shown under another name (start of the real name → made-up name).
 *            Only the picture changes: the database keeps the real names.
 */
const STUDENTS_FILE = path.join(DEMO_DIR, "students.local.json");
if (!existsSync(STUDENTS_FILE)) throw new Error("demo/students.local.json is missing: copy students.example.json and fill it in.");
const students = JSON.parse(readFileSync(STUDENTS_FILE, "utf8"));

export const ALIASES = students.aliases ?? {};
export const DEMO_BOARD = students.board;

/** The board check-board.mjs and explore.mjs look at, by default the demo board. */
export const STUDENT_NAME = env.DEMO_STUDENT || DEMO_BOARD.name;

/** Saved login of the docent (made by `npm run login`). Never committed. */
export const AUTH_FILE = path.join(DEMO_DIR, ".auth", "state.json");
export const SNAPSHOT_DIR = path.join(DEMO_DIR, "snapshots");
export const RAW_DIR = path.join(DEMO_DIR, "raw");

/** Same size as the login page video frame; 2x for sharp zooms in the edit. */
export const VIEWPORT = { width: 1440, height: 900 };
export const SCALE = 2;
