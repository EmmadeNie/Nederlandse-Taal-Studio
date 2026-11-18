// Walks the reflexive-verbs lesson, a fill-in exercise and flashcard levels
// (read-only, made-up names) and screenshots each step.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { APP_URL, AUTH_FILE, VIEWPORT, ALIASES, DEMO_BOARD } from "../config.mjs";
import { readOnly, docentClient, buildRename, assertNoRealNames, saveLogin } from "../guard.mjs";

const lang = process.argv[2] || "nl";
mkdirSync("out/lesson", { recursive: true });
const rename = await buildRename(await docentClient(), ALIASES);
const browser = await chromium.launch();
const context = await browser.newContext({ storageState: AUTH_FILE, viewport: VIEWPORT });
await context.addInitScript(() => localStorage.setItem("nts-theme", "dark"));
await readOnly(context, { rename, lang });
const page = await context.newPage();
let n = 0;
const shot = async (name) => {
  await page.waitForTimeout(600);
  await assertNoRealNames(page, rename, name);
  await page.screenshot({ path: `out/lesson/${++n}-${name}.png` });
};
const board = async () => {
  await page.goto(`${APP_URL}/leerpaden/${DEMO_BOARD.slug}`);
  await page.locator(".board-card").first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(800);
};

await board();
await page.locator(".board-card").filter({ hasText: /zij haasten zich/ }).locator(".board-card-title").first().click();
const dialog = page.locator(".lp-dialog");
await dialog.waitFor();
await shot("dialog-top");
console.log("sections:", await dialog.locator(".lp-section h4, .lp-section .list-heading, .lp-section h3").allInnerTexts());
console.log("readmore:", await dialog.locator(".topic-readmore").allInnerTexts());
const scroller = await dialog.evaluate((el) => {
  const all = [el, ...el.querySelectorAll("*")];
  const s = all.find((e) => e.scrollHeight > e.clientHeight + 20 && getComputedStyle(e).overflowY !== "visible");
  return s ? `${s.className} ${s.scrollHeight}/${s.clientHeight}` : "none";
});
console.log("scroller:", scroller);
await dialog.locator(".topic-readmore").first().scrollIntoViewIfNeeded();
await shot("short");
await dialog.locator(".topic-readmore").first().click();
await shot("long");
const secs = dialog.locator(".lp-section");
for (let i = 0; i < (await secs.count()); i++) {
  await secs.nth(i).scrollIntoViewIfNeeded();
  await shot(`section-${i}`);
}
await page.keyboard.press("Escape");

// Fill-in from the card that recommends it.
const fill = page.locator(".board-lane").filter({ has: page.locator(".board-lane-head", { hasText: /To do|Doing|Done/ }) })
  .locator(".cp-button.is-recommended").filter({ hasText: /Invullen|Fill in/ }).first();
await fill.click();
await page.waitForTimeout(1500);
await shot("fill-1");
console.log("fill url:", page.url(), "inputs:", await page.locator(".vd-card input").count());

// Flashcards: which level filters does a word card show?
for (const title of [/bijvoegelijk/, /eerste voegwoorden/, /tegenwoordige tijd$/, /ontmoetingsgesprek/]) {
  await board();
  const card = page.locator(".board-card").filter({ hasText: title }).first();
  if (!(await card.count())) continue;
  const btn = card.locator(".cp-button").filter({ hasText: /Flashcards/ }).first();
  if (!(await btn.count())) continue;
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await page.waitForTimeout(1500);
  console.log(String(title), "levels:", await page.locator(".fc-seg").first().innerText().catch(() => "-"), "| dialog:", await page.locator(".lp-dialog .cp-option").allInnerTexts().catch(() => []));
  await shot(`fc-${String(title).replace(/\W/g, "")}`);
}

await saveLogin(context);
await context.unrouteAll({ behavior: "ignoreErrors" });
await browser.close();
