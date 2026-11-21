// Lesson reels: one short video per lesson that explains the grammar and ends
// with a quiz. Each lesson here is only text and verb ids; the verb forms come
// from the app's own data (src/data/words-verbs.json), so the video always
// says what the app says. See LessonReel.jsx for the scenes.
import VERBS from "../../src/data/words-verbs.json";
// Verbs the app has in its database (content_items) but words-verbs.json doesn't
// have yet (worden, blijven, kopen…): a verbatim export of those rows. Where a
// verb is in both, words-verbs.json wins.
import DB_VERBS from "./verbs-db.json";

const BY_ID = Object.fromEntries([...DB_VERBS, ...VERBS].map((v) => [v.id, v]));

/**
 * A verb from the app's data: { nl, en, stem, present: { ik, jij, hij, wij },
 * participle, aux ("hebben", "zijn" or "hebben/zijn") }.
 */
export function verb(id) {
  const v = BY_ID[id];
  if (!v) throw new Error(`Unknown verb ${id}`);
  const c = v.conjugation;
  return { nl: v.nl, en: v.en, stem: c.stem, present: c.present, participle: c.participle, aux: c.auxiliary };
}

export const cap = (s) => s[0].toUpperCase() + s.slice(1);

/** The English without the extra senses: "to stay / to remain" → "to stay". */
export const enShort = (en) => en.split(" / ")[0];

/** hebben or zijn for a person, from the data: auxForm("zijn", "hij") = "is". */
export const auxForm = (aux, person) => verb(`word.${aux}`).present[person];

/**
 * Which auxiliary a verb takes. `want` picks one where the sentence decides it
 * (naar huis fietsen: zijn); a verb with "hebben/zijn" in the data needs it.
 */
export function auxOf(id, want) {
  if (want) {
    if (want !== "hebben" && want !== "zijn") throw new Error(`aux ${want}?`);
    return want;
  }
  const a = verb(id).aux;
  if (a !== "hebben" && a !== "zijn") throw new Error(`${id} takes ${a}: say which`);
  return a;
}

/**
 * A perfect-tense sentence in pieces, the forms from the data:
 * { verb, person, text: "Gisteren [aux] ik in de tuin [part]." } →
 * [{ text: "Gisteren " }, { aux: "heb" }, { text: " ik in de tuin " }, { part: "gewerkt" }, { text: "." }]
 */
export function perfectParts({ verb: id, person, text, aux }) {
  const a = auxForm(auxOf(id, aux), person);
  return text
    .split(/(\[aux\]|\[part\])/)
    .filter(Boolean)
    .map((t, i) => (t === "[aux]" ? { aux: i ? a : cap(a) } : t === "[part]" ? { part: verb(id).participle } : { text: t }));
}
export const perfectText = (s) => perfectParts(s).map((p) => p.text ?? p.aux ?? p.part).join("");

/** The words that fill a quiz question's gap(s): the present form, or hebben/zijn and the participle. */
export function quizAnswers(q, tense = "present") {
  const v = verb(q.verb);
  const first = (s) => (q.capital ? cap(s) : s);
  if (tense !== "perfect") return [first(v.present[q.person])];
  return [first(auxForm(auxOf(q.verb, q.aux), q.person)), v.participle];
}

// 't kofschip: the consonants that make a regular participle end in -t.
export const KOFSCHIP = ["t", "k", "f", "s", "ch", "p", "x"];

/**
 * Why a regular participle ends in t or d. Look at the verb without -en, before
 * any spelling change (reizen → reiz: z, so -d): { raw, last, end: "t" | "d" }.
 * Throws when the data's participle doesn't follow the rule.
 */
export function kofschip(id) {
  const v = verb(id);
  const raw = v.nl.slice(0, -2);
  const last = raw.endsWith("ch") ? "ch" : raw.slice(-1);
  const end = KOFSCHIP.includes(last) ? "t" : "d";
  if (!v.participle.endsWith(end)) throw new Error(`${id}: ${v.participle} doesn't end in -${end}`);
  return { raw, last, end };
}

/** A regular participle in its pieces: gewerkt → { pre: "ge", stem: "werk", end: "t" }; gewacht → end "". */
export function participleParts(id) {
  const v = verb(id);
  const p = v.participle;
  const pre = p.startsWith(`ge${v.stem}`) ? "ge" : "";
  if (!p.slice(pre.length).startsWith(v.stem)) throw new Error(`${id}: ${p} isn't ge- + ${v.stem} + t/d`);
  return { pre, stem: v.stem, end: p.slice(pre.length + v.stem.length) };
}

/**
 * Text with forms from the data: {p:werken} the participle, {s:reizen} the stem,
 * {nl:eten} the infinitive, {a:zijn:hij} hebben/zijn for a person.
 */
export function fill(text) {
  return text.replace(/\{(p|s|nl|a):([^}:]+)(?::([^}]+))?\}/g, (_, k, w, person) => {
    if (k === "a") return auxForm(w, person);
    const v = verb(`word.${w}`);
    return k === "p" ? v.participle : k === "s" ? v.stem : v.nl;
  });
}

