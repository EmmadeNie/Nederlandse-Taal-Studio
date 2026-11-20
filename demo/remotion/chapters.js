// Prints the YouTube chapters of each lesson video, for the description
// (npm run chapters). The times come from the same timeline as the video.
import { LESSON_VIDEOS } from "./lessons.js";
import { videoChapters, videoDuration, FPS } from "./lessonVideoScenes.js";

for (const id of Object.keys(LESSON_VIDEOS)) {
  const sec = Math.round(videoDuration(id) / FPS);
  for (const lang of ["nl", "en"]) {
    console.log(`\n${id} (${lang}) · ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`);
    console.log(videoChapters(id, lang).join("\n"));
  }
}
