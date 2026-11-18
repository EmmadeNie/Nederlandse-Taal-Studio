// Records the raw scenes of the demo video, read-only, with made-up names.
//   node record.mjs [nl|en] [scene ...]
// Frames land in raw/<lang>/<scene>/ (see capture.mjs); the edit (Remotion) cuts them together.
import { chromium } from "playwright";
import { APP_URL, AUTH_FILE, VIEWPORT, SCALE, ALIASES, DEMO_BOARD } from "./config.mjs";
import { readOnly, docentClient, buildRename, assertNoRealNames, saveLogin, findStudent, snapshot, compare } from "./guard.mjs";
import { startCapture, human, CURSOR_SCRIPT } from "./capture.mjs";

const [lang = "nl", ...only] = process.argv.slice(2);
const client = await docentClient();
const rename = await buildRename(client, ALIASES);
const student = await findStudent(client, DEMO_BOARD.name);
const before = await snapshot(client, student.id);

// A real (headed) window: only that gives frames at 2x. It opens off-screen, and
// is told not to slow down while hidden.
const browser = await chromium.launch({
  headless: false,
  args: [
    "--window-position=-3000,0",
    "--hide-scrollbars",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--disable-background-timer-throttling",
  ],
});
const context = await browser.newContext({ storageState: AUTH_FILE, viewport: VIEWPORT, deviceScaleFactor: SCALE });
await context.addInitScript(() => {
  localStorage.setItem("nts-theme", "dark");
  // No scrollbars, and no switch to the other language on a hovered card (an experiment).
  const css =
    "::-webkit-scrollbar{display:none} *{scrollbar-width:none} .hover-alt{display:none!important} .hover-main{display:inline!important}";
  addEventListener("DOMContentLoaded", () => document.head.append(Object.assign(document.createElement("style"), { textContent: css })));
});
await context.addInitScript(CURSOR_SCRIPT);
const blocked = await readOnly(context, { rename, lang });
const page = await context.newPage();
const h = human(page);

const lane = (name) => page.locator(".board-lane").filter({ has: page.locator(".board-lane-head", { hasText: name }) }).first();
const cards = (name) => lane(name).locator(".board-card");

async function openBoard() {
  await page.goto(`${APP_URL}/leerpaden/${DEMO_BOARD.slug}`);
  await page.locator(".board-card").first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1500);
  await assertNoRealNames(page, rename, "board");
}

/** Scrolls the board sideways smoothly, like a person dragging the scrollbar. */
async function panBoard(to, ms = 1400) {
  await page.locator(".board").evaluate(
    (el, [to, ms]) =>
      new Promise((done) => {
        const from = el.scrollLeft;
        const target = to === "start" ? 0 : to === "end" ? el.scrollWidth : to;
        const t0 = performance.now();
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
        const step = (now) => {
          const k = Math.min(1, (now - t0) / ms);
          el.scrollLeft = from + (target - from) * ease(k);
          if (k < 1) requestAnimationFrame(step);
          else done();
        };
        requestAnimationFrame(step);
      }),
    [to, ms],
  );
}

/** Scrolls an element (vertically) smoothly to `top`. */
const scrollTo = (locator, top, ms = 900) =>
  locator.evaluate(
    (el, [top, ms]) =>
      new Promise((done) => {
        const from = el.scrollTop;
        const t0 = performance.now();
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
        const step = (now) => {
          const k = Math.min(1, (now - t0) / ms);
          el.scrollTop = from + (top - from) * ease(k);
          if (k < 1) requestAnimationFrame(step);
          else done();
        };
        requestAnimationFrame(step);
      }),
    [top, ms],
  );

/** Where `target` sits inside the scrolling `box`, minus a margin: the scrollTop that brings it near the top. */
const offsetIn = (box, target, margin = 60) =>
  target.evaluate((el, margin) => {
    const sc = el.closest(".lp-dialog");
    return el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - margin;
  }, margin);

