// Turns the rendered videos (out/website_demo_long_<LANG>.mp4) into small web
// files for the login page: public/demo/website_demo_long_<LANG>.mp4 (1440 wide,
// no sound unless there is music) and a poster image. Uses the ffmpeg that comes
// with Remotion.
//
// Every video is named goal_length_LANG: website_demo / website_demo_phone (login
// page), marketing / marketing_quiz (socials); long or short; NL or EN.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEMO_DIR, ROOT, RAW_DIR } from "./config.mjs";

const outDir = path.join(ROOT, "public", "demo");
mkdirSync(outDir, { recursive: true });
const music = existsSync(path.join(RAW_DIR, "music.mp3"));
const ffmpeg = (...args) => execFileSync("npx", ["remotion", "ffmpeg", "-y", "-loglevel", "error", ...args], { cwd: DEMO_DIR, stdio: "inherit" });

// Wide for computers, a taller 4:5 cut for phones.
const VARIANTS = [
  { goal: "website_demo", width: 1440 },
  { goal: "website_demo_phone", width: 864 },
];
for (const lang of ["nl", "en"]) {
  for (const { goal, width } of VARIANTS) {
    const name = `${goal}_long_${lang.toUpperCase()}`;
    const src = path.join(DEMO_DIR, "out", `${name}.mp4`);
    if (!existsSync(src)) continue;
    const mp4 = path.join(outDir, `${name}.mp4`);
    ffmpeg(
      "-i", src,
      "-vf", `scale=${width}:-2`,
      "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-pix_fmt", "yuv420p",
      ...(music ? ["-c:a", "aac", "-b:a", "128k"] : ["-an"]),
      "-movflags", "+faststart",
      mp4,
    );
    // Poster: a moment on the board, so the page looks right before the video plays.
    ffmpeg("-ss", "4", "-i", src, "-frames:v", "1", "-vf", `scale=${width}:-2`, "-q:v", "3", path.join(outDir, `${name}.jpg`));
    console.log(`${name}: ${(statSync(mp4).size / 1e6).toFixed(1)} MB`);
  }
}
// Tells the login page whether to offer a sound button.
writeFileSync(path.join(outDir, "info.json"), JSON.stringify({ music }) + "\n");
