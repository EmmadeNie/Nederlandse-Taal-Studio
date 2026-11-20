// Lesson reels: one short video per lesson that explains the grammar and ends
// with a quiz. Each lesson here is only text and verb ids; the verb forms come
// from the app's own data (src/data/words-verbs.json), so the video always
// says what the app says. See LessonReel.jsx for the scenes.
import VERBS from "../../src/data/words-verbs.json";

const BY_ID = Object.fromEntries(VERBS.map((v) => [v.id, v]));

/** A verb from the app's data: { nl, en, stem, present: { ik, jij, hij, wij } }. */
export function verb(id) {
  const v = BY_ID[id];
  if (!v) throw new Error(`Unknown verb ${id}`);
  return { nl: v.nl, en: v.en, stem: v.conjugation.stem, present: v.conjugation.present };
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
};

// Full lesson videos (16:9, a few minutes, for YouTube and the grammar page).
// They follow the grammar page /grammatica/<slug>/ step by step (the topic's
// "short" text from public_topics()), so the video and the site say the same.
// Like the reels: only text and verb ids; the verb forms come from the app.
export const LESSON_VIDEOS = {
  "present-regular": {
    level: "A1",
    slug: "werkwoorden-vervoegen", // the grammar page
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
};