/** A card's recommended practise button (filled), in the lanes on screen. */
const recommended = (name) =>
  page.locator(".board-lane").filter({ has: page.locator(".board-lane-head", { hasText: /To do|Doing|Done/ }) })
    .locator(".cp-button.is-recommended").filter({ hasText: name }).first();

/** The right answer of the drill's current question, read from the app's own state. */
/** One answer per gap (a sentence can have several). */
const drillAnswer = () =>
  page.evaluate(() => {
    const el = document.querySelector(".vd-card input");
    const key = el && Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
    for (let f = key && el[key]; f; f = f.return) {
      for (let s = f.memoizedState; s && typeof s === "object" && "memoizedState" in s; s = s.next) {
        const v = s.memoizedState;
        if (Array.isArray(v) && v[0]?.answers) {
          const q = v[0];
          if (q.gapAnswers?.length > 1) return q.gapAnswers.map((a) => (Array.isArray(a) ? a[0] : a));
          return [q.answers[0]];
        }
      }
    }
    return null;
  });

/** Types the right answers for `n` questions of the drill on screen. */
async function answerDrill(cap, n, { delay = 110 } = {}) {
  for (let i = 0; i < n; i++) {
    const gaps = await drillAnswer();
    if (!gaps) throw new Error("Could not read the drill's answer");
    cap.mark(`answer-${i}`, await page.locator(".vd-card").boundingBox());
    for (const [g, text] of gaps.entries()) {
      await h.type(text, { delay });
      await h.wait(250);
      if (g < gaps.length - 1) await page.keyboard.press("Enter"); // on to the next gap
    }
    await page.keyboard.press("Enter"); // check
    await h.wait(1300);
    await page.keyboard.press("Enter"); // next question
    await h.wait(500);
  }
}

