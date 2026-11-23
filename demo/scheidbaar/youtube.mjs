// YouTube texts for the separable-verbs video (node scheidbaar/youtube.mjs, from demo/):
// the description with chapters and the verbs, and a caption track (.srt) with
// what Emma says and its English. Times come from separableTimeline.json.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const C = JSON.parse(readFileSync("remotion/separableVerbs.json", "utf8"));
const TL = JSON.parse(readFileSync("remotion/separableTimeline.json", "utf8"));
const at = Object.fromEntries(TL.scenes.map((t) => [t.id, t]));
const OUT = "out/lessons";
const SITE = "https://mijntaalstudio.nl";
const PAGE = { nl: `${SITE}/grammatica/scheidbare-werkwoorden/`, en: `${SITE}/en/grammar/scheidbare-werkwoorden/` };

const TEXT = {
  nl: {
    title: "Scheidbare werkwoorden: ik bel je op | Nederlandse grammatica A2 | Taal Studio",
    short: "Scheidbare werkwoorden: waar gaat het eerste deel heen? 🇳🇱 #shorts",
    lead: "Scheidbare werkwoorden (A2): twee delen, één betekenis. Waar staat het eerste deel in de hoofdzin, wanneer blijven de delen samen, en welke werkwoorden lijken op elkaar? Met 7 werkwoorden uit het dagelijks leven en een quiz met 6 vragen.",
    page: "📖 Uitleg op de site",
    cc: "💬 Vertalingen in het Engels: zet de ondertiteling (CC) aan.",
    shortLead: "Scheidbare werkwoorden: in een hoofdzin gaat het eerste deel naar het eind. Ik bel mijn moeder op.",
    full: "▶️ De hele les",
    chapters: "Hoofdstukken",
    chapterNames: ["Intro en de regel", "Zeven werkwoorden", "Soms blijven ze samen", "Let op: zelfde werkwoord", "Quiz"],
    verbs: "Werkwoorden in deze video",
    footer: "Taal Studio · Nederlands leren, op jouw niveau",
  },
  en: {
    title: "Dutch separable verbs (scheidbare werkwoorden): ik bel je op | Dutch grammar A2 | Taal Studio",
    short: "Dutch separable verbs: where does the first part go? 🇳🇱 #shorts",
    lead: "Dutch separable verbs (scheidbare werkwoorden, A2): two parts, one meaning. Where the first part goes in a main clause, when the parts stay together, and which verbs look alike. With 7 everyday verbs and a quiz with 6 questions.",
    page: "📖 Explanation on the site",
    cc: "💬 Turn on captions (CC) for what Emma says, with the English.",
    shortLead: "Dutch separable verbs: in a main clause, the first part goes to the end. Ik bel mijn moeder op.",
    full: "▶️ The full lesson",
    chapters: "Chapters",
    chapterNames: ["Intro and the rule", "Seven verbs", "When they stay together", "Watch out: same base verb", "Quiz"],
    verbs: "Verbs in this video",
    footer: "Taal Studio · Learn Dutch at your level",
  },
};

// Chapters must be 10 s or longer, so the short intro shares one with the rule, and
// the hint goes with "stay together".
const CHAPTER_AT = ["title", "opstaan", "together", "beware", "quizIntro"];
const time = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// Every verb with its "ik" form and English: opbellen – ik bel … op – to phone.
const VERBS = [
  ["opstaan", "ik sta … op", "to get up"],
  ["aankleden", "ik kleed me aan", "to get dressed"],
  ["opbellen", "ik bel … op", "to phone"],
  ["meenemen", "ik neem … mee", "to take along"],
  ["thuiskomen", "ik kom … thuis", "to come home"],
  ["afwassen", "ik was … af", "to do the dishes"],
  ["opruimen", "ik ruim … op", "to tidy up"],
  ["uitkleden", "ik kleed me uit", "to get undressed"],
  ["opnemen", "ik neem … op", "to answer (the phone)"],
  ["aannemen", "ik neem … aan", "to accept"],
  ["uitgaan", "ik ga uit", "to go out"],
  ["meedoen", "ik doe mee", "to join in"],
];

