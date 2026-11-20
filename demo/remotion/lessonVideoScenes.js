// The timeline of a full lesson video: which scene, how long, which chapter.
// No JSX here, so `npm run chapters` can print the YouTube chapters from it.
import { LESSON_VIDEOS } from "./lessons.js";

export const FPS = 30;
export const S = (sec) => Math.round(sec * FPS);

// The chapters shown in the header, in order (intro, summary and outro aren't).
export const HEADER_CHAPTERS = ["stem", "ending", "stemT", "inversion", "quiz"];

export const QUESTION_SEC = 8.5;
export const ANSWER_AT = 5.6; // a question's countdown runs from 0.8 s to here

export function videoScenes(id) {
  const L = LESSON_VIDEOS[id];
  return [
    { kind: "hook", sec: 5.5, ch: "intro" },
    { kind: "agenda", sec: 8, ch: "intro" },
    { kind: "intro", sec: 11, ch: "intro" },
    { kind: "chapter", key: "stem", sec: 3.5, ch: "stem" },
    ...L.stems.map((g) => ({ kind: "stems", g, sec: g.key === "basic" ? 8 : 12, ch: "stem" })),
    { kind: "chapter", key: "ending", sec: 3.5, ch: "ending" },
    { kind: "table", sec: 13, ch: "ending" },
    { kind: "examples", sec: 11, ch: "ending" },
    { kind: "chapter", key: "stemT", sec: 3.5, ch: "stemT" },
    { kind: "stemT", sec: 11, ch: "stemT" },
    { kind: "chapter", key: "inversion", sec: 3.5, ch: "inversion" },
    { kind: "inversion", sec: 11, ch: "inversion" },
    { kind: "inversionNote", sec: 9, ch: "inversion" },
    { kind: "summary", sec: 12, ch: "summary" },
    { kind: "quizIntro", sec: 4, ch: "quiz" },
    ...L.quiz.map((q, i) => ({ kind: "question", q, i, sec: QUESTION_SEC, ch: "quiz" })),
    { kind: "outro", sec: 14, ch: "outro" },
  ].map((s, i, all) => ({ ...s, from: all.slice(0, i).reduce((n, x) => n + S(x.sec), 0), len: S(s.sec) }));
}

export const videoDuration = (id) => videoScenes(id).reduce((n, s) => n + s.len, 0);

/** YouTube chapters: "0:00 Intro", one line per chapter (the outro is not one). */
export function videoChapters(id, lang) {
  const T = LESSON_VIDEOS[id].text[lang];
  const seen = new Set();
  const lines = [];
  for (const s of videoScenes(id)) {
    if (s.ch === "outro" || seen.has(s.ch)) continue;
    seen.add(s.ch);
    const sec = Math.floor(s.from / FPS);
    lines.push(`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")} ${T.chapters[s.ch]}`);
  }
  return lines;
}
