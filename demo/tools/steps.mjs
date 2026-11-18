// Tries a few clicks on the demo board (read-only) and screenshots each step, to plan the scenes.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { APP_URL, AUTH_FILE, VIEWPORT, ALIASES, DEMO_BOARD } from "../config.mjs";
import { readOnly, docentClient, buildRename, assertNoRealNames, saveLogin } from "../guard.mjs";

const lang = process.argv[2] || "nl";
mkdirSync("out/steps", { recursive: true });
const rename = await buildRename(await docentClient(), ALIASES);
const browser = await chromium.launch();
const context = await browser.newContext({ storageState: AUTH_FILE, viewport: VIEWPORT });
await context.addInitScript(() => localStorage.setItem("nts-theme", "dark"));
const blocked = await readOnly(context, { rename, lang });
const page = await context.newPage();
let n = 0;
const shot = async (name) => {
  await page.waitForTimeout(700);
  await assertNoRealNames(page, rename, name);
  await page.screenshot({ path: `out/steps/${lang}-${++n}-${name}.png` });
  console.log("shot", n, name);
};

await page.goto(`${APP_URL}/leerpaden/${DEMO_BOARD.slug}`);
await page.locator(".board-card").first().waitFor({ timeout: 30000 });
await shot("board");

// Scroll the board to the left to see the level lanes.
await page.locator(".board").evaluate((el) => el.scrollTo({ left: 0 }));
await shot("board-left");
await page.locator(".board").evaluate((el) => el.scrollTo({ left: el.scrollWidth }));

// Open a card by its title (not the status icon).
const card = page.locator(".board-card").filter({ hasText: /staan, slaan/i }).first();
await card.locator(".board-card-title").click();
await shot("card-open");
await page.mouse.wheel(0, 500);
await shot("card-open-scrolled");
await page.keyboard.press("Escape");
await page.waitForTimeout(400);

// The practise buttons on a card.
const btns = await card.locator("button").allInnerTexts();
console.log("buttons on card:", btns);
await card.getByRole("button", { name: /Vervoegen|Conjugate/i }).first().click();
await shot("practise-1");
await page.keyboard.type("doe", { delay: 80 });
await shot("practise-typed");
await page.keyboard.press("Enter");
await shot("practise-checked");
await page.keyboard.press("Escape");

// Flashcards on another card.
const fc = page.locator(".board-card").filter({ has: page.getByRole("button", { name: /^Flashcards$/ }) }).first();
await fc.getByRole("button", { name: /^Flashcards$/ }).click();
await shot("flashcards-1");
await page.keyboard.press("Space");
await shot("flashcards-flip");

await saveLogin(context);
await context.unrouteAll({ behavior: "ignoreErrors" });
await browser.close();
console.log("blocked:", blocked.map((b) => `${b.method} ${b.path}`));
