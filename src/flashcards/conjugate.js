/**
 * Conjugation drill (tegenwoordige tijd): "Wij ___ (maken)" → "maken".
 * Questions come from the present-tense table every verb already has
 * (conjugation.present: ik, jij, hij, wij); jullie and plural subjects use
 * the wij form. "___ jij?" practises the trap: no -t when jij comes after it.
 */
import { shuffle } from "./cards";
import { locateParts } from "../data/sentenceParts";

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

/* ----- In zinnen: "Ik ___ elke dag mijn lunch zelf. (maken)" ----- */

const presentForms = (verb) => Object.values(verb.conjugation?.present || {}).map(clean);
const PLURAL = "wij|we|jullie|zij|ze";
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Gap questions from the sentences that use these verbs in the present tense:
 * the persoonsvorm becomes the gap, the verb is the hint. Sentences with
 * `parts` use their marked persoonsvorm (also of a subclause); sentences
 * without fall back to finding a present form of a verb they list in
 * wordIds. The wij form looks like the infinitive ("Wat gaan we eten?"), so
 * there it only counts right next to a plural pronoun: at the start of the
 * sentence or after a comma ("We eten vis"), or straight after it
 * (inversion: "Morgen eten we vis", "Gaan jullie mee?").
 */
export function gapQuestions(verbs, sentences) {
  const byId = new Map(drillable(verbs).map((v) => [v.id, v]));
  const out = [];
  sentences.forEach((s) => {
    if (!s.nl) return;
    if (s.parts?.length) {
      locateParts(s.nl, s.parts).forEach((w) => {
        const verb = w && w.part.role === "persoonsvorm" && byId.get(w.part.wordId);
        if (!verb || !presentForms(verb).includes(clean(w.part.text))) return;
        out.push(gap(s, verb, w.start, w.end));
      });
      return;
    }
    (s.wordIds || []).forEach((id) => {
      const verb = byId.get(id);
      if (!verb) return;
      const p = verb.conjugation.present;
      const forms = [...new Set([p.ik, p.jij, p.hij])].filter((f) => f && !f.includes(" ") && f !== verb.nl);
      for (const f of forms) {
        const m = new RegExp(`(^|[^\\p{L}])(${escape(f)})(?![\\p{L}])`, "iu").exec(s.nl);
        if (m) {
          const start = m.index + m[1].length;
          out.push(gap(s, verb, start, start + m[2].length));
          return;
        }
      }
      const wij = p.wij && !p.wij.includes(" ") ? escape(p.wij) : null;
      if (!wij) return;
      const after = new RegExp(`(^|,\\s*)(?:${PLURAL})\\s+(${wij})(?![\\p{L}])`, "iu").exec(s.nl);
      const before = new RegExp(`(^|[^\\p{L}])(${wij})\\s+(?:${PLURAL})(?![\\p{L}])`, "iu").exec(s.nl);
      const m = after || before;
      if (m) {
        const start = m.index + m[0].indexOf(m[2], m[1].length);
        out.push(gap(s, verb, start, start + m[2].length));
      }
    });
  });
  return out;
}

function gap(sentence, verb, start, end) {
  return {
    id: `${sentence.id}@${start}`,
    verb,
    sentence,
    before: sentence.nl.slice(0, start),
    after: sentence.nl.slice(end),
    answers: [sentence.nl.slice(start, end)],
  };
}

/** A round of gap sentences, about `size`, spread over the verbs. */
export function gapRound(questions, size = 20) {
  const byVerb = new Map();
  shuffle(questions).forEach((q) => byVerb.set(q.verb.id, [...(byVerb.get(q.verb.id) || []), q]));
  const lines = [...byVerb.values()];
  const out = [];
  for (let i = 0; out.length < size && lines.some((l) => l[i]); i++) {
    lines.forEach((l) => l[i] && out.length < size && out.push(l[i]));
  }
  return shuffle(out);
}