function description(lang, { short = false, fullUrl } = {}) {
  const T = TEXT[lang];
  if (short) return [T.shortLead, "", `${T.full}: ${fullUrl}`, `${T.page}: ${PAGE[lang]}`, "", T.footer, SITE, ""].join("\n");
  return [
    T.lead,
    "",
    `${T.page}: ${PAGE[lang]}`,
    T.cc,
    "",
    T.chapters,
    ...CHAPTER_AT.map((id, i) => `${time(at[id].start)} ${T.chapterNames[i]}`),
    "",
    T.verbs,
    ...VERBS.map((v) => v.join(" – ")),
    "",
    T.footer,
    SITE,
    "",
  ].join("\n");
}

const stamp = (s) => {
  const ms = Math.round(s * 1000);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

/** Captions: what Emma says, with the English. The Dutch video also gets the English of the headings. */
function srt(lang) {
  const E = C.text.en;
  const nl = lang === "nl";
  const plain = (s) => s.replace(/\*/g, "");
  const cues = [];
  const cue = (from, to, ...lines) => cues.push({ from, to, lines: lines.filter(Boolean) });
  for (const s of C.scenes) {
    const t = at[s.id];
    const end = t.start + t.dur - 0.2;
    const v = (i) => t.start + t.voice[i];
    switch (s.kind) {
      case "title":
        if (nl) cue(t.start + 0.3, end, `${E.title.lines.join(" ")}: ${plain(E.title.sub)}`);
        break;
      case "split":
        if (nl) cue(t.start + 0.3, end, `${E.split.kicker}: opbellen = to phone. ${E.split.sub}`);
        break;
      case "rule":
        if (nl) cue(t.start + 0.3, end, `${E.rule.kicker}: ${E.rule.labels.join(" + ")}`, `Ik bel mijn moeder op. = I call my mother. ${E.rule.note}`);
        break;
      case "verb":
        cue(v(0), v(1), `${s.inf.join("")} = ${s.gloss}`);
        cue(v(1), end, `${s.nl} = ${s.en}`);
        break;
      case "together":
        s.rows.forEach((r, i) => cue(v(i), i + 1 < s.rows.length ? v(i + 1) : end, nl ? `${E.together.kicker}: ${plain(i ? E.together.labels[1] : `${E.together.extra.lead} ${E.together.extra.verbs.map((x) => x.join(" = ")).join(", ")}`)}` : null, `${r.nl} = ${r.en}`));
        break;
      case "tip":
        if (nl) cue(t.start + 0.3, end, `Hint: ${plain(E.tip)}`);
        break;
      case "beware": {
        const all = s.groups.flatMap((g) => g.verbs);
        all.forEach((x, i) => cue(v(i), i + 1 < all.length ? v(i + 1) : end, nl && i === 0 ? `${plain(E.beware.kicker)} ${E.beware.title}` : null, `${x.inf.join("")} = ${x.en}`));
        break;
      }
      case "quizIntro":
        if (nl) cue(t.start + 0.3, end, `${E.quizIntro.title} ${E.quizIntro.sub}`);
        break;
      case "quiz": {
        const full = s.q.split("___").reduce((a, p, i) => a + (i ? s.ans[i - 1] : "") + p, "");
        cue(t.start + t.reveal, end, `${full} = ${s.en}`);
        break;
      }
      case "meaning":
        cue(t.start + t.reveal, end, `${s.nl} = ${s.options[s.answer]}`);
        break;
    }
  }
  return cues.map((c, i) => `${i + 1}\n${stamp(c.from)} --> ${stamp(c.to)}\n${c.lines.join("\n")}\n`).join("\n");
}

mkdirSync(OUT, { recursive: true });
const urls = JSON.parse(process.argv[2] ?? "{}"); // {"nl": "https://youtu.be/…", "en": …} once the long videos are up
for (const lang of ["nl", "en"]) {
  const L = lang.toUpperCase();
  const base = `${OUT}/lesson_scheidbaar`;
  writeFileSync(`${base}_title_${L}.txt`, `${TEXT[lang].title}\n`);
  writeFileSync(`${base}_description_${L}.txt`, description(lang));
  writeFileSync(`${base}_captions_${L}.srt`, srt(lang));
  writeFileSync(`${base}_short_title_${L}.txt`, `${TEXT[lang].short}\n`);
  writeFileSync(`${base}_short_description_${L}.txt`, description(lang, { short: true, fullUrl: urls[lang] ?? "(link to the long video)" }));
  console.log(`${base}_{title,description,captions,short_title,short_description}_${L}`);
}
