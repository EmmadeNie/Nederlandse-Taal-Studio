// Recording helpers: a sharp frame capture, a visible cursor and human-paced
// mouse and keyboard. Used by record.mjs.
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { RAW_DIR } from "./config.mjs";

/**
 * Captures the page with Chrome's screencast: a JPEG for every change, with its
 * timestamp. Much sharper than Playwright's own video, so the edit can zoom in.
 * Frames land in raw/<scene>/; the edit holds each frame until the next one.
 */
export async function startCapture(page, scene, { scale = 2 } = {}) {
  const dir = path.join(RAW_DIR, scene);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const cdp = await page.context().newCDPSession(page);
  const vp = page.viewportSize();
  const frames = [];
  const marks = [];
  let t0 = null;

  cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    t0 ??= metadata.timestamp;
    const file = `${String(frames.length).padStart(5, "0")}.jpg`;
    writeFileSync(path.join(dir, file), Buffer.from(data, "base64"));
    frames.push({ file, t: +(metadata.timestamp - t0).toFixed(3) });
    await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 92,
    maxWidth: vp.width * scale,
    maxHeight: vp.height * scale,
    everyNthFrame: 1,
  });
  const started = Date.now();
  const now = () => (Date.now() - started) / 1000;

  return {
    /** A named moment (and optional spot on screen) the edit can zoom to or cut on. */
    mark(name, box = null) {
      marks.push({ name, t: +now().toFixed(3), box });
    },
    async stop() {
      // One last frame so the clip ends on the final state.
      await page.waitForTimeout(300);
      await cdp.send("Page.stopScreencast").catch(() => {});
      await cdp.detach().catch(() => {});
      const manifest = { scene, width: vp.width, height: vp.height, scale, duration: +now().toFixed(3), frames, marks };
      writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
      return manifest;
    },
  };
}

/** A round cursor that follows the (headless) mouse and pulses on click. */
export const CURSOR_SCRIPT = `
(() => {
  const install = () => {
    if (document.getElementById("demo-cursor")) return;
    const c = document.createElement("div");
    c.id = "demo-cursor";
    c.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28"><path d="M5 3l16 9.5-7 1.6-3.6 6.4z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg><span></span>';
    Object.assign(c.style, { position: "fixed", left: "-50px", top: "-50px", zIndex: 2147483647, pointerEvents: "none", transform: "translate(-5px,-3px)" });
    const ring = c.querySelector("span");
    Object.assign(ring.style, { position: "absolute", left: "-13px", top: "-13px", width: "36px", height: "36px", borderRadius: "50%", background: "rgba(240,140,60,.45)", transform: "scale(0)", transition: "transform .25s ease, opacity .35s ease", opacity: 0 });
    document.documentElement.appendChild(c);
    addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", () => { ring.style.transition = "none"; ring.style.transform = "scale(.3)"; ring.style.opacity = 1; requestAnimationFrame(() => { ring.style.transition = "transform .3s ease, opacity .45s ease"; ring.style.transform = "scale(1)"; }); }, true);
    addEventListener("mouseup", () => { ring.style.opacity = 0; }, true);
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", install); else install();
})();
`;

/** Mouse and keyboard at a pace a viewer can follow. */
export function human(page) {
  let pos = { x: page.viewportSize().width / 2, y: page.viewportSize().height / 2 };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  async function moveTo(x, y, ms = 600) {
    const from = { ...pos };
    const steps = Math.max(8, Math.round(ms / 16));
    for (let i = 1; i <= steps; i++) {
      const k = ease(i / steps);
      await page.mouse.move(from.x + (x - from.x) * k, from.y + (y - from.y) * k);
      await page.waitForTimeout(ms / steps);
    }
    pos = { x, y };
  }

  async function centerOf(target) {
    const loc = typeof target === "string" ? page.locator(target).first() : target;
    await loc.scrollIntoViewIfNeeded();
    const b = await loc.boundingBox();
    if (!b) throw new Error(`Not visible: ${target}`);
    return { x: b.x + b.width / 2, y: b.y + b.height / 2, box: b };
  }

  return {
    centerOf,
    moveTo,
    async hover(target, ms) {
      const c = await centerOf(target);
      await moveTo(c.x, c.y, ms);
      return c;
    },
    async click(target, { ms = 650, pause = 250 } = {}) {
      const c = await centerOf(target);
      await moveTo(c.x, c.y, ms);
      await page.waitForTimeout(120);
      await page.mouse.down();
      await page.waitForTimeout(90);
      await page.mouse.up();
      await page.waitForTimeout(pause);
      return c;
    },
    async type(text, { delay = 55 } = {}) {
      for (const ch of text) {
        await page.keyboard.type(ch);
        await page.waitForTimeout(delay + Math.random() * delay * 0.8);
      }
    },
    /** Drag for dnd-kit: press, nudge past its 6px threshold, glide, drop. */
    async drag(from, to, { ms = 1100 } = {}) {
      const a = await centerOf(from);
      await moveTo(a.x, a.y, 500);
      await page.mouse.down();
      await page.waitForTimeout(150);
      await page.mouse.move(a.x + 8, a.y + 4, { steps: 3 });
      pos = { x: a.x + 8, y: a.y + 4 };
      const b = typeof to === "object" && "x" in to ? to : await centerOf(to);
      await moveTo(b.x, b.y, ms);
      await page.waitForTimeout(250);
      await page.mouse.up();
      await page.waitForTimeout(400);
      return { from: a, to: b };
    },
    wait: (ms) => page.waitForTimeout(ms),
  };
}