export const LESSONS = {
  // A1: "Werkwoorden tegenwoordige tijd" (regular verbs in the present tense)
  "present-regular": {
    level: "A1",
    // Infinitive → stem, each with what to watch for.
    stems: [
      { verb: "word.werken" },
      { verb: "word.maken", note: "aa" },
      { verb: "word.zetten", note: "tt" },
      { verb: "word.reizen", note: "zs" },
    ],
    table: "word.werken",
    // The quiz: a sentence with a gap; the answer is the verb's form for that person.
    quiz: [
      { verb: "word.wonen", person: "hij", sentence: "Hij ___ in Rotterdam.", note: "plusT" },
      // "Zij" could be plural too (zij zetten), so a clear singular subject.
      { verb: "word.zetten", person: "hij", sentence: "Mijn moeder ___ koffie.", note: "oneT" },
      // Jij after the verb: the form without -t, the same as for ik.
      { verb: "word.werken", person: "ik", sentence: "___ jij morgen?", note: "question", capital: true },
    ],
    text: {
      nl: {
        title: ["Werkwoorden:", "de tegenwoordige tijd"],
        sub: "Regelmatige werkwoorden in één minuut",
        stemTitle: "1. Zoek de stam",
        stemSub: "Haal -en van het hele werkwoord af",
        stemNote: { aa: "lange klank? schrijf aa", tt: "één t is genoeg", zs: "z wordt s" },
        tableTitle: "2. Plak de uitgang erachter",
        persons: ["ik", "jij / u", "hij / zij / het", "wij / jullie / zij"],
        endings: ["stam", "stam + t", "stam + t", "hele werkwoord"],
        trapTitle: "Let op!",
        trapFrom: "Jij werkt.",
        trapTo: "Werk jij?",
        trapSub: "jij achter het werkwoord: geen -t",
        quizTitle: "Nu jij!",
        quizSub: "Zet je antwoorden in de comments",
        quizNote: {
          plusT: "woon + t",
          oneT: "zet + t = zet",
          question: "jij erachter: geen -t",
        },
        gloss: {},
        outro: "Hele les op ons kanaal ▶",
      },
      en: {
        title: ["Dutch verbs:", "the present tense"],
        sub: "Regular verbs in one minute",
        stemTitle: "1. Find the stem",
        stemSub: "Take -en off the infinitive",
        stemNote: { aa: "long sound? write aa", tt: "one t is enough", zs: "z becomes s" },
        tableTitle: "2. Add the ending",
        persons: ["ik", "jij / u", "hij / zij / het", "wij / jullie / zij"],
        endings: ["stem", "stem + t", "stem + t", "whole verb"],
        trapTitle: "Watch out!",
        trapFrom: "Jij werkt.",
        trapTo: "Werk jij?",
        trapSub: "jij after the verb: no -t",
        quizTitle: "Your turn!",
        quizSub: "Drop your answers in the comments",
        quizNote: {
          plusT: "woon + t",
          oneT: "zet + t = zet",
          question: "jij after the verb: no -t",
        },
        // What the quiz sentences mean, for English speakers.
        gloss: {
          "Hij ___ in Rotterdam.": "He lives in Rotterdam.",
          "Mijn moeder ___ koffie.": "My mother makes coffee.",
          "___ jij morgen?": "Are you working tomorrow?",
        },
        outro: "Full lesson on our channel ▶",
      },
    },
  },

  // A2: "Nog meer perfectum: regelmatige en onregelmatige werkwoorden" (topic.perfectum)
  perfectum: {
    tense: "perfect",
    level: "A2",
    // What it is, like the English "I have eaten".
    what: { verb: "word.eten", person: "ik", text: "Ik [aux] taart [part].", en: "I {have} {eaten} cake." },
    // 1. Ik werk. → Ik heb gewerkt.
    form: { verb: "word.werken", person: "ik", text: "Ik [aux] [part]." },
    // 2. ge- + stem + t/d: one -t, one -d, and the z that becomes s in the stem.
    kofschip: ["word.werken", "word.bellen", "word.reizen"],
    // 3. zijn: movement and change.
    zijn: ["word.gaan", "word.komen", "word.worden", "word.blijven"],
    quiz: [
      { verb: "word.kopen", person: "ik", sentence: "Ik ___ een nieuwe fiets ___.", note: "irregular" },
      { verb: "word.blijven", person: "wij", sentence: "Wij ___ gisteren thuis ___.", note: "zijn" },
      { verb: "word.reizen", person: "wij", sentence: "Mijn ouders ___ door Europa ___.", note: "z" },
    ],
    text: {
      nl: {
        title: ["Praten over", "het verleden"],
        sub: "Het perfectum in één minuut",
        whatTitle: "Wat is het perfectum?",
        whatSub: "Net als in het Engels",
        whatLabels: ["Nederlands", "Engels"],
        formTitle: "1. hebben/zijn + deelwoord",
        formSub: "Het deelwoord staat achteraan",
        now: "Nu",
        past: "Gisteren",
        formLabels: ["hebben / zijn", "voltooid deelwoord"],
        formGloss: [],
        kofTitle: "2. ge- + stam + t/d",
        kofSub: "Letter in 't kofschip? -t. Anders -d.",
        kofHint: "Kijk naar het werkwoord zonder -en",
        zijnTitle: "3. Soms zijn",
        zijnSub: "Bij beweging en verandering",
        quizTitle: "Nu jij!",
        quizSub: "Zet je antwoorden in de comments",
        quizNote: {
          irregular: "onregelmatig: uit je hoofd",
          zijn: "blijven gaat met zijn",
          z: "z staat niet in 't kofschip: -d",
        },
        gloss: {},
        // The end screen: where the full lesson is (Instagram has no channel of its own to point to).
        outro: ["Hele les + extra oefenen", "op YouTube ▶"],
        outroLink: "youtube.com/@mijntaalstudio",
      },
      en: {
        title: ["Talking about", "the past"],
        sub: "The Dutch perfect tense in one minute",
        whatTitle: "What is the perfect?",
        whatSub: "Just like in English",
        whatLabels: ["Dutch", "English"],
        formTitle: "1. hebben/zijn + participle",
        formSub: "The participle goes at the end",
        now: "Now",
        past: "Yesterday",
        formLabels: ["hebben / zijn", "past participle"],
        formGloss: ["I work.", "I worked."],
        kofTitle: "2. ge- + stem + t/d",
        kofSub: "Letter in 't kofschip? -t. Otherwise -d.",
        kofHint: "Look at the verb without -en",
        zijnTitle: "3. Sometimes zijn",
        zijnSub: "For movement and change",
        quizTitle: "Your turn!",
        quizSub: "Drop your answers in the comments",
        quizNote: {
          irregular: "irregular: learn it by heart",
          zijn: "blijven takes zijn",
          z: "z isn't in 't kofschip: -d",
        },
        gloss: {
          "Ik ___ een nieuwe fiets ___.": "I bought a new bike.",
          "Wij ___ gisteren thuis ___.": "We stayed at home yesterday.",
          "Mijn ouders ___ door Europa ___.": "My parents travelled around Europe.",
        },
        outro: ["Full lesson + extra practice", "on YouTube ▶"],
        outroLink: "youtube.com/@mijntaalstudio",
      },
    },
  },
};

