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
      { verb: "word.zetten", person: "hij", sentence: "Zij ___ koffie.", note: "oneT" },
      // Jij after the verb: the form without -t, the same as for ik.
      { verb: "word.werken", person: "ik", sentence: "___ jij morgen?", note: "question", capital: true },
    ],
    text: {
      nl: {
        title: ["Werkwoorden:", "de tegenwoordige tijd"],
        sub: "Regelmatige werkwoorden in 30 seconden",
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
        outro: "Oefen alle werkwoorden · link in bio",
      },
      en: {
        title: ["Dutch verbs:", "the present tense"],
        sub: "Regular verbs in 30 seconds",
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
          "Zij ___ koffie.": "She makes coffee.",
          "___ jij morgen?": "Are you working tomorrow?",
        },
        outro: "Practise all the verbs · link in bio",
      },
    },
  },
};
