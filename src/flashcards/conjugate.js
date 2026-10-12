/**
 * Conjugation drill (tegenwoordige tijd): "Wij ___ (maken)" → "maken".
 * Questions come from the present-tense table every verb already has
 * (conjugation.present: ik, jij, hij, wij); jullie and plural subjects use
 * the wij form. "___ jij?" practises the trap: no -t when jij comes after it.
 */
import { shuffle } from "./cards";

// Who does it, and which form of the table that needs.
export const SUBJECTS = [
  { text: "Ik", form: "ik" },
  { text: "Jij", form: "jij" },
  { text: "Hij", form: "hij" },
  { text: "Mijn moeder", form: "hij" },
  { text: "Het kind", form: "hij" },
  { text: "Wij", form: "wij" },
  { text: "Jullie", form: "wij" },
  { text: "De kinderen", form: "wij" },
  { text: "Mijn ouders", form: "wij" },
  { text: "jij", form: "jij-vraag", question: true },
];

const clean = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");

/** The right answers for one verb and form; the first is the one we show. */
export function answersFor(verb, form) {
  const p = verb.conjugation?.present;
  if (!p) return [];
  if (form !== "jij-vraag") return [p[form]].filter(Boolean);
  // Werk jij? Heb jij? Ben jij? — the ik form; with a separate jij form
  // (kunt/kan) the jij form without -t is right too: kun jij.
  const out = [p.ik];
  if (p.jij !== p.hij && p.jij?.endsWith("t")) out.push(p.jij.slice(0, -1));
  return [...new Set(out.filter(Boolean))];
}

export const isRight = (question, typed) => question.answers.some((a) => clean(a) === clean(typed));

/** Verbs the drill can use: those with a present-tense table. */
export const drillable = (verbs) => verbs.filter((v) => v.conjugation?.present?.ik && v.conjugation.present.wij);

/**
 * A round of questions: every verb comes up, with varied subjects, `size`
 * questions in all (more when there are more verbs than that). Each verb
 * goes through the forms (ik, jij, hij, wij, vraag) before repeating one.
 * Separable verbs skip the question form ("Was jij af?" splits the verb).
 */
export function makeRound(verbs, size = 20) {
  const list = shuffle(drillable(verbs));
  if (!list.length) return [];
  const lines = list.map((verb) => {
    const separable = verb.conjugation.present.ik.includes(" ");
    const subjects = shuffle(SUBJECTS.filter((s) => !(s.question && separable)));
    const seen = new Set();
    const first = subjects.filter((s) => !seen.has(s.form) && seen.add(s.form));
    return [...first, ...subjects.filter((s) => !first.includes(s))].map((subject) => ({
      id: `${verb.id}|${subject.text}`,
      verb,
      subject,
      answers: answersFor(verb, subject.form),
    }));
  });
  // Round robin over the verbs until the round is full.
  const questions = [];
  const want = Math.max(size, list.length);
  for (let i = 0; questions.length < want && lines.some((l) => l[i]); i++) {
    lines.forEach((l) => l[i] && questions.length < want && questions.push(l[i]));
  }
  return shuffle(questions);
}