// Full lesson videos (16:9, a few minutes, for YouTube and the grammar page).
// They follow the grammar page /grammatica/<slug>/ step by step (the topic's
// "short" text from public_topics()), so the video and the site say the same.
// Like the reels: only text and verb ids; the verb forms come from the app.
export const LESSON_VIDEOS = {
  "present-regular": {
    level: "A1",
    slug: "werkwoorden-vervoegen", // the grammar page
    music: "music/after-sunset.mp3", // in raw/, see MUSIC.md
    intro: "word.werken",
    // Step 1, the stem: -en off; when that is not the stem yet, the spelling rule fixes it.
    stems: [
      { key: "basic", verbs: ["word.werken", "word.fietsen", "word.luisteren"] },
      { key: "long", verbs: ["word.maken", "word.wonen", "word.spelen"] },
      { key: "double", verbs: ["word.zetten", "word.bakken", "word.zwemmen"] },
      { key: "fs", verbs: ["word.schrijven", "word.reizen", "word.lezen"] },
    ],
    // Step 2: the whole table, then the same endings on other verbs.
    table: "word.werken",
    examples: ["word.wonen", "word.reizen", "word.spelen"],
    // Step 3: the stem already ends in t, so no extra t.
    stemT: [
      { verb: "word.praten", person: "jij", subject: "jij" },
      { verb: "word.zetten", person: "hij", subject: "hij" },
      { verb: "word.wachten", person: "jij", subject: "u" },
    ],
    // Step 4: jij after the verb.
    inversion: { verb: "word.spelen", rest: "tennis", first: "Vandaag" },
    // Words on screen that aren't verbs, with their English, for the translation
    // captions (CC) and the description. Per scene kind.
    glossary: {
      hook: [["werkwoord", "verb"], ["tegenwoordige tijd", "present tense"], ["regelmatig", "regular"]],
      agenda: [["stam", "stem"], ["uitgang", "ending"], ["werkwoord", "verb"]],
      intro: [["onderwerp", "subject"], ["hele werkwoord", "infinitive (whole verb)"]],
      inversion: [["vandaag", "today"]],
      inversionNote: [["Praat jij?", "Are you talking?"], ["Werkt hij?", "Does he work?"], ["Werkt u?", "Do you work?"]],
    },
    pronouns: [["ik", "I"], ["jij / je", "you"], ["u", "you (polite)"], ["hij / zij / het", "he / she / it"], ["wij / we", "we"], ["jullie", "you (plural)"], ["zij / ze", "they"]],
    quiz: [
      { verb: "word.wonen", person: "ik", sentence: "Ik ___ in Rotterdam.", note: "ik" },
      { verb: "word.werken", person: "hij", sentence: "Hij ___ bij een bank.", note: "plusT" },
      { verb: "word.leren", person: "wij", sentence: "Wij ___ Nederlands.", note: "wij" },
      { verb: "word.praten", person: "jij", sentence: "Jij ___ te snel.", note: "stemT" },
      { verb: "word.werken", person: "ik", sentence: "___ jij morgen?", note: "inversion", capital: true },
      { verb: "word.reizen", person: "wij", sentence: "Jullie ___ naar Spanje.", note: "jullie" },
      { verb: "word.lezen", person: "ik", sentence: "Wat ___ jij?", note: "inversion" },
      { verb: "word.zetten", person: "hij", sentence: "Mijn moeder ___ koffie.", note: "stemT" },
    ],
    text: {
      nl: {
        topic: "Tegenwoordige tijd",
        thumb: ["Werkwoorden", "tegenwoordige tijd"],
        title: ["Regelmatige werkwoorden", "in de tegenwoordige tijd"],
        sub: "Uitleg in 4 stappen · daarna een quiz",
        chapters: { intro: "Intro", stem: "De stam", ending: "De uitgang", stemT: "Stam op -t", inversion: "Jij achter het werkwoord", summary: "Samenvatting", quiz: "Quiz" },
        agendaTitle: "In deze les",
        ccHint: "Vertalingen? Zet de ondertiteling (CC) aan",
        introTitle: "Het werkwoord verandert met het onderwerp",
        introLabels: ["stam", "stam + t", "hele werkwoord"],
        rule: "ik: stam  ·  jij / hij: stam + t  ·  wij / jullie / zij: hele werkwoord",
        chapterSub: {
          stem: "Haal -en van het hele werkwoord",
          ending: "ik, jij, hij, wij…",
          stemT: "Geen dubbele t",
          inversion: "Een vraag, of iets ervoor",
        },
        stems: {
          basic: { title: "Haal -en eraf", sub: "Wat overblijft, is de stam" },
          long: { title: "Lange klank? Houd hem lang", sub: "Schrijf twee klinkers", why: "In ma-ken hoor je een lange a. In mak klinkt hij kort, dus schrijf je maak." },
          double: { title: "Dubbele medeklinker? Eén is genoeg", sub: "Aan het eind schrijf je er één", why: "zett, bakk en zwemm bestaan niet: aan het eind van een woord nooit twee dezelfde." },
          fs: { title: "v wordt f, z wordt s", sub: "Aan het eind van de stam (meestal)", why: "Een Nederlands woord eindigt (bijna) nooit op v of z. Bij lezen: lange e én z → s." },
        },
        tableSingular: "Enkelvoud",
        tablePlural: "Meervoud",
        persons: { ik: "ik", jij: "jij / je", u: "u", hij: "hij / zij / het", wij: "wij / we", jullie: "jullie", zij: "zij / ze" },
        endings: ["stam", "stam + t", "hele werkwoord"],
        examplesTitle: "Zelfde uitgang, andere werkwoorden",
        examplesSub: "Let op de spelling van de stam",
        stemTTitle: "Stam eindigt op -t? Geen extra t",
        stemTSub: "Je schrijft nooit tt aan het eind",
        stemTNote: "Je hoort maar één t, en je schrijft er ook maar één.",
        inversionTitle: "Jij achter het werkwoord? Geen -t",
        inversionSub: "In een vraag, of als er iets vóór het werkwoord staat",
        inversionGloss: [],
        noteTitle: "Let op",
        noteStemT: "Een t van de stam blijft",
        noteOthers: "Alleen bij jij / je valt de t weg",
        summaryTitle: "Samenvatting",
        summary: [
          ["De stam", "hele werkwoord − en  (maak · zet · schrijf · reis)"],
          ["ik", "stam: ik werk"],
          ["jij / u / hij / zij / het", "stam + t: jij werkt"],
          ["wij / jullie / zij", "hele werkwoord: wij werken"],
          ["Stam op -t", "geen extra t: jij praat"],
          ["Jij erachter", "geen -t: werk jij?"],
        ],
        quizTitle: "Nu jij!",
        quizSub: "8 vragen · pauzeer de video als je meer tijd nodig hebt",
        quizNote: {
          ik: "ik: stam (woon)",
          plusT: "hij: werk + t",
          wij: "wij: hele werkwoord",
          stemT: "stam op t: geen extra t",
          inversion: "jij erachter: geen -t",
          jullie: "jullie: hele werkwoord",
        },
        gloss: {},
        outroTitle: "Oefen deze werkwoorden in de app",
        outroUrl: "mijntaalstudio.nl/grammatica/werkwoorden-vervoegen",
        outroCta: "Abonneer je voor meer lessen",
        description: {
          lead: "Regelmatige werkwoorden in de tegenwoordige tijd (A1), in 4 stappen: de stam, de uitgang, een stam op -t en jij achter het werkwoord. Daarna een quiz met 8 vragen.",
          page: "📖 Uitleg op de site",
          cc: "💬 Vertalingen in het Engels: zet de ondertiteling (CC) aan.",
          chapters: "Hoofdstukken",
          verbs: "Werkwoorden in deze video",
          pronouns: "Persoonlijke voornaamwoorden",
          footer: "Taal Studio · Nederlands leren, op jouw niveau",
        },
      },
      en: {
        topic: "Present tense",
        thumb: ["Dutch verbs", "present tense"],
        title: ["Dutch regular verbs", "in the present tense"],
        sub: "Explained in 4 steps · then a quiz",
        chapters: { intro: "Intro", stem: "The stem", ending: "The ending", stemT: "Stem ending in -t", inversion: "Jij after the verb", summary: "Summary", quiz: "Quiz" },
        agendaTitle: "In this lesson",
        ccHint: "Translations? Turn on captions (CC)",
        introTitle: "The verb changes with the subject",
        introLabels: ["stem", "stem + t", "whole verb"],
        rule: "ik: stem  ·  jij / hij: stem + t  ·  wij / jullie / zij: whole verb",
        chapterSub: {
          stem: "Take -en off the infinitive",
          ending: "ik, jij, hij, wij…",
          stemT: "No double t",
          inversion: "A question, or something in front",
        },
        stems: {
          basic: { title: "Take off -en", sub: "What is left is the stem" },
          long: { title: "Long sound? Keep it long", sub: "Write two vowels", why: "In ma-ken you hear a long a. In mak it sounds short, so you write maak." },
          double: { title: "Double consonant? One is enough", sub: "At the end you write just one", why: "zett, bakk and zwemm don't exist: a word never ends in two of the same." },
          fs: { title: "v becomes f, z becomes s", sub: "At the end of the stem (usually)", why: "A Dutch word (almost) never ends in v or z. lezen: long e and z → s." },
        },
        tableSingular: "Singular",
        tablePlural: "Plural",
        persons: { ik: "ik · I", jij: "jij / je · you", u: "u · you (polite)", hij: "hij / zij / het · he / she / it", wij: "wij / we · we", jullie: "jullie · you (plural)", zij: "zij / ze · they" },
        endings: ["stem", "stem + t", "whole verb"],
        examplesTitle: "Same endings, other verbs",
        examplesSub: "Watch the spelling of the stem",
        stemTTitle: "Stem ends in -t? No extra t",
        stemTSub: "You never write tt at the end",
        stemTNote: "You hear one t, and you write one t.",
        inversionTitle: "Jij after the verb? No -t",
        inversionSub: "In a question, or when something comes before the verb",
        inversionGloss: ["You play tennis.", "Do you play tennis?", "Today you play tennis."],
        noteTitle: "Watch out",
        noteStemT: "A t from the stem stays",
        noteOthers: "Only jij / je lose the t",
        summaryTitle: "Summary",
        summary: [
          ["The stem", "whole verb − en  (maak · zet · schrijf · reis)"],
          ["ik", "stem: ik werk"],
          ["jij / u / hij / zij / het", "stem + t: jij werkt"],
          ["wij / jullie / zij", "whole verb: wij werken"],
          ["Stem ends in -t", "no extra t: jij praat"],
          ["Jij after the verb", "no -t: werk jij?"],
        ],
        quizTitle: "Your turn!",
        quizSub: "8 questions · pause the video if you need more time",
        quizNote: {
          ik: "ik: stem (woon)",
          plusT: "hij: werk + t",
          wij: "wij: whole verb",
          stemT: "stem ends in t: no extra t",
          inversion: "jij after the verb: no -t",
          jullie: "jullie: whole verb",
        },
        gloss: {
          "Ik ___ in Rotterdam.": "I live in Rotterdam.",
          "Hij ___ bij een bank.": "He works at a bank.",
          "Wij ___ Nederlands.": "We are learning Dutch.",
          "Jij ___ te snel.": "You talk too fast.",
          "___ jij morgen?": "Are you working tomorrow?",
          "Jullie ___ naar Spanje.": "You (all) are travelling to Spain.",
          "Wat ___ jij?": "What are you reading?",
          "Mijn moeder ___ koffie.": "My mother makes coffee.",
        },
        outroTitle: "Practise these verbs in the app",
        outroUrl: "mijntaalstudio.nl/en/grammar/werkwoorden-vervoegen",
        outroCta: "Subscribe for more lessons",
        description: {
          lead: "Dutch regular verbs in the present tense (A1), in 4 steps: the stem, the ending, a stem ending in -t, and jij after the verb. Then a quiz with 8 questions.",
          page: "📖 Explanation on the site",
          cc: "💬 Translations of the Dutch words: turn on captions (CC).",
          chapters: "Chapters",
          verbs: "Verbs in this video",
          pronouns: "Personal pronouns",
          footer: "Taal Studio · Learn Dutch at your level",
        },
      },
    },
  },

  // The perfect tense (A2), after the grammar page /grammatica/perfectum/ and the
  // lesson "Nog meer perfectum". The sentences come from the app's sentence sets
  // (mijn-eerste-perfectum-zinnen, nog-meer-perfectum-zinnen, perfectum-hebben-of-zijn).
  // In sentences, [aux] and [part] are filled from the data.
  perfectum: {
    tense: "perfect",
    level: "A2",
    slug: "perfectum",
    music: "music/after-sunset.mp3",
    chapters: ["form", "regular", "irregular", "aux", "order", "quiz"],
    // What it is: talking about the past, like the English "I have eaten".
    // en: {…} marks hebben/zijn (orange) and the participle (green), as on the Dutch line.
    what: [
      { verb: "word.eten", person: "ik", text: "Ik [aux] taart [part].", en: "I {have} {eaten} cake." },
      { verb: "word.werken", person: "ik", text: "Ik [aux] gisteren [part].", en: "I {worked} yesterday." },
    ],
    // 1. The form: Ik werk. → Ik heb gewerkt. Then hebben and zijn in a table.
    intro: { verb: "word.werken", person: "ik", text: "Ik [aux] [part]." },
    auxTable: { hebben: "word.werken", zijn: "word.gaan" },
    // 2. Regular: ge- + stem + t/d, 't kofschip, the z of reizen, and two things to watch.
    formula: ["word.werken", "word.bellen"],
    kofschip: [
      { key: "t", verbs: ["word.werken", "word.fietsen", "word.maken"] },
      { key: "d", verbs: ["word.bellen", "word.wonen", "word.spelen"] },
    ],
    trap: "word.reizen",
    notes: { double: ["word.wachten", "word.praten"], noGe: ["word.bestellen", "word.vertellen"] },
    // 3. Irregular: learn them by heart.
    irregular: [
      { key: "en", verbs: ["word.eten", "word.drinken", "word.zien", "word.schrijven", "word.nemen", "word.lezen"] },
      { key: "other", verbs: ["word.doen", "word.kopen", "word.brengen", "word.denken", "word.hebben", "word.zijn"] },
    ],
    // 4. hebben or zijn. Every verb here can take zijn (the data says zijn or hebben/zijn).
    zijn: [
      { key: "move", verbs: ["word.gaan", "word.komen", "word.vertrekken"] },
      { key: "change", verbs: ["word.worden", "word.beginnen"] },
      { key: "also", verbs: ["word.blijven", "word.zijn"] },
    ],
    contrast: [
      { verb: "word.fietsen", person: "ik", aux: "hebben", text: "Ik [aux] een uur [part].", label: "activity" },
      { verb: "word.fietsen", person: "ik", aux: "zijn", text: "Ik [aux] naar huis [part].", label: "destination" },
    ],
    // 5. Word order: the participle at the end, whatever comes in between.
    order: { verb: "word.werken", person: "ik", subject: "Ik", rest: "gisteren in de tuin" },
    order2: [
      { verb: "word.werken", person: "ik", text: "Ik [aux] gisteren in de tuin [part]." },
      { verb: "word.werken", person: "ik", text: "Gisteren [aux] ik in de tuin [part]." },
      // jij after the verb: heb jij (the ik form, no -t).
      { verb: "word.eten", person: "ik", text: "[aux] jij al [part]?" },
    ],
    glossary: {
      hook: [["perfectum", "perfect tense"], ["voltooid deelwoord", "past participle"], ["hulpwerkwoord", "auxiliary verb (hebben / zijn)"]],
      agenda: [["vorm", "form"], ["regelmatig", "regular"], ["onregelmatig", "irregular"], ["woordvolgorde", "word order"]],
      what: [["taart", "cake"], ["gisteren", "yesterday"], ["vorige week", "last week"]],
      form: [["nu", "now"], ["gisteren", "yesterday"], ["onderwerp", "subject"]],
      contrast: [["een uur", "for an hour"], ["naar huis", "home"]],
      order: [["gisteren", "yesterday"], ["in de tuin", "in the garden"]],
      order2: [["al", "already"]],
    },
    pronouns: [["ik", "I"], ["jij / je", "you"], ["u", "you (polite)"], ["hij / zij / het", "he / she / it"], ["wij / we", "we"], ["jullie", "you (plural)"], ["zij / ze", "they"]],
    quiz: [
      { verb: "word.werken", person: "ik", sentence: "Ik ___ gisteren in de tuin ___.", note: "kofT" },
      { verb: "word.bellen", person: "wij", sentence: "De buren ___ de huisarts ___.", note: "kofD" },
      { verb: "word.reizen", person: "wij", sentence: "Mijn ouders ___ door Europa ___.", note: "z" },
      { verb: "word.nemen", person: "hij", sentence: "Hij ___ vanmorgen de bus ___.", note: "irregular" },
      { verb: "word.komen", person: "wij", sentence: "Jullie ___ gisteren op tijd ___.", note: "move" },
      { verb: "word.worden", person: "hij", sentence: "Mijn broer ___ vader ___.", note: "change" },
      { verb: "word.vertellen", person: "hij", sentence: "Mijn zus ___ een grappig verhaal ___.", note: "noGe" },
      // jij after the verb: heb jij (the ik form).
      { verb: "word.eten", person: "ik", sentence: "___ jij al ___?", note: "question", capital: true },
    ],
    text: {
      nl: {
        topic: "Perfectum",
        thumb: ["Het perfectum", "uitgelegd"],
        title: ["Praten over", "het verleden"],
        sub: "Het perfectum in 5 stappen · daarna een quiz",
        chapters: { intro: "Intro", form: "De vorm", regular: "Regelmatig", irregular: "Onregelmatig", aux: "Hebben of zijn", order: "Woordvolgorde", summary: "Samenvatting", quiz: "Quiz" },
        agendaTitle: "In deze les",
        ccHint: "Vertalingen? Zet de ondertiteling (CC) aan",
        whatTitle: "Wat is het perfectum?",
        whatSub: "Je praat over het verleden: wat je hebt gedaan of wat er is gebeurd",
        whatLabels: ["Nederlands", "Engels"],
        whatNote: "Het Nederlands gebruikt het perfectum ook bij gisteren en vorige week. In het Engels is dat vaak de past simple.",
        chapterSub: {
          form: "hebben/zijn + voltooid deelwoord",
          regular: "ge- + stam + t/d",
          irregular: "Leer ze uit je hoofd",
          aux: "Meestal hebben, soms zijn",
          order: "Het deelwoord staat achteraan",
        },
        formTitle: "Vertel wat er is gebeurd",
        now: "Nu",
        past: "Gisteren",
        formLabels: ["hebben / zijn", "voltooid deelwoord"],
        formGloss: [],
        rule: "onderwerp + hebben/zijn + … + voltooid deelwoord",
        auxTitle: "Vervoeg hebben of zijn",
        auxSub: "Het deelwoord blijft hetzelfde",
        persons: { ik: "ik", jij: "jij / je", hij: "hij / zij / het", wij: "wij / jullie / zij" },
        formulaTitle: "Regelmatig: ge- + stam + t/d",
        formulaSub: "Zo maak je het voltooid deelwoord",
        formulaLabels: ["ge-", "stam", "t of d"],
        kofschip: {
          t: { title: "Letter uit 't kofschip? Dan -t", sub: "Kijk naar het werkwoord zonder -en" },
          d: { title: "Een andere letter? Dan -d", sub: "Alles wat niet in 't kofschip staat" },
        },
        kofWhy: "= t, k, f, s, ch, p (en x)",
        trapTitle: "Let op: kijk vóór de spelling verandert",
        trapSub: "Niet naar de stam, maar naar het werkwoord zonder -en",
        trapLabels: ["stam", "zonder -en"],
        trapWhy: "De stam is {s:reizen}, maar {nl:reizen} heeft een z. De z staat niet in 't kofschip, dus -d.",
        noteTitle: "Let op",
        noteDouble: "Eindigt de stam al op t of d? Niet dubbel",
        noteNoGe: "be-, ver-, ont-…? Geen ge-",
        irregular: {
          en: { title: "Onregelmatig: leer ze uit je hoofd", sub: "Vaak met -en, soms met een andere klinker" },
          other: { title: "Nog meer onregelmatige vormen", sub: "Ook op -cht, en hebben en zijn zelf" },
        },
        irregularTip: "Leer het hele blokje: {nl:eten} – {a:hebben:hij} {p:eten} · {nl:komen} – {a:zijn:hij} {p:komen}",
        zijnTitle: "Meestal hebben, soms zijn",
        zijnSub: "Zijn bij beweging naar een plek en bij verandering",
        zijnGroups: { move: "Beweging naar een plek", change: "Verandering", also: "En ook" },
        contrastTitle: "Bewegen zonder bestemming? Hebben",
        contrastSub: "Alleen bewegen is niet genoeg",
        contrastLabels: { activity: "activiteit: hoe lang?", destination: "bestemming: waarheen?" },
        contrastGloss: [],
        orderTitle: "Het deelwoord staat achteraan",
        orderSub: "Wat je toevoegt, komt ervoor",
        orderLabels: ["onderwerp", "hebben / zijn", "de rest", "voltooid deelwoord"],
        orderGloss: "",
        order2Title: "Iets ervoor, of een vraag?",
        order2Sub: "hebben/zijn ruilt van plek, het deelwoord blijft achteraan",
        order2Gloss: [],
        summaryTitle: "Samenvatting",
        summary: [
          ["De vorm", "hebben/zijn + voltooid deelwoord"],
          ["Regelmatig", "ge- + stam + t/d: {p:werken} · {p:bellen}"],
          ["'t kofschip", "t k f s ch p → -t, anders -d"],
          ["Onregelmatig", "uit je hoofd: {p:eten} · {p:kopen}"],
          ["Zijn", "beweging, verandering: {a:zijn:hij} {p:gaan}"],
          ["Woordvolgorde", "Ik {a:hebben:ik} gisteren {p:werken}."],
        ],
        quizTitle: "Nu jij!",
        quizSub: "8 vragen · vul hebben/zijn én het deelwoord in",
        quizNote: {
          kofT: "k staat in 't kofschip: -t",
          kofD: "l staat niet in 't kofschip: -d",
          z: "z staat niet in 't kofschip: -d",
          irregular: "onregelmatig: uit je hoofd",
          move: "beweging naar een plek: zijn",
          change: "verandering: zijn",
          noGe: "ver-: geen ge-",
          question: "vraag: hebben vooraan, deelwoord achteraan",
        },
        gloss: {},
        outroTitle: "Oefen het perfectum in de app",
        outroUrl: "mijntaalstudio.nl/grammatica/perfectum",
        outroCta: "Abonneer je voor meer lessen",
        description: {
          lead: "Het perfectum (voltooid tegenwoordige tijd, A2) in 5 stappen: de vorm, regelmatige deelwoorden met 't kofschip, onregelmatige deelwoorden, hebben of zijn, en de woordvolgorde. Daarna een quiz met 8 vragen.",
          page: "📖 Uitleg op de site",
          cc: "💬 Vertalingen in het Engels: zet de ondertiteling (CC) aan.",
          chapters: "Hoofdstukken",
          verbs: "Werkwoorden in deze video",
          pronouns: "Persoonlijke voornaamwoorden",
          footer: "Taal Studio · Nederlands leren, op jouw niveau",
        },
      },
      en: {
        topic: "Perfect tense",
        thumb: ["Dutch perfect", "explained"],
        title: ["Talking about", "the past"],
        sub: "The Dutch perfect tense in 5 steps · then a quiz",
        chapters: { intro: "Intro", form: "The form", regular: "Regular", irregular: "Irregular", aux: "Hebben or zijn", order: "Word order", summary: "Summary", quiz: "Quiz" },
        agendaTitle: "In this lesson",
        ccHint: "Translations? Turn on captions (CC)",
        whatTitle: "What is the perfect tense?",
        whatSub: "You talk about the past: what you did or what has happened",
        whatLabels: ["Dutch", "English"],
        whatNote: "Dutch also uses the perfect with gisteren (yesterday) and vorige week (last week), where English often uses the past simple.",
        chapterSub: {
          form: "hebben/zijn + past participle",
          regular: "ge- + stem + t/d",
          irregular: "Learn them by heart",
          aux: "Usually hebben, sometimes zijn",
          order: "The participle goes at the end",
        },
        formTitle: "Say what has happened",
        now: "Now",
        past: "Yesterday",
        formLabels: ["hebben / zijn", "past participle"],
        formGloss: ["I work.", "I worked."],
        rule: "subject + hebben/zijn + … + past participle",
        auxTitle: "Conjugate hebben or zijn",
        auxSub: "The participle stays the same",
        persons: { ik: "ik · I", jij: "jij / je · you", hij: "hij / zij / het · he / she / it", wij: "wij / jullie / zij · we / you / they" },
        formulaTitle: "Regular: ge- + stem + t/d",
        formulaSub: "How to make the past participle",
        formulaLabels: ["ge-", "stem", "t or d"],
        kofschip: {
          t: { title: "Letter from 't kofschip? Then -t", sub: "Look at the verb without -en" },
          d: { title: "Any other letter? Then -d", sub: "Everything that isn't in 't kofschip" },
        },
        kofWhy: "= t, k, f, s, ch, p (and x)",
        trapTitle: "Watch out: look before the spelling changes",
        trapSub: "Not at the stem, but at the verb without -en",
        trapLabels: ["stem", "without -en"],
        trapWhy: "The stem is {s:reizen}, but {nl:reizen} has a z. z isn't in 't kofschip, so -d.",
        noteTitle: "Watch out",
        noteDouble: "Stem already ends in t or d? Don't double it",
        noteNoGe: "be-, ver-, ont-…? No ge-",
        irregular: {
          en: { title: "Irregular: learn them by heart", sub: "Often with -en, sometimes with another vowel" },
          other: { title: "More irregular forms", sub: "Also -cht, and hebben and zijn themselves" },
        },
        irregularTip: "Learn the whole phrase: {nl:eten} – {a:hebben:hij} {p:eten} · {nl:komen} – {a:zijn:hij} {p:komen}",
        zijnTitle: "Usually hebben, sometimes zijn",
        zijnSub: "Zijn for movement to a place and for change",
        zijnGroups: { move: "Movement to a place", change: "Change", also: "And also" },
        contrastTitle: "Moving without a destination? Hebben",
        contrastSub: "Movement alone is not enough",
        contrastLabels: { activity: "activity: how long?", destination: "destination: where to?" },
        contrastGloss: ["I cycled for an hour.", "I cycled home."],
        orderTitle: "The participle goes at the end",
        orderSub: "Anything you add goes before it",
        orderLabels: ["subject", "hebben / zijn", "the rest", "past participle"],
        orderGloss: "I worked in the garden yesterday.",
        order2Title: "Something in front, or a question?",
        order2Sub: "hebben/zijn swaps places, the participle stays at the end",
        order2Gloss: ["I worked in the garden yesterday.", "Yesterday I worked in the garden.", "Have you eaten yet?"],
        summaryTitle: "Summary",
        summary: [
          ["The form", "hebben/zijn + past participle"],
          ["Regular", "ge- + stem + t/d: {p:werken} · {p:bellen}"],
          ["'t kofschip", "t k f s ch p → -t, otherwise -d"],
          ["Irregular", "by heart: {p:eten} · {p:kopen}"],
          ["Zijn", "movement, change: {a:zijn:hij} {p:gaan}"],
          ["Word order", "Ik {a:hebben:ik} gisteren {p:werken}."],
        ],
        quizTitle: "Your turn!",
        quizSub: "8 questions · fill in hebben/zijn and the participle",
        quizNote: {
          kofT: "k is in 't kofschip: -t",
          kofD: "l isn't in 't kofschip: -d",
          z: "z isn't in 't kofschip: -d",
          irregular: "irregular: learn it by heart",
          move: "movement to a place: zijn",
          change: "change: zijn",
          noGe: "ver-: no ge-",
          question: "question: hebben first, participle last",
        },
        gloss: {
          "Ik ___ gisteren in de tuin ___.": "I worked in the garden yesterday.",
          "De buren ___ de huisarts ___.": "The neighbours called the doctor.",
          "Mijn ouders ___ door Europa ___.": "My parents travelled around Europe.",
          "Hij ___ vanmorgen de bus ___.": "He took the bus this morning.",
          "Jullie ___ gisteren op tijd ___.": "You (all) arrived on time yesterday.",
          "Mijn broer ___ vader ___.": "My brother has become a father.",
          "Mijn zus ___ een grappig verhaal ___.": "My sister told a funny story.",
          "___ jij al ___?": "Have you eaten yet?",
        },
        outroTitle: "Practise the perfect tense in the app",
        outroUrl: "mijntaalstudio.nl/en/grammar/perfectum",
        outroCta: "Subscribe for more lessons",
        description: {
          lead: "The Dutch perfect tense (voltooid tegenwoordige tijd, A2) in 5 steps: the form, regular participles with 't kofschip, irregular participles, hebben or zijn, and word order. Then a quiz with 8 questions.",
          page: "📖 Explanation on the site",
          cc: "💬 Translations of the Dutch words: turn on captions (CC).",
          chapters: "Chapters",
          verbs: "Verbs in this video",
          pronouns: "Personal pronouns",
          footer: "Taal Studio · Learn Dutch at your level",
        },
      },
    },
  },
};
