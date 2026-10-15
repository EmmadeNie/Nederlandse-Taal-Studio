/**
 * Conjugation drill (tegenwoordige tijd): "Wij ___ (maken)" → "maken".
 * Questions come from the present-tense table every verb already has
 * (conjugation.present: ik, jij, hij, wij); jullie and plural subjects use
 * the wij form. "___ jij?" practises the trap: no -t when jij comes after it.
 */
import { shuffle } from "./cards";
import { locateParts } from "../data/sentenceParts";
import { getItem, inExercises, sentences } from "../data";
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

/* ----- Tenses: tegenwoordige tijd, verleden tijd, perfectum ----- */

export const TENSES = ["present", "past", "perfect"];
// The auxiliaries of the perfectum, per form of the table (jullie / zij mv take the wij form).
const AUX = {
  hebben: { ik: "heb", jij: "hebt", hij: "heeft", wij: "hebben" },
  zijn: { ik: "ben", jij: "bent", hij: "is", wij: "zijn" },
};
const AUX_FORMS = new Set(Object.values(AUX).flatMap((f) => Object.values(f)));
const auxiliariesOf = (verb) =>
  String(verb.conjugation?.auxiliary || "")
    .split(/[\/,]| of /)
    .map((a) => a.trim())
    .filter((a) => AUX[a]);

/**
 * The right answers for one verb, form and tense; the first is the one we
 * show. A wederkerend werkwoord gets its pronoun for `person`: "meld me aan",
 * "meldde me aan", "heb me aangemeld".
 */
