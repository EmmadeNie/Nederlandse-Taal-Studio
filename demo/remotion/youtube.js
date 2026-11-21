// Everything for YouTube next to each lesson video (npm run youtube):
// - a caption track (.srt) with the English for the Dutch on screen, so
//   viewers can pause, turn on CC and read the translations;
// - the description: intro, link to the grammar page, chapters, and the
//   verbs and pronouns with their English.
// Times and words come from the same timeline and data as the video.
import { mkdirSync, writeFileSync } from "node:fs";
import { LESSON_VIDEOS, auxForm, auxOf, enShort, fill, pastForm, perfectText, verb } from "./lessons.js";
import { ANSWER_AT, FPS, S, TRAP_WHY_AT, WHAT_NOTE_AT, WHAT_STEP, headerChapters, kofWhyAt, stemTNoteAt, stemsWhyAt, videoChapters, videoScenes, zijnTipAt } from "./lessonVideoScenes.js";

const SITE = "https://mijntaalstudio.nl";
const GRAMMAR = { nl: "/grammatica/", en: "/en/grammar/" };
const OUT = "out/lessons";

const pair = ([nl, en]) => `${nl} = ${en}`;
const verbPair = (id) => {
  const v = verb(id);
  return `${v.nl} = ${v.en}`;
};
// With the past tense: "werken (werkte / werkten) = to work".
const pastPair = (id) => {
  const v = verb(id);
  return `${v.nl} (${v.past.singular} / ${v.past.plural}) = ${enShort(v.en)}`;
};
// With the perfect: "eten (heeft gegeten) = to eat".
const perfectPair = (id, aux) => {
  const v = verb(id);
  return `${v.nl} (${auxForm(auxOf(id, aux), "hij")} ${v.participle}) = ${enShort(v.en)}`;
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
      return [[0, [...head(`${E.agendaTitle}: ${headerChapters(s.id).map((k) => E.chapters[k]).join(" · ")}`), list(G.agenda.map(pair))]]];
    case "intro":
      return [[0, [...head(E.introTitle), list([verbPair(L.intro), ...G.intro.map(pair)]), ...head(E.rule.replace(/\s+/g, " "))]]];
    case "chapter":
      return nl ? [[0, [`${E.chapters[s.key]}: ${E.chapterSub[s.key]}`]]] : [];
    case "stems": {
      const t = E.stems[s.g.key];
      const words = list(s.g.verbs.map(verbPair));
      const steps = [[0, [...head(`${t.title}: ${t.sub}`), words]]];
      if (t.why && nl) steps.push([stemsWhyAt(s.g), [words, fill(t.why)]]);
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
            [0, [E.summaryTitle, ...E.summary.slice(0, 3).map(([k, v]) => `${k}: ${fill(v)}`)]],
            [16 + 3 * S(1.1), E.summary.slice(3).map(([k, v]) => `${k}: ${fill(v)}`)],
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
    // The perfect tense.
    case "pWhat": {
      // The English is on screen already; the captions give the words and, in NL, the headings.
      const plain = (en) => en.replace(/[{}]/g, "");
      const words = list([...new Set(L.what.map((x) => x.verb))].map(verbPair).concat(G.what.map(pair)));
      const steps = [[0, [...head(`${E.whatTitle} ${E.whatSub}`), words]]];
      steps.push([WHAT_STEP, [words, ...head(L.what.map((x) => `${perfectText(x)} = ${plain(x.en)}`).join(" · "))]]);
      if (nl) steps.push([WHAT_NOTE_AT, [words, fill(E.whatNote)]]);
      return steps;
    }
    case "pForm":
      return [[0, [...head(E.formTitle), list([verbPair(L.intro.verb), ...G.form.map(pair)]), ...head(`${E.formGloss.join(" → ")} · ${E.rule}`)]]];
    case "pAux": {
      const ids = Object.values(L.auxTable);
      return [[0, [...head(`${E.auxTitle}: ${E.auxSub}`), list(ids.map((id) => perfectPair(id)))]]];
    }
    case "pFormula":
      return [[0, [...head(`${E.formulaTitle}: ${E.formulaSub}`), list(L.formula.map((id) => perfectPair(id)))]]];
    case "pKofschip": {
      const t = E.kofschip[s.g.key];
      const words = list(s.g.verbs.map((id) => (L.tense === "past" ? pastPair(id) : perfectPair(id))));
      const steps = [[0, [...head(`${t.title}: ${t.sub}`), words]]];
      if (nl) steps.push([kofWhyAt(s.g), [words, `'t kofschip ${E.kofWhy}`]]);
      return steps;
    }
    case "pTrap": {
      const words = L.tense === "past" ? pastPair(L.trap) : perfectPair(L.trap);
      const steps = [[0, [...head(`${E.trapTitle}: ${E.trapSub}`), words]]];
      if (nl) steps.push([TRAP_WHY_AT, [words, fill(E.trapWhy)]]);
      return steps;
    }
    case "pNotes":
      return [[0, [...head(`${E.noteDouble} · ${E.noteNoGe}`), list([...L.notes.double, ...L.notes.noGe].map((id) => perfectPair(id)))]]];
    case "pIrregular": {
      const t = E.irregular[s.g.key];
      return [[0, [...head(`${t.title}: ${t.sub}`), list(s.g.verbs.map((id) => perfectPair(id)))]]];
    }
    case "pZijn": {
      const words = list(L.zijn.flatMap((g) => g.verbs.map((id) => perfectPair(id, "zijn"))));
      const steps = [[0, [...head(`${E.zijnTitle}: ${E.zijnSub}`), words]]];
      if (nl) steps.push([zijnTipAt(L), [words, fill(E.irregularTip)]]);
      return steps;
    }
    case "pContrast":
      return [[0, [...head(`${E.contrastTitle}: ${E.contrastSub}`), list([verbPair(L.contrast[0].verb), ...G.contrast.map(pair)]), ...head(L.contrast.map((c, i) => `${E.contrastGloss[i]} (${E.contrastLabels[c.label]})`).join(" · "))]]];
    case "pOrder":
      return [[0, [...head(`${E.orderTitle}: ${E.orderSub}`), list([verbPair(L.order.verb), ...G.order.map(pair)]), ...head(E.orderGloss)]]];
    case "pOrder2":
      return [[0, [...head(`${E.order2Title}: ${E.order2Sub}`), list([...new Set(L.order2.map((x) => x.verb))].map(verbPair).concat(G.order2.map(pair))), ...head(E.order2Gloss.join(" · "))]]];
    // The past tense.
    case "pastTable":
      return [[0, [pastPair(L.table), ...(nl ? [`${E.tableTitle}: ${E.tableSingular} ${E.endings[0]} · ${E.tablePlural} ${E.endings[1]}`, `${E.tableSingular}: ${list(L.pronouns.slice(0, 4).map(pair))}`, `${E.tablePlural}: ${list(L.pronouns.slice(4).map(pair))}`] : [])]]];
    case "pastExamples":
      return [[0, [...head(`${E.examplesTitle}: ${E.examplesSub}`), list(L.examples.map(pastPair))]]];
    case "pastNotes": {
      const q = pastForm(L.question.verb, "jij");
      return [[0, [...head(`${E.noteStemT} · ${E.noteQuestion}`), list([...L.stemT, L.question.verb].map(pastPair)), ...head(`Jij ${q} ${L.question.rest}. → ${q[0].toUpperCase() + q.slice(1)} jij ${L.question.rest}?`)]]];
    }
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
    const steps = sceneCaptions({ ...s, id }, L, lang);
    steps.forEach(([at, lines], i) => {
      const from = s.from + Math.max(at, 6);
      const to = i + 1 < steps.length ? s.from + steps[i + 1][0] : s.from + s.len - 4;
      cues.push({ from, to, lines });
    });
  }
  // *Dutch words* are italic on screen; captions are plain text.
  return cues.map((c, i) => `${i + 1}\n${stamp(c.from)} --> ${stamp(c.to)}\n${c.lines.join("\n").replace(/\*/g, "")}\n`).join("\n");
}

