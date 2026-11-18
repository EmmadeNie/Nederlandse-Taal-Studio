// Opens a browser window on the local app. Log in as the docent there (email +
// code); once the app shows, the login is saved to .auth/state.json for the
// recording script. Run again when the saved login has expired.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { APP_URL, AUTH_FILE } from "./config.mjs";

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
const page = await context.newPage();
await page.goto(APP_URL);
await page.bringToFront();
console.log(`Log in in the browser window that just opened (${APP_URL}). Waiting up to 60 minutes...`);

// Logged in = a Supabase session stored for the app's origin. Checked on the
// whole browser, so it does not matter which page or tab is open meanwhile.
const origin = new URL(APP_URL).origin;
const deadline = Date.now() + 60 * 60_000;
for (;;) {
  const state = await context.storageState().catch(() => null);
  const own = state?.origins.find((o) => o.origin === origin);
  if (own?.localStorage.some((i) => /^sb-.*-auth-token$/.test(i.name))) break;
  if (Date.now() > deadline) throw new Error("No login within 60 minutes.");
  await new Promise((r) => setTimeout(r, 1000));
}
await new Promise((r) => setTimeout(r, 3000));
mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
await context.storageState({ path: AUTH_FILE });
console.log(`Saved the login to ${AUTH_FILE}`);
await browser.close();