export function answersFor(verb, form, person, tense = "present") {
  const c = verb.conjugation || {};
  const pron = isReflexive(verb) ? REFLEXIVE_PRONOUN[person] : null;
  if (tense === "past") {
    const f = form === "wij" ? c.past?.plural : c.past?.singular;
    return [pron ? withPronoun(f, pron) : f].filter(Boolean);
  }
  if (tense === "perfect") {
    if (!c.participle) return [];
    // hebben and/or zijn ("is/heeft gelopen"): both count when the verb allows both.
    return auxiliariesOf(verb).map((a) => [AUX[a][form], pron, c.participle].filter(Boolean).join(" "));
  }
  const p = c.present;
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

/** Verbs the drill can use in a tense: present table, past forms, or participle + auxiliary. */
export const drillable = (verbs, tense = "present") =>
  verbs.filter((v) => {
    const c = v.conjugation;
    if (!c?.present?.ik || !c.present.wij) return false;
    if (tense === "past") return Boolean(c.past?.singular && c.past?.plural);
    if (tense === "perfect") return Boolean(c.participle && auxiliariesOf(v).length);
    return true;
  });

/** The tense a lesson is about (its grammar topics or title): perfectum, verleden tijd, else present. */
export function tenseForLesson(lesson) {
  if (!lesson) return "present";
  const tags = (lesson.topic_ids || []).flatMap((id) => getItem(id)?.grammarTags || []);
  const title = (lesson.title || "").toLowerCase();
  if (tags.includes("perfectum") || title.includes("perfectum")) return "perfect";
  if (tags.includes("verleden-tijd") || /imperfectum|verleden tijd/.test(title)) return "past";
  return "present";
}

/**
 * A round of questions: every verb comes up, with varied subjects, `size`
 * questions in all (more when there are more verbs than that). Each verb
 * goes through the forms (ik, jij, hij, wij, vraag) before repeating one.
 * Separable verbs skip the question form ("Was jij af?" splits the verb).
 */
export function makeRound(verbs, size = 20, tense = "present") {
  const list = shuffle(drillable(verbs, tense));
  if (!list.length) return [];
  const lines = list.map((verb) => {
    // The question form splits separable verbs and moves the pronoun ("Meld jij je aan?"): skip it
    // there, and in the past and perfectum (it practises the present-tense -t only).
    const noQuestion = verb.conjugation.present.ik.includes(" ") || isReflexive(verb) || tense !== "present";
    const subjects = shuffle(SUBJECTS.filter((s) => !(s.question && noQuestion)));
    const seen = new Set();
    const first = subjects.filter((s) => !seen.has(s.form) && seen.add(s.form));
    return [...first, ...subjects.filter((s) => !first.includes(s))].map((subject) => ({
      id: `${verb.id}|${subject.text}|${tense}`,
      verb,
      subject,
      tense,
      answers: answersFor(verb, subject.form, subject.person, tense),
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

// A separable verb's persoonsvorm is the first word in a main clause ("meld" of
// "meld aan") and written together in a subclause ("…omdat ik me aanmeld").
const together = (form) => {
  const [first, ...rest] = form.split(" ");
  return rest.join("") + first;
};
const withVariants = (forms) =>
  forms.filter(Boolean).flatMap((f) => {
    const c = clean(f);
    return c.includes(" ") ? [c, c.split(" ")[0], together(c)] : [c];
  });
const presentForms = (verb) => withVariants(Object.values(verb.conjugation?.present || {}));
const pastForms = (verb) => withVariants([verb.conjugation?.past?.singular, verb.conjugation?.past?.plural]);
const isSeparable = (verb) => (verb.conjugation?.present?.ik || "").includes(" ");
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
export function gapQuestions(verbs, all, tense = "present") {
  const sentences = all.filter(inExercises); // no sentences flagged "weghalen"
  const byId = new Map(drillable(verbs, tense).map((v) => [v.id, v]));
  const formsOf = tense === "past" ? pastForms : presentForms;
  const out = [];
  sentences.forEach((s) => {
    if (!s.nl) return;
    if (s.parts?.length) {
      const reflexives = locateParts(s.nl, s.pronouns || []).filter((p) => p && p.part.type === "wederkerend");
      const located = locateParts(s.nl, s.parts).filter(Boolean);
      const sameClause = (a, b) => (a.part.clause || null) === (b.part.clause || null);
      if (tense === "perfect") {
        // Perfectum: the participle of one of the verbs, with a form of hebben/zijn as persoonsvorm in the
        // same (sub)clause: "Hij [heeft] mij met mijn huiswerk [geholpen]." (+ the wederkerend pronoun).
        located.forEach((w) => {
          const verb = w.part.role === "werkwoord" && byId.get(w.part.wordId);
          if (!verb || clean(w.part.text) !== clean(verb.conjugation.participle)) return;
          const aux = located.find((p) => p.part.role === "persoonsvorm" && AUX_FORMS.has(clean(p.part.text)) && sameClause(p, w));
          if (!aux) return;
          const gaps = [aux, w];
          if (isReflexive(verb)) {
            const own = reflexives.find((p) => sameClause(p, w));
            if (!own) return;
            gaps.push(own);
          }
          out.push({ ...multiGap(s, verb, gaps), tense });
        });
        return;
      }
      located.forEach((w) => {
        const verb = w.part.role === "persoonsvorm" && byId.get(w.part.wordId);
        if (!verb || !formsOf(verb).includes(clean(w.part.text))) return;
        // The persoonsvorm, plus what belongs to it in the same (sub)clause, each a gap in sentence
        // order: the wederkerend voornaamwoord ("Ik [meld] [me] [aan]") and the separable part.
        const gaps = [w];
        if (isReflexive(verb)) {
          const own = reflexives.find((p) => sameClause(p, w));
          if (!own) return; // not marked: leave the sentence out, no half answers
          gaps.push(own);
        }
        if (isSeparable(verb)) {
          const rest = located.find((p) => p.part.role === "scheidbaar-deel" && p.part.wordId === verb.id && sameClause(p, w));
          if (rest) gaps.push(rest);
        }
        out.push({ ...(gaps.length === 1 ? gap(s, verb, w.start, w.end) : multiGap(s, verb, gaps)), tense });
      });
      return;
    }
    // Without parts: only simple forms that can be found as a word (no perfectum: it needs the parts).
    if (tense === "perfect") return;
    (s.wordIds || []).forEach((id) => {
      const verb = byId.get(id);
      if (!verb || isReflexive(verb)) return; // the pronoun can't be found reliably without parts
      const p = verb.conjugation.present;
      const candidates = tense === "past" ? [verb.conjugation.past.singular, verb.conjugation.past.plural] : [p.ik, p.jij, p.hij];
      const forms = [...new Set(candidates)].filter((f) => f && !f.includes(" ") && f !== verb.nl);
      for (const f of forms) {
        const m = new RegExp(`(^|[^\\p{L}])(${escape(f)})(?![\\p{L}])`, "iu").exec(s.nl);
        if (m) {
          const start = m.index + m[1].length;
          out.push({ ...gap(s, verb, start, start + m[2].length), tense });
          return;
        }
      }
      if (tense !== "present") return;
      const wij = p.wij && !p.wij.includes(" ") ? escape(p.wij) : null;
      if (!wij) return;
      const after = new RegExp(`(^|,\\s*)(?:${PLURAL})\\s+(${wij})(?![\\p{L}])`, "iu").exec(s.nl);
      const before = new RegExp(`(^|[^\\p{L}])(${wij})\\s+(?:${PLURAL})(?![\\p{L}])`, "iu").exec(s.nl);
      const m = after || before;
      if (m) {
        const start = m.index + m[0].indexOf(m[2], m[1].length);
        out.push({ ...gap(s, verb, start, start + m[2].length), tense });
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
 * Several gaps in one sentence (persoonsvorm, wederkerend voornaamwoord,
 * separable part), in sentence order: `pieces` is the text around them
 * (one more than the gaps), `gapAnswers` per gap.
 */
function multiGap(sentence, verb, spots) {
  const sorted = [...spots].sort((p, q) => p.start - q.start);
  const nl = sentence.nl;
  const pieces = [];
  let pos = 0;
  sorted.forEach((g) => {
    pieces.push(nl.slice(pos, g.start));
    pos = g.end;
  });
  pieces.push(nl.slice(pos));
  const gapAnswers = sorted.map((g) => nl.slice(g.start, g.end));
  return {
    id: `${sentence.id}@${sorted.map((g) => g.start).join("+")}`,
    verb,
    sentence,
    pieces,
    gapAnswers,
    answers: [gapAnswers.join(" … ")],
  };
}

/** Is one gap of a several-gap question right? */
export const gapIsRight = (question, i, typed) =>
  (question.gapAlts?.[i] || [question.gapAnswers[i]]).some((a) => clean(a) === clean(typed));

/** Every gap right (when a question has several)? */
export const isRightGaps = (question, typed) => question.gapAnswers.every((_, i) => gapIsRight(question, i, typed[i]));

/** A round of gap sentences, about `size`, spread over the verbs (or words). */
export function gapRound(questions, size = 20) {
  const byVerb = new Map();
  const key = (q) => (q.verb || q.word || q).id;
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
export function markQuestions(words, all) {
  const sentences = all.filter(inExercises);
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