/** Every verb in the video once, in the order they come up. */
function verbIds(L) {
  if (L.tense === "past")
    return [...L.what.map((s) => s.verb), ...L.stems.flatMap((g) => g.verbs), ...L.kofschip.flatMap((g) => g.verbs), L.trap, L.table, ...L.examples, ...L.stemT, L.question.verb, ...L.quiz.map((q) => q.verb)];
  if (L.tense === "perfect")
    return [
      L.intro.verb,
      ...Object.values(L.auxTable),
      ...L.formula,
      ...L.kofschip.flatMap((g) => g.verbs),
      L.trap,
      ...L.notes.double,
      ...L.notes.noGe,
      ...L.irregular.flatMap((g) => g.verbs),
      ...L.zijn.flatMap((g) => g.verbs),
      ...L.contrast.map((c) => c.verb),
      L.order.verb,
      ...L.order2.map((s) => s.verb),
      ...L.quiz.map((q) => q.verb),
    ];
  return [L.intro, ...L.stems.flatMap((g) => g.verbs), L.table, ...L.examples, ...L.stemT.map((r) => r.verb), L.inversion.verb, ...L.quiz.map((q) => q.verb)];
}

/** One line per verb: "werken – to work", with the perfect "eten – heeft gegeten – to eat". */
function verbLines(L) {
  return [...new Set(verbIds(L))].map((id) => {
    const v = verb(id);
    if (L.tense === "past") return `${v.nl} – ${v.past.singular} / ${v.past.plural} – ${enShort(v.en)}`;
    if (L.tense !== "perfect") return `${v.nl} – ${v.en}`;
    const aux = v.aux.split("/").map((a) => auxForm(a, "hij")).join("/");
    return `${v.nl} – ${aux} ${v.participle} – ${enShort(v.en)}`;
  });
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
    ...verbLines(L),
    "",
    D.pronouns,
    ...L.pronouns.map(([nl, en]) => `${nl} – ${en}`),
    "",
    D.footer,
    SITE,
    "",
  ]
    .join("\n")
    .replace(/\*/g, ""); // *Dutch words* are italic on screen only
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
