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
 * past: { singular, plural }, participle, aux ("hebben", "zijn" or "hebben/zijn") }.
 */
export function verb(id) {
  const v = BY_ID[id];
  if (!v) throw new Error(`Unknown verb ${id}`);
  const c = v.conjugation;
  return { nl: v.nl, en: v.en, stem: c.stem, present: c.present, past: c.past, participle: c.participle, aux: c.auxiliary };
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
 * A sentence in pieces, the forms from the data:
 * { verb, person, text: "Gisteren [aux] ik in de tuin [part]." } →
 * [{ text: "Gisteren " }, { aux: "heb" }, { text: " ik in de tuin " }, { part: "gewerkt" }, { text: "." }].
 * [v] is the past tense: { past: "werkte", stem: "werk" } (the ending is what's after the stem).
 */
export function perfectParts({ verb: id, person, text, aux }) {
  return text
    .split(/(\[aux\]|\[part\]|\[v\])/)
    .filter(Boolean)
    .map((t, i) => {
      const first = (s) => (i ? s : cap(s));
      if (t === "[aux]") return { aux: first(auxForm(auxOf(id, aux), person)) };
      if (t === "[part]") return { part: verb(id).participle };
      if (t === "[v]") return { past: first(pastForm(id, person)), stem: first(verb(id).stem) };
      return { text: t };
    });
}
export const perfectText = (s) => perfectParts(s).map((p) => p.text ?? p.aux ?? p.part ?? p.past).join("");

/** The past tense for a person: ik/jij/hij → the singular, wij (jullie, zij) → the plural. */
export const pastForm = (id, person) => verb(id).past[person === "wij" ? "plural" : "singular"];

/** A regular past form in its pieces: werkte → { stem: "werk", end: "te" }; wachtten → { stem: "wacht", end: "ten" }. */
export function pastParts(id, plural = false) {
  const v = verb(id);
  const form = v.past[plural ? "plural" : "singular"];
  if (!form.startsWith(v.stem)) throw new Error(`${id}: ${form} isn't ${v.stem} + te/de`);
  return { stem: v.stem, end: form.slice(v.stem.length) };
}

/** The words that fill a quiz question's gap(s): the present form, the past form, or hebben/zijn and the participle. */
export function quizAnswers(q, tense = "present") {
  const v = verb(q.verb);
  const first = (s) => (q.capital ? cap(s) : s);
  if (tense === "past") return [first(pastForm(q.verb, q.person))];
  if (tense !== "perfect") return [first(v.present[q.person])];
  return [first(auxForm(auxOf(q.verb, q.aux), q.person)), v.participle];
}

// 't kofschip: the consonants that make a regular participle end in -t.
export const KOFSCHIP = ["t", "k", "f", "s", "ch", "p", "x"];

/**
 * Why a regular participle ends in t or d (and the past in te or de). Look at the
 * verb without -en, before any spelling change (reizen → reiz: z, so -d):
 * { raw, last, end: "t" | "d" }. Throws when the data doesn't follow the rule.
 */
export function kofschip(id, tense = "perfect") {
  const v = verb(id);
  const raw = v.nl.slice(0, -2);
  const last = raw.endsWith("ch") ? "ch" : raw.slice(-1);
  const end = KOFSCHIP.includes(last) ? "t" : "d";
  const form = tense === "past" ? v.past.singular : v.participle;
  if (!form.endsWith(tense === "past" ? `${end}e` : end)) throw new Error(`${id}: ${form} doesn't follow 't kofschip (-${end})`);
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
 * {nl:eten} the infinitive, {a:zijn:hij} hebben/zijn for a person,
 * {v:werken:wij} the past tense for a person.
 */
export function fill(text) {
  return text.replace(/\{(p|s|nl|a|v):([^}:]+)(?::([^}]+))?\}/g, (_, k, w, person) => {
    if (k === "a") return auxForm(w, person);
    if (k === "v") return pastForm(`word.${w}`, person);
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

  // A2: the past tense (imperfectum), regular verbs only (topic.verleden-tijd).
  imperfectum: {
    tense: "past",
    level: "A2",
    // What it is: like -ed in English.
    what: { verb: "word.werken", person: "ik", text: "Gisteren [v] ik.", en: "Yesterday I work{ed}." },
    // 1. te or de: one of each, and the z of reizen.
    kofschip: ["word.werken", "word.bellen", "word.reizen"],
    // 2. Plural: +n.
    table: "word.werken",
    quiz: [
      { verb: "word.wonen", person: "ik", sentence: "Vroeger ___ ik in Utrecht.", note: "d" },
      { verb: "word.reizen", person: "wij", sentence: "Wij ___ elke zomer naar Spanje.", note: "z" },
      { verb: "word.wachten", person: "ik", sentence: "Ik ___ een uur op de bus.", note: "stemT" },
    ],
    text: {
      nl: {
        title: ["De verleden tijd", "in één minuut"],
        sub: "Regelmatige werkwoorden",
        whatTitle: "Wat is de verleden tijd?",
        whatSub: "Net als -ed in het Engels",
        whatLabels: ["Nederlands", "Engels"],
        kofTitle: "1. te of de?",
        kofSub: "Letter in 't kofschip? -te. Anders -de.",
        kofHint: "Kijk naar het werkwoord zonder -en",
        pluralTitle: "2. Meervoud: + n",
        pluralSub: "te/de wordt ten/den",
        persons: ["ik", "jij / u", "hij / zij / het", "wij / jullie / zij"],
        quizTitle: "Nu jij!",
        quizSub: "Zet je antwoorden in de comments",
        quizNote: {
          d: "n staat niet in 't kofschip: -de",
          z: "z staat niet in 't kofschip: -den",
          stemT: "wacht + te: de t blijft",
        },
        gloss: {},
        outro: ["Hele les + extra oefenen", "op YouTube ▶"],
        outroLink: "youtube.com/@mijntaalstudio",
      },
      en: {
        title: ["The Dutch past tense", "in one minute"],
        sub: "Regular verbs",
        whatTitle: "What is the past tense?",
        whatSub: "Just like -ed in English",
        whatLabels: ["Dutch", "English"],
        kofTitle: "1. te or de?",
        kofSub: "Letter in 't kofschip? -te. Otherwise -de.",
        kofHint: "Look at the verb without -en",
        pluralTitle: "2. Plural: + n",
        pluralSub: "te/de becomes ten/den",
        persons: ["ik · I", "jij / u · you", "hij / zij / het · he / she / it", "wij / jullie / zij · we / you / they"],
        quizTitle: "Your turn!",
        quizSub: "Drop your answers in the comments",
        quizNote: {
          d: "n isn't in 't kofschip: -de",
          z: "z isn't in 't kofschip: -den",
          stemT: "wacht + te: the t stays",
        },
        gloss: {
          "Vroeger ___ ik in Utrecht.": "I used to live in Utrecht.",
          "Wij ___ elke zomer naar Spanje.": "We travelled to Spain every summer.",
          "Ik ___ een uur op de bus.": "I waited for the bus for an hour.",
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

  // The past tense (A2), regular verbs only, after the grammar page
  // /grammatica/verleden-tijd/ (topic.verleden-tijd). [v] in a sentence is the
  // past form from the data.
  imperfectum: {
    tense: "past",
    level: "A2",
    slug: "verleden-tijd",
    music: "music/after-sunset.mp3",
    chapters: ["stem", "tede", "plural", "quiz"],
    // What it is: like -ed in English; for yesterday, the past, habits and stories.
    what: [
      { verb: "word.werken", person: "ik", text: "Gisteren [v] ik tot zes uur.", en: "Yesterday I work{ed} until six." },
      { verb: "word.spelen", person: "wij", text: "Vroeger [v] wij elke dag buiten.", en: "As kids, we play{ed} outside every day." },
    ],
    // 1. The stem, as in the present tense.
    stems: [{ key: "all", verbs: ["word.werken", "word.spelen", "word.bellen", "word.reizen"] }],
    // 2. te or de: 't kofschip, and the z of reizen.
    kofschip: [
      { key: "t", verbs: ["word.werken", "word.fietsen", "word.koken"] },
      { key: "d", verbs: ["word.bellen", "word.wonen", "word.spelen"] },
    ],
    trap: "word.reizen",
    // 3. Singular or plural, more examples, and two things to watch.
    table: "word.werken",
    examples: ["word.spelen", "word.fietsen", "word.reizen"],
    stemT: ["word.wachten", "word.praten"],
    question: { verb: "word.spelen", rest: "buiten" },
    thumbRows: [
      ["word.werken", "ik"],
      ["word.spelen", "jij"],
      ["word.wonen", "wij"],
    ],
    glossary: {
      hook: [["verleden tijd", "past tense"], ["imperfectum", "simple past"], ["regelmatig", "regular"]],
      agenda: [["stam", "stem"], ["enkelvoud", "singular"], ["meervoud", "plural"]],
      what: [["gisteren", "yesterday"], ["vroeger", "in the past, as a child"], ["buiten", "outside"], ["vorige week", "last week"]],
    },
    pronouns: [["ik", "I"], ["jij / je", "you"], ["u", "you (polite)"], ["hij / zij / het", "he / she / it"], ["wij / we", "we"], ["jullie", "you (plural)"], ["zij / ze", "they"]],
    quiz: [
      { verb: "word.wonen", person: "ik", sentence: "Vroeger ___ ik in Utrecht.", note: "d" },
      { verb: "word.werken", person: "hij", sentence: "Gisteren ___ hij tot zes uur.", note: "t" },
      { verb: "word.reizen", person: "wij", sentence: "Wij ___ elke zomer naar Spanje.", note: "z" },
      { verb: "word.fietsen", person: "wij", sentence: "De kinderen ___ naar school.", note: "plural" },
      { verb: "word.wachten", person: "ik", sentence: "Ik ___ een uur op de bus.", note: "stemT" },
      { verb: "word.koken", person: "hij", sentence: "Mijn vader ___ elke avond.", note: "k" },
      // A question: the form doesn't change (unlike the present tense's "werk jij?").
      { verb: "word.spelen", person: "jij", sentence: "___ jij vroeger ook piano?", note: "question", capital: true },
      { verb: "word.praten", person: "wij", sentence: "Jullie ___ te lang met de buren.", note: "stemTPlural" },
    ],
    text: {
      nl: {
        topic: "Verleden tijd",
        thumb: ["De verleden tijd", "uitgelegd"],
        title: ["De verleden tijd", "in 3 stappen"],
        sub: "Regelmatige werkwoorden (imperfectum) · daarna een quiz",
        chapters: { intro: "Intro", stem: "De stam", tede: "te of de", plural: "Enkelvoud of meervoud", summary: "Samenvatting", quiz: "Quiz" },
        agendaTitle: "In deze les",
        ccHint: "Vertalingen? Zet de ondertiteling (CC) aan",
        whatTitle: "Wanneer gebruik je de verleden tijd?",
        whatSub: "Voor gisteren, vroeger, gewoontes en verhalen",
        whatLabels: ["Nederlands", "Engels"],
        whatNote: "te/de is net als -ed in het Engels: {v:werken:ik} = worked, {v:spelen:wij} = played.",
        chapterSub: {
          stem: "Haal -en van het hele werkwoord",
          tede: "Kijk naar 't kofschip",
          plural: "te/de of ten/den",
        },
        stems: {
          all: { title: "Haal -en eraf", sub: "En pas de spelling aan, net als in de tegenwoordige tijd", why: "Lange klank? Twee klinkers: {s:spelen}. Dubbele medeklinker? Eén: {s:bellen}. z wordt s: {s:reizen}." },
        },
        kofschip: {
          t: { title: "Letter uit 't kofschip? Dan -te", sub: "Kijk naar het werkwoord zonder -en" },
          d: { title: "Een andere letter? Dan -de", sub: "Alles wat niet in 't kofschip staat" },
        },
        kofWhy: "= t, k, f, s, ch, p (en x)",
        trapTitle: "Let op: kijk vóór de spelling verandert",
        trapSub: "Niet naar de stam, maar naar het werkwoord zonder -en",
        trapLabels: ["stam", "zonder -en"],
        trapWhy: "De stam is {s:reizen}, maar {nl:reizen} heeft een z. De z staat niet in 't kofschip, dus -de.",
        tableTitle: "Meervoud? Zet er een n achter",
        tableSingular: "Enkelvoud",
        tablePlural: "Meervoud",
        endings: ["stam + te/de", "stam + ten/den"],
        persons: { ik: "ik", jij: "jij / je", u: "u", hij: "hij / zij / het", wij: "wij / we", jullie: "jullie", zij: "zij / ze" },
        examplesTitle: "Zelfde uitgangen, andere werkwoorden",
        examplesSub: "te of de: kijk naar 't kofschip",
        noteTitle: "Let op",
        noteStemT: "Stam op t? Die t blijft staan",
        noteQuestion: "Een vraag? De vorm blijft hetzelfde",
        summaryTitle: "Samenvatting",
        summary: [
          ["Wanneer?", "gisteren, vroeger, gewoontes, verhalen"],
          ["De stam", "hele werkwoord − en: {s:spelen} · {s:bellen} · {s:reizen}"],
          ["'t kofschip", "t k f s ch p → -te, anders -de"],
          ["Enkelvoud", "stam + te/de: ik {v:werken:ik}"],
          ["Meervoud", "stam + ten/den: wij {v:werken:wij}"],
          ["Stam op t", "die blijft: ik {v:wachten:ik}"],
        ],
        quizTitle: "Nu jij!",
        quizSub: "8 vragen · pauzeer de video als je meer tijd nodig hebt",
        quizNote: {
          d: "n staat niet in 't kofschip: -de",
          t: "k staat in 't kofschip: -te",
          z: "z staat niet in 't kofschip: -den",
          plural: "meervoud: -ten",
          stemT: "wacht + te: de t blijft",
          k: "k staat in 't kofschip: -te",
          question: "vraag: de vorm blijft hetzelfde",
          stemTPlural: "praat + ten: de t blijft",
        },
        gloss: {},
        outroTitle: "Oefen de verleden tijd in de app",
        outroUrl: "mijntaalstudio.nl/grammatica/verleden-tijd",
        outroCta: "Abonneer je voor meer lessen",
        description: {
          lead: "De verleden tijd (imperfectum, A2) van regelmatige werkwoorden in 3 stappen: de stam, te of de met 't kofschip, en enkelvoud of meervoud. Daarna een quiz met 8 vragen.",
          page: "📖 Uitleg op de site",
          cc: "💬 Vertalingen in het Engels: zet de ondertiteling (CC) aan.",
          chapters: "Hoofdstukken",
          verbs: "Werkwoorden in deze video",
          pronouns: "Persoonlijke voornaamwoorden",
          footer: "Taal Studio · Nederlands leren, op jouw niveau",
        },
      },
      en: {
        topic: "Past tense",
        thumb: ["Dutch past tense", "explained"],
        title: ["The Dutch past tense", "in 3 steps"],
        sub: "Regular verbs (imperfectum) · then a quiz",
        chapters: { intro: "Intro", stem: "The stem", tede: "te or de", plural: "Singular or plural", summary: "Summary", quiz: "Quiz" },
        agendaTitle: "In this lesson",
        ccHint: "Translations? Turn on captions (CC)",
        whatTitle: "When do you use the past tense?",
        whatSub: "For yesterday, the past, habits and stories",
        whatLabels: ["Dutch", "English"],
        whatNote: "te/de works like -ed in English: {v:werken:ik} = worked, {v:spelen:wij} = played.",
        chapterSub: {
          stem: "Take -en off the infinitive",
          tede: "Look at 't kofschip",
          plural: "te/de or ten/den",
        },
        stems: {
          all: { title: "Take off -en", sub: "And fix the spelling, as in the present tense", why: "Long sound? Two vowels: {s:spelen}. Double consonant? One: {s:bellen}. z becomes s: {s:reizen}." },
        },
        kofschip: {
          t: { title: "Letter from 't kofschip? Then -te", sub: "Look at the verb without -en" },
          d: { title: "Any other letter? Then -de", sub: "Everything that isn't in 't kofschip" },
        },
        kofWhy: "= t, k, f, s, ch, p (and x)",
        trapTitle: "Watch out: look before the spelling changes",
        trapSub: "Not at the stem, but at the verb without -en",
        trapLabels: ["stem", "without -en"],
        trapWhy: "The stem is {s:reizen}, but {nl:reizen} has a z. z isn't in 't kofschip, so -de.",
        tableTitle: "Plural? Add an n",
        tableSingular: "Singular",
        tablePlural: "Plural",
        endings: ["stem + te/de", "stem + ten/den"],
        persons: { ik: "ik · I", jij: "jij / je · you", u: "u · you (polite)", hij: "hij / zij / het · he / she / it", wij: "wij / we · we", jullie: "jullie · you (plural)", zij: "zij / ze · they" },
        examplesTitle: "Same endings, other verbs",
        examplesSub: "te or de: look at 't kofschip",
        noteTitle: "Watch out",
        noteStemT: "Stem ends in t? That t stays",
        noteQuestion: "A question? The form stays the same",
        summaryTitle: "Summary",
        summary: [
          ["When?", "yesterday, the past, habits, stories"],
          ["The stem", "infinitive − en: {s:spelen} · {s:bellen} · {s:reizen}"],
          ["'t kofschip", "t k f s ch p → -te, otherwise -de"],
          ["Singular", "stem + te/de: ik {v:werken:ik}"],
          ["Plural", "stem + ten/den: wij {v:werken:wij}"],
          ["Stem ends in t", "it stays: ik {v:wachten:ik}"],
        ],
        quizTitle: "Your turn!",
        quizSub: "8 questions · pause the video if you need more time",
        quizNote: {
          d: "n isn't in 't kofschip: -de",
          t: "k is in 't kofschip: -te",
          z: "z isn't in 't kofschip: -den",
          plural: "plural: -ten",
          stemT: "wacht + te: the t stays",
          k: "k is in 't kofschip: -te",
          question: "question: the form stays the same",
          stemTPlural: "praat + ten: the t stays",
        },
        gloss: {
          "Vroeger ___ ik in Utrecht.": "I used to live in Utrecht.",
          "Gisteren ___ hij tot zes uur.": "Yesterday he worked until six.",
          "Wij ___ elke zomer naar Spanje.": "We travelled to Spain every summer.",
          "De kinderen ___ naar school.": "The children cycled to school.",
          "Ik ___ een uur op de bus.": "I waited for the bus for an hour.",
          "Mijn vader ___ elke avond.": "My father cooked every evening.",
          "___ jij vroeger ook piano?": "Did you play the piano too, when you were young?",
          "Jullie ___ te lang met de buren.": "You (all) talked to the neighbours for too long.",
        },
        outroTitle: "Practise the past tense in the app",
        outroUrl: "mijntaalstudio.nl/en/grammar/verleden-tijd",
        outroCta: "Subscribe for more lessons",
        description: {
          lead: "The Dutch past tense (imperfectum, A2) of regular verbs in 3 steps: the stem, te or de with 't kofschip, and singular or plural. Then a quiz with 8 questions.",
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
