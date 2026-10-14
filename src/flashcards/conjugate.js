/**
 * Conjugation drill (tegenwoordige tijd): "Wij ___ (maken)" → "maken".
 * Questions come from the present-tense table every verb already has
 * (conjugation.present: ik, jij, hij, wij); jullie and plural subjects use
 * the wij form. "___ jij?" practises the trap: no -t when jij comes after it.
 */
import { shuffle } from "./cards";
import { locateParts } from "../data/sentenceParts";
import { sentences } from "../data";
import { REFLEXIVE_PRONOUN, isReflexive, withPronoun } from "../data/reflexive";

// Who does it, which form of the table that needs, and (wederkerende
// werkwoorden) which pronoun: "Jullie" takes the wij form but "je".
export const SUBJECTS = [
  { text: "Ik", form: "ik", person: "ik" },
  { text: "Jij", form: "jij", person: "jij" },
  { text: "Hij", form: "hij", person: "hij" },
  { text: "Mijn moeder", form: "hij", person: "hij" },
  { text: "Het kind", form: "hij", person: "hij" },
  { text: "Wij", form: "wij", person: "wij" },
  { text: "Jullie", form: "wij", person: "jullie" },
  { text: "De kinderen", form: "wij", person: "zij" },
  { text: "Mijn ouders", form: "wij", person: "zij" },
  { text: "jij", form: "jij-vraag", question: true },
];

const clean = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");

/**
 * The right answers for one verb and form; the first is the one we show. A
 * wederkerend werkwoord gets its pronoun for `person`: "meld me aan".
 */
export function answersFor(verb, form, person) {
  const p = verb.conjugation?.present;
  if (!p) return [];
  if (form !== "jij-vraag") {
    const answer = isReflexive(verb) ? withPronoun(p[form], REFLEXIVE_PRONOUN[person]) : p[form];
    return [answer].filter(Boolean);
  }
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
    // The question form splits separable verbs and moves the pronoun ("Meld jij je aan?"): skip it there.
    const noQuestion = verb.conjugation.present.ik.includes(" ") || isReflexive(verb);
    const subjects = shuffle(SUBJECTS.filter((s) => !(s.question && noQuestion)));
    const seen = new Set();
    const first = subjects.filter((s) => !seen.has(s.form) && seen.add(s.form));
    return [...first, ...subjects.filter((s) => !first.includes(s))].map((subject) => ({
      id: `${verb.id}|${subject.text}`,
      verb,
      subject,
      answers: answersFor(verb, subject.form, subject.person),
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

// The persoonsvorm of a separable verb is only the first word ("meld" of "meld aan").
const presentForms = (verb) =>
  Object.values(verb.conjugation?.present || {}).flatMap((f) => [clean(f), clean(f).split(" ")[0]]);
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
      const reflexives = locateParts(s.nl, s.pronouns || []).filter((p) => p && p.part.type === "wederkerend");
      locateParts(s.nl, s.parts).forEach((w) => {
        const verb = w && w.part.role === "persoonsvorm" && byId.get(w.part.wordId);
        if (!verb || !presentForms(verb).includes(clean(w.part.text))) return;
        if (!isReflexive(verb)) return out.push(gap(s, verb, w.start, w.end));
        // Wederkerend: the pronoun of the same clause is a second gap ("Ik [interesseer] [me] voor kunst").
        // Without a marked pronoun the sentence is left out: no half answers.
        const own = reflexives.find((p) => (p.part.clause || null) === (w.part.clause || null));
        if (own) out.push(twoGaps(s, verb, w, own));
      });
      return;
    }
    (s.wordIds || []).forEach((id) => {
      const verb = byId.get(id);
      if (!verb || isReflexive(verb)) return; // the pronoun can't be found reliably without parts
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

/**
 * Two gaps in one sentence (persoonsvorm + wederkerend voornaamwoord), in
 * sentence order: `pieces` is the text around them, `gapAnswers` per gap.
 */
function twoGaps(sentence, verb, x, y) {
  const [a, b] = [x, y].sort((p, q) => p.start - q.start);
  const nl = sentence.nl;
  const gapAnswers = [nl.slice(a.start, a.end), nl.slice(b.start, b.end)];
  return {
    id: `${sentence.id}@${a.start}+${b.start}`,
    verb,
    sentence,
    pieces: [nl.slice(0, a.start), nl.slice(a.end, b.start), nl.slice(b.end)],
    gapAnswers,
    answers: [gapAnswers.join(" … ")],
  };
}

/** Both gaps right (when a question has two)? */
export const isRightGaps = (question, typed) =>
  question.gapAnswers.every((a, i) => clean(a) === clean(typed[i]));

/** A round of gap sentences, about `size`, spread over the verbs (or words). */
export function gapRound(questions, size = 20) {
  const byVerb = new Map();
  const key = (q) => (q.verb || q.word).id;
  shuffle(questions).forEach((q) => byVerb.set(key(q), [...(byVerb.get(key(q)) || []), q]));
  const lines = [...byVerb.values()];
  const out = [];
  for (let i = 0; out.length < size && lines.some((l) => l[i]); i++) {
    lines.forEach((l) => l[i] && out.length < size && out.push(l[i]));
  }
  return shuffle(out);
}

/* ----- Invullen: marked words ("Het boek ligt ___ de tafel." → op) ----- */

/** The words that are marked somewhere in these sentences (so "Invullen" has questions). */
export const markedWordIds = (list) =>
  new Set(list.flatMap((s) => (s.marks || []).map((m) => m.wordId)).filter(Boolean));

/** The words among some items that are marked in a library sentence (for Invullen), each once. */
export function fillWordsOf(items) {
  const marked = markedWordIds(sentences);
  return [...new Map(items.filter((i) => i && marked.has(i.id)).map((i) => [i.id, i])).values()];
}

/**
 * Gap questions from the sentences' marks (sentence.marks: { text, kind,
 * wordId }) that point at one of these words: the marked piece becomes the
 * gap. A word in two pieces ("over … heen" → overheen) gets one question, with
 * the first piece as the gap.
 */
export function markQuestions(words, sentences) {
  const byId = new Map(words.map((w) => [w.id, w]));
  const out = [];
  sentences.forEach((s) => {
    if (!s.nl || !s.marks?.length) return;
    const seen = new Set();
    locateParts(s.nl, s.marks).forEach((w) => {
      const word = w && byId.get(w.part.wordId);
      if (!word || seen.has(word.id)) return;
      seen.add(word.id);
      out.push({
        id: `${s.id}@${w.start}`,
        word,
        kind: w.part.kind,
        sentence: s,
        before: s.nl.slice(0, w.start),
        after: s.nl.slice(w.end),
        answers: [s.nl.slice(w.start, w.end)],
      });
    });
  });
  return out;
}
