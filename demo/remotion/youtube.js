// Everything for YouTube next to each lesson video (npm run youtube):
// - a caption track (.srt) with the English for the Dutch on screen, so
//   viewers can pause, turn on CC and read the translations;
// - the description: intro, link to the grammar page, chapters, and the
//   verbs and pronouns with their English.
// Times and words come from the same timeline and data as the video.
import { mkdirSync, writeFileSync } from "node:fs";
import { LESSON_VIDEOS, verb } from "./lessons.js";
import { ANSWER_AT, FPS, S, stemTNoteAt, stemsWhyAt, videoChapters, videoScenes } from "./lessonVideoScenes.js";

const SITE = "https://mijntaalstudio.nl";
const GRAMMAR = { nl: "/grammatica/", en: "/en/grammar/" };
const OUT = "out/lessons";

const pair = ([nl, en]) => `${nl} = ${en}`;
const verbPair = (id) => {
  const v = verb(id);
  return `${v.nl} = ${v.en}`;
};
const list = (pairs) => pairs.join(" · ");

/**
 * The captions of one scene, as [offset in frames, lines] steps. The Dutch video
 * gets the English of its headings too; the English one only needs the Dutch words.
 */
function sceneCaptions(s, L, lang) {
  const E = L.text.en; // the English of what's on screen
  const nl = lang === "nl";
  const G = L.glossary;
  const head = (text) => (nl ? [text] : []);
  switch (s.kind) {
    case "hook":
      return [[0, [...head(E.title.join(" ")), list(G.hook.map(pair))]]];
    case "agenda":
      return [[0, [...head(`${E.agendaTitle}: ${["stem", "ending", "stemT", "inversion", "quiz"].map((k) => E.chapters[k]).join(" · ")}`), list(G.agenda.map(pair))]]];
    case "intro":
      return [[0, [...head(E.introTitle), list([verbPair(L.intro), ...G.intro.map(pair)]), ...head(E.rule.replace(/\s+/g, " "))]]];
    case "chapter":
      return nl ? [[0, [`${E.chapters[s.key]}: ${E.chapterSub[s.key]}`]]] : [];
    case "stems": {
      const t = E.stems[s.g.key];
      const words = list(s.g.verbs.map(verbPair));
      const steps = [[0, [...head(`${t.title}: ${t.sub}`), words]]];
      if (t.why && nl) steps.push([stemsWhyAt(s.g), [words, t.why]]);
      return steps;
    }
    case "table":
      return [[0, [verbPair(L.table), ...(nl ? [`${E.tableSingular}: ${list(L.pronouns.slice(0, 4).map(pair))}`, `${E.tablePlural}: ${list(L.pronouns.slice(4).map(pair))}`] : [])]]];
    case "examples":
      return [[0, [...head(`${E.examplesTitle}: ${E.examplesSub}`), list(L.examples.map(verbPair))]]];
    case "stemT": {
      const words = list(L.stemT.map((r) => verbPair(r.verb)));
      const steps = [[0, [...head(`${E.stemTTitle}: ${E.stemTSub}`), words]]];
      if (nl) steps.push([stemTNoteAt(L.stemT), [words, E.stemTNote]]);
      return steps;
    }
    case "inversion":
      return [[0, [...head(`${E.inversionTitle}: ${E.inversionSub}`), list([verbPair(L.inversion.verb), ...G.inversion.map(pair)]), ...head(E.inversionGloss.join(" · "))]]];
    case "inversionNote":
      return [[0, [...head(`${E.noteTitle}: ${E.noteStemT} · ${E.noteOthers}`), list(G.inversionNote.map(pair))]]];
    case "summary":
      // Two cues of three rows, as the rows come in (16 + i × 1.1 s in LessonVideo.jsx).
      return nl
        ? [
            [0, [E.summaryTitle, ...E.summary.slice(0, 3).map(([k, v]) => `${k}: ${v}`)]],
            [16 + 3 * S(1.1), E.summary.slice(3).map(([k, v]) => `${k}: ${v}`)],
          ]
        : [];
    case "quizIntro":
      return nl ? [[0, [`${E.quizTitle} ${E.quizSub}`]]] : [];
    case "question": {
      const gloss = E.gloss[s.q.sentence];
      const steps = [[0, [verbPair(s.q.verb), ...(nl && gloss ? [gloss] : [])]]];
      if (nl) steps.push([S(ANSWER_AT), [verbPair(s.q.verb), ...(gloss ? [gloss] : []), `✓ ${E.quizNote[s.q.note]}`]]);
      return steps;
    }
    case "outro":
      return nl ? [[0, [`${E.outroTitle} · ${E.outroCta}`]]] : [];
    default:
      return [];
  }
}

const stamp = (frame) => {
  const ms = Math.round((frame / FPS) * 1000);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

function srt(id, lang) {
  const L = LESSON_VIDEOS[id];
  const cues = [];
  for (const s of videoScenes(id)) {
    const steps = sceneCaptions(s, L, lang);
    steps.forEach(([at, lines], i) => {
      const from = s.from + Math.max(at, 6);
      const to = i + 1 < steps.length ? s.from + steps[i + 1][0] : s.from + s.len - 4;
      cues.push({ from, to, lines });
    });
  }
  return cues.map((c, i) => `${i + 1}\n${stamp(c.from)} --> ${stamp(c.to)}\n${c.lines.join("\n")}\n`).join("\n");
}

/** Every verb in the video once, in the order they come up. */
function verbsOf(L) {
  const ids = [L.intro, ...L.stems.flatMap((g) => g.verbs), L.table, ...L.examples, ...L.stemT.map((r) => r.verb), L.inversion.verb, ...L.quiz.map((q) => q.verb)];
  return [...new Set(ids)].map(verb);
}

function description(id, lang) {
  const L = LESSON_VIDEOS[id];
  const D = L.text[lang].description;
  return [
    D.lead,
    "",
    `${D.page}: ${SITE}${GRAMMAR[lang]}${L.slug}/`,
    D.cc,
    "",
    D.chapters,
    ...videoChapters(id, lang),
    "",
    D.verbs,
    ...verbsOf(L).map((v) => `${v.nl} – ${v.en}`),
    "",
    D.pronouns,
    ...L.pronouns.map(([nl, en]) => `${nl} – ${en}`),
    "",
    D.footer,
    SITE,
    "",
  ].join("\n");
}

mkdirSync(OUT, { recursive: true });
for (const id of Object.keys(LESSON_VIDEOS)) {
  const base = `${OUT}/lesson_${id.replace(/-/g, "_")}`;
  for (const lang of ["nl", "en"]) {
    const L = lang.toUpperCase();
    writeFileSync(`${base}_captions_${L}.srt`, srt(id, lang));
    writeFileSync(`${base}_description_${L}.txt`, description(id, lang));
    console.log(`${base}_captions_${L}.srt · ${base}_description_${L}.txt`);
  }
}
