// The timeline of a full lesson video: which scene, how long, which chapter.
// No JSX here, so `npm run chapters` can print the YouTube chapters from it.
import { LESSON_VIDEOS } from "./lessons.js";

export const FPS = 30;
export const S = (sec) => Math.round(sec * FPS);

// The chapters shown in the header, in order (intro, summary and outro aren't).
export const HEADER_CHAPTERS = ["stem", "ending", "stemT", "inversion", "quiz"];
export const headerChapters = (id) => LESSON_VIDEOS[id].chapters ?? HEADER_CHAPTERS;

export const QUESTION_SEC = 8.5;
export const ANSWER_AT = 5.6; // a question's countdown runs from 0.8 s to here

export function videoScenes(id) {
  const L = LESSON_VIDEOS[id];
  const scenes = { perfect: perfectScenes, past: pastScenes }[L.tense] ?? presentScenes;
  return scenes(L).map((s, i, all) => ({ ...s, from: all.slice(0, i).reduce((n, x) => n + S(x.sec), 0), len: S(s.sec) }));
}

function presentScenes(L) {
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
  ];
}

// The past tense (regular verbs): what it is, the stem, te or de, singular and plural.
function pastScenes(L) {
  return [
    { kind: "hook", sec: 5.5, ch: "intro" },
    { kind: "agenda", sec: 8, ch: "intro" },
    { kind: "pWhat", sec: 14, ch: "intro" },
    { kind: "chapter", key: "stem", sec: 3.5, ch: "stem" },
    ...L.stems.map((g) => ({ kind: "stems", g, sec: 13, ch: "stem" })),
    { kind: "chapter", key: "tede", sec: 3.5, ch: "tede" },
    ...L.kofschip.map((g) => ({ kind: "pKofschip", g, sec: 12, ch: "tede" })),
    { kind: "pTrap", sec: 12, ch: "tede" },
    { kind: "chapter", key: "plural", sec: 3.5, ch: "plural" },
    { kind: "pastTable", sec: 12, ch: "plural" },
    { kind: "pastExamples", sec: 11, ch: "plural" },
    { kind: "pastNotes", sec: 11, ch: "plural" },
    { kind: "summary", sec: 12, ch: "summary" },
    { kind: "quizIntro", sec: 4, ch: "quiz" },
    ...L.quiz.map((q, i) => ({ kind: "question", q, i, sec: QUESTION_SEC, ch: "quiz" })),
    { kind: "outro", sec: 14, ch: "outro" },
  ];
}

// The perfect tense: the form, regular, irregular, hebben or zijn, word order.
function perfectScenes(L) {
  return [
    { kind: "hook", sec: 5.5, ch: "intro" },
    { kind: "agenda", sec: 9, ch: "intro" },
    { kind: "pWhat", sec: 14, ch: "intro" },
    { kind: "chapter", key: "form", sec: 3.5, ch: "form" },
    { kind: "pForm", sec: 12, ch: "form" },
    { kind: "pAux", sec: 12, ch: "form" },
    { kind: "chapter", key: "regular", sec: 3.5, ch: "regular" },
    { kind: "pFormula", sec: 10, ch: "regular" },
    ...L.kofschip.map((g) => ({ kind: "pKofschip", g, sec: 12, ch: "regular" })),
    { kind: "pTrap", sec: 12, ch: "regular" },
    { kind: "pNotes", sec: 11, ch: "regular" },
    { kind: "chapter", key: "irregular", sec: 3.5, ch: "irregular" },
    ...L.irregular.map((g) => ({ kind: "pIrregular", g, sec: 12, ch: "irregular" })),
    { kind: "chapter", key: "aux", sec: 3.5, ch: "aux" },
    { kind: "pZijn", sec: 13, ch: "aux" },
    { kind: "pContrast", sec: 11, ch: "aux" },
    { kind: "chapter", key: "order", sec: 3.5, ch: "order" },
    { kind: "pOrder", sec: 12, ch: "order" },
    { kind: "pOrder2", sec: 12, ch: "order" },
    { kind: "summary", sec: 13, ch: "summary" },
    { kind: "quizIntro", sec: 4, ch: "quiz" },
    ...L.quiz.map((q, i) => ({ kind: "question", q, i, sec: QUESTION_SEC, ch: "quiz" })),
    { kind: "outro", sec: 14, ch: "outro" },
  ];
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

// When a scene's explanation line appears (frames into the scene). Shared by
// LessonVideo.jsx and the captions, so a caption changes when the screen does.
export const stemStep = (g) => (g.key === "basic" ? S(1.4) : S(2.3));
export const stemsWhyAt = (g) => 20 + g.verbs.length * stemStep(g) + S(0.6);
export const STEM_T_STEP = S(2.2);
export const stemTNoteAt = (rows) => 20 + rows.length * STEM_T_STEP + S(0.4);
// The perfect tense.
export const WHAT_STEP = S(4.2); // the second sentence
export const WHAT_NOTE_AT = S(8.6);
export const KOF_STEP = S(2.4);
export const kofWhyAt = (g) => 20 + g.verbs.length * KOF_STEP + S(0.3);
export const TRAP_WHY_AT = S(6.2);
export const IRR_STEP = S(1.1);
export const irregularTipAt = (g) => 16 + g.verbs.length * IRR_STEP + S(0.6);
export const ZIJN_STEP = S(2.4);
export const zijnTipAt = (L) => 16 + L.zijn.length * ZIJN_STEP + S(0.4);