const SCENES = {
  // The kanban: a card moves to Done and turns green, then a look at the level lanes
  // and a lesson planned from A1 into To do.
  async board(cap) {
    await h.moveTo(900, 250, 400);
    await h.wait(600);
    const homework = cards("Doing").filter({ has: page.locator(".step-status.is-homework") }).first();
    cap.mark("drag-done", await homework.boundingBox());
    await h.drag(homework, cards("Done").first(), { ms: 1200 });
    await h.wait(500);
    const moved = cards("Done").first();
    cap.mark("status", await moved.boundingBox());
    await h.click(moved.locator(".step-status"));
    await h.wait(900);
    cap.mark("pan");
    await h.moveTo(700, 820, 500);
    await panBoard("start", 1600);
    await h.wait(500);
    const pick = cards("A1").nth(2);
    cap.mark("plan", await pick.boundingBox());
    await h.drag(pick, cards("To do").first(), { ms: 1300 });
    await h.wait(1000);
  },

  // The theory of a lesson: the short version, then the full one, and the verbs
  // and word list that come with it.
  async theory(cap) {
    await panBoard("end", 10);
    const card = page.locator(".board-card").filter({ hasText: /zij haasten zich/ }).first();
    await h.click(card.locator(".board-card-title"));
    const dialog = page.locator(".lp-dialog");
    await dialog.waitFor();
    cap.mark("open", await dialog.boundingBox());
    await h.wait(1100);
    const db = await dialog.boundingBox();
    await h.moveTo(db.x + db.width * 0.7, db.y + db.height * 0.55, 500);

    // The short explanation, with "Lees meer" under it.
    const more = dialog.locator(".topic-readmore").first();
    await scrollTo(dialog, await offsetIn(dialog, more, 520), 1100);
    await h.wait(300);
    cap.mark("short", await dialog.boundingBox());
    await h.wait(1600);
    await h.click(more, { ms: 700 });
    cap.mark("long", await dialog.boundingBox());
    await h.wait(400);
    const grammar = dialog.locator(".lp-section").filter({ has: page.locator(".topic-readmore") }).first();
    const longTop = await offsetIn(dialog, grammar, 20);
    await scrollTo(dialog, longTop, 700);
    await h.wait(900);
    await scrollTo(dialog, longTop + 520, 1600);
    await h.wait(700);

    // Verbs linked to the lesson, then its word list.
    const sections = dialog.locator(".lp-section");
    const verbs = sections.filter({ hasText: /^\s*(Werkwoorden|Verbs)/i }).first();
    await scrollTo(dialog, await offsetIn(dialog, verbs, 30), 1200);
    cap.mark("verbs", await verbs.boundingBox());
    await h.wait(1700);
    const words = sections.filter({ hasText: /^\s*(Woordenlijst|Word list)/i }).first();
    await scrollTo(dialog, await offsetIn(dialog, words, 220), 900);
    cap.mark("words", await words.boundingBox());
    await h.wait(500);
    const list = words.locator("summary").first(); // not the "Klaarzetten" button
    if (await list.count()) await h.click(list, { ms: 600 });
    await h.wait(1600);
    await h.click(dialog.locator(".fb-close"));
    await h.wait(400);
  },

  // Fill in: whole sentences with a gap.
  async fill(cap) {
    await panBoard("end", 10);
    // A lesson with ten fill-in sentences (fixed prepositions with verbs).
    const card = page.locator(".board-card").filter({ hasText: /voorzetsels \+ werkwoorden|Prepositions and verbs/i }).first();
    await h.click(card.locator(".cp-button.is-recommended").filter({ hasText: /Invullen|Fill in/ }).first());
    await page.locator(".vd-card input").waitFor();
    await h.wait(900);
    await answerDrill(cap, 3, { delay: 120 });
    await page.locator(".fc-back").first().click();
  },

  // Vervoegen straight from a card: three right answers.
  async conjugate(cap) {
    await panBoard("end", 10);
    // The filled button is the lesson's recommended practise: it starts right away.
    await h.click(recommended(/Vervoegen|Conjugate/));
    await page.locator(".vd-card input").waitFor();
    await h.wait(800);
    await answerDrill(cap, 3);
    await page.locator(".fc-back").click();
  },

  // Flashcards of a word list, split by level: A0 words, then A1 words.
  async levels(cap) {
    await page.goto(`${APP_URL}/leerpaden/${DEMO_BOARD.slug}`);
    await page.locator(".board-card").first().waitFor();
    await page.waitForTimeout(1000);
    const card = page.locator(".board-card").filter({ hasText: /Woorden: bijvoeg|Vocabulary: Adjectives/i }).first();
    await h.click(card.locator(".cp-button").filter({ hasText: /Flashcards/ }).first());
    await page.locator(".fc-practice").waitFor();
    await h.wait(900);
    const seg = page.locator(".fc-seg").first();
    for (const level of ["A0", "A1"]) {
      const btn = seg.getByRole("button", { name: level, exact: true });
      cap.mark(`level-${level}`, await seg.boundingBox());
      await h.click(btn, { ms: 600 });
      await h.wait(700);
      await page.keyboard.press("Space");
      await h.wait(1000);
      await page.keyboard.press("ArrowRight");
      await h.wait(600);
    }
    await page.locator(".fc-back").first().click();
  },
};

try {
  for (const [name, run] of Object.entries(SCENES)) {
    if (only.length && !only.includes(name)) continue;
    if (name === "board" || !page.url().includes("/leerpaden/")) await openBoard();
    const cap = await startCapture(page, `${lang}/${name}`, { scale: SCALE });
    try {
      await run(cap);
    } finally {
      const m = await cap.stop();
      console.log(`${lang}/${name}: ${m.frames.length} frames, ${m.duration}s`);
    }
    await assertNoRealNames(page, rename, name);
  }
} finally {
  await saveLogin(context).catch(() => {});
  await context.unrouteAll({ behavior: "ignoreErrors" });
  await browser.close();
  // The board must be exactly as before: the browser never wrote anything.
  const diffs = compare(before, await snapshot(client, student.id));
  console.log(`blocked ${blocked.length} writes; board unchanged: ${diffs.length === 0 ? "yes" : `NO, ${diffs.length} rows differ`}`);
  if (diffs.length) process.exitCode = 1;
}
