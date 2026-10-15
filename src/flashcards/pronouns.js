/**
 * Voornaamwoorden invullen: the pronouns marked in sentences (sentence.pronouns:
 * { text, type, person, clause }) become gaps. The sentence itself is the hint
 * ("Lisa woont in Amsterdam. ___ werkt in een restaurant."); each gap shows its
 * kind (onderwerp / bezittelijk / wederkerend …), optionally with the person.
 * Unstressed and stressed forms both count: jij/je, wij/we, zij/ze as subject,
 * jou/je as object, jouw/je as possessive. ons/onze does not: that depends on
 * the noun (de or het).
 */
import { locateParts } from "../data/sentenceParts";
import { inExercises } from "../data";

export const PRONOUN_KINDS = ["persoonlijk", "bezittelijk", "wederkerend"];

const lower = (s) => (s || "").trim().toLowerCase();
const SUBJECT_PAIRS = { jij: "je", je: "jij", wij: "we", we: "wij", zij: "ze", ze: "zij" };
const OBJECT_PAIRS = { jou: "je", je: "jou" };
const POSSESSIVE_PAIRS = { jouw: "je", je: "jouw" };

/** The answers that count for one marked pronoun. */
function alternatives(text, type, isSubject) {
  const pairs = type === "bezittelijk" ? POSSESSIVE_PAIRS : type === "persoonlijk" ? (isSubject ? SUBJECT_PAIRS : OBJECT_PAIRS) : {};
  const other = pairs[lower(text)];
  return other ? [text, other] : [text];
}

/**
 * Questions from sentences with marked pronouns. `kind` limits the gaps to
 * one type (the other pronouns stay visible); null = all of them. A sentence
 * with several pronouns of that kind gets several gaps, in sentence order.
 */
export function pronounQuestions(sentences, kind = null) {
  const out = [];
  sentences.filter(inExercises).forEach((s) => {
    if (!s.nl || !s.pronouns?.length) return;
    // A pronoun that is (the start of) the subject: "Zij werkt…", "Morgen ga ik…".
    const subjects = locateParts(s.nl, s.parts || []).filter((p) => p && p.part.role === "onderwerp");
    const spots = locateParts(s.nl, s.pronouns)
      .filter((p) => p && PRONOUN_KINDS.includes(p.part.type) && (!kind || p.part.type === kind))
      .map((p) => {
        const isSubject =
          p.part.type === "persoonlijk" &&
          (subjects.some((o) => o.start === p.start) || (!s.parts?.length && /^(ik|jij|je|hij|zij|ze|het|wij|we|jullie|u)$/i.test(p.part.text) && p.start === 0));
        return { ...p, isSubject, alts: alternatives(s.nl.slice(p.start, p.end), p.part.type, isSubject) };
      })
      .sort((a, b) => a.start - b.start);
    if (!spots.length) return;
    const pieces = [];
    let pos = 0;
    spots.forEach((g) => {
      pieces.push(s.nl.slice(pos, g.start));
      pos = g.end;
    });
    pieces.push(s.nl.slice(pos));
    const gapAnswers = spots.map((g) => s.nl.slice(g.start, g.end));
    // Without a sentence before the gap ("___ gaan naar de bioscoop.") wij, zij or jullie could all
    // fit: then the hint always gives the person. With context ("Lisa woont … . ___ werkt") it doesn't.
    const hasContext = (g) => /[.!?]\s/.test(s.nl.slice(0, g.start));
    const hints = spots.map((g) => ({
      role: g.isSubject ? "onderwerp" : g.part.type,
      person: g.part.person || null,
      showPerson: !hasContext(g),
    }));
    const base = { id: `${s.id}#${kind || "all"}`, sentence: s, pronoun: true, hints };
    if (spots.length === 1) {
      out.push({ ...base, before: pieces[0], after: pieces[1], answers: spots[0].alts });
    } else {
      out.push({ ...base, pieces, gapAnswers, gapAlts: spots.map((g) => g.alts), answers: [gapAnswers.join(" … ")] });
    }
  });
  return out;
}

/** The kinds that occur (for the Alles / Persoonlijk / … choice). */
export const pronounKindsIn = (sentences) =>
  PRONOUN_KINDS.filter((k) => sentences.some((s) => (s.pronouns || []).some((p) => p.type === k)));
