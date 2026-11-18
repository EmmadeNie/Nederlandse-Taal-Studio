// Walks the main screens as the docent (read-only) and saves a screenshot plus
// the clickable elements of each, to plan the scenes of the demo.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { APP_URL, AUTH_FILE, DEMO_DIR, VIEWPORT, ALIASES } from "./config.mjs";
import { readOnly, docentClient, findStudent, buildRename, assertNoRealNames, saveLogin } from "./guard.mjs";

const out = path.join(DEMO_DIR, "out", "explore");
mkdirSync(out, { recursive: true });

const client = await docentClient();
const student = await findStudent(client);
const slug = student.display_name
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const browser = await chromium.launch();
const context = await browser.newContext({ storageState: AUTH_FILE, viewport: VIEWPORT });
const rename = await buildRename(client, ALIASES);
const blocked = await readOnly(context, { rename });
const page = await context.newPage();

const pages = [
  ["dashboard", "/dashboard"],
  ["leerpad", `/leerpaden/${slug}`],
  ["lesprogramma", "/lesprogramma"],
  ["grammatica", "/bibliotheek/grammatica"],
  ["grammatica-perfectum", "/bibliotheek/grammatica/perfectum"],
  ["werkwoorden", "/bibliotheek/werkwoorden"],
  ["zinnen", "/bibliotheek/zinnen"],
  ["oefeningen", "/bibliotheek/oefeningen"],
  ["flashcards", "/flashcards"],
  ["nakijken", "/nakijken"],
];

for (const [name, p] of pages) {
  await page.goto(APP_URL + p);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  await assertNoRealNames(page, rename, name);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  const items = await page.evaluate(() =>
    [...document.querySelectorAll("button, a, [role=button], input, select, [data-sortable], .card, [class*=card]")]
      .filter((e) => e.offsetParent)
      .slice(0, 120)
      .map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].join(".")} ${JSON.stringify((e.innerText || e.placeholder || e.ariaLabel || "").trim().slice(0, 50))}`),
  );
  writeFileSync(path.join(out, `${name}.txt`), items.join("\n"));
  console.log(`${name}: ${page.url()}`);
}

await saveLogin(context);
await browser.close();
console.log(`Blocked writes: ${blocked.length}`, blocked);
