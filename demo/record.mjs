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

/** A card's recommended practise button (filled), in the lanes on screen. */
const recommended = (name) =>
  page.locator(".board-lane").filter({ has: page.locator(".board-lane-head", { hasText: /To do|Doing|Done/ }) })
    .locator(".cp-button.is-recommended").filter({ hasText: name }).first();

/** The right answer of the drill's current question, read from the app's own state. */
const drillAnswer = () =>
  page.evaluate(() => {
    const el = document.querySelector(".vd-card input");
    const key = el && Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
    for (let f = key && el[key]; f; f = f.return) {
      for (let s = f.memoizedState; s && typeof s === "object" && "memoizedState" in s; s = s.next) {
        const v = s.memoizedState;
        if (Array.isArray(v) && v[0]?.answers) return v[0].answers[0];
      }
    }
    return null;
  });

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

  // A lesson opens: explanation and grammar, scrolled through.
  async lesson(cap) {
    await panBoard("end", 10);
    const card = page.locator(".board-card").filter({ has: page.locator(".step-status.is-homework") }).first();
    await h.click(card.locator(".board-card-title"));
    const dialog = page.locator(".lp-dialog");
    await dialog.waitFor();
    cap.mark("open", await dialog.boundingBox());
    await h.wait(1200);
    const box = await dialog.boundingBox();
    await h.moveTo(box.x + box.width / 2, box.y + box.height * 0.6, 500);
    for (let i = 0; i < 14; i++) {
      await page.mouse.wheel(0, 60);
      await h.wait(60);
    }
    await h.wait(1200);
    await h.click(dialog.locator(".fb-close"));
    await h.wait(400);
  },

  // Vervoegen straight from a card: three right answers.
  async conjugate(cap) {
    await panBoard("end", 10);
    // The filled button is the lesson's recommended practise: it starts right away.
    await h.click(recommended(/Vervoegen|Conjugate/));
    await page.locator(".vd-card input").waitFor();
    await h.wait(800);
    for (let i = 0; i < 3; i++) {
      const answer = await drillAnswer();
      if (!answer) throw new Error("Could not read the drill's answer");
      cap.mark(`answer-${i}`, await page.locator(".vd-card").boundingBox());
      await h.type(answer, { delay: 110 });
      await h.wait(300);
      await page.keyboard.press("Enter");
      await h.wait(1300);
      await page.keyboard.press("Enter"); // next question
      await h.wait(500);
    }
    await page.locator(".fc-back").click();
  },

  // Flashcards from a card: flip, know it, next.
  async flashcards(cap) {
    await page.goto(`${APP_URL}/leerpaden/${DEMO_BOARD.slug}`);
    await page.locator(".board-card").first().waitFor();
    await page.waitForTimeout(1000);
    await h.click(recommended(/Flashcards/));
    await page.locator(".fc-practice").waitFor();
    await h.wait(900);
    for (let i = 0; i < 3; i++) {
      cap.mark(`flip-${i}`);
      await page.keyboard.press("Space");
      await h.wait(1100);
      await page.keyboard.press("ArrowRight");
      await h.wait(700);
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
