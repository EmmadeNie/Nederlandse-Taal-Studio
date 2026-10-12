/**
 * Parts of a sentence (sentence.parts): marked pieces of the Dutch text, in
 * order of appearance, each with a role. For now the verb pieces and the
 * subject are marked; the other roles are there for a full analysis later.
 *
 *   { "text": "Ik", "role": "onderwerp", "person": "1sg" }
 *   { "text": "fiets", "role": "persoonsvorm", "wordId": "word.fietsen" }
 *   { "text": "op", "role": "scheidbaar-deel", "wordId": "word.opbellen" }
 *
 * Pieces only need to cover what is marked; the rest of the sentence is free.
 */
export const VERB_ROLES = ["persoonsvorm", "werkwoord", "scheidbaar-deel"];
export const PART_ROLES = [
  "onderwerp",
  ...VERB_ROLES,
  "lijdend-voorwerp",
  "meewerkend-voorwerp",
  "voorzetselvoorwerp",
  "naamwoordelijk-deel",
  "bijwoordelijke-bepaling",
];
export const PERSONS = ["1sg", "2sg", "3sg", "1pl", "2pl", "3pl"];
/** A part in a subordinate clause carries clause: "bijzin"; without it, it is in the main clause. */
export const CLAUSES = ["bijzin"];

/**
 * Pronouns that change with the person (sentence.pronouns), a separate layer
 * because a pronoun can also be a part ("Ik" is subject and pronoun):
 *   { "text": "mijn", "type": "bezittelijk", "person": "1sg" }
 */
export const PRONOUN_TYPES = ["persoonlijk", "bezittelijk", "wederkerend"];

/**
 * Where each part sits in the text: [{ part, start, end }] in order, or null
 * for a part that can't be found after the previous one.
 */
export function locateParts(nl, parts = []) {
  let from = 0;
  return parts.map((part) => {
    const at = typeof part?.text === "string" && part.text ? nl.indexOf(part.text, from) : -1;
    if (at < 0) return null;
    from = at + part.text.length;
    return { part, start: at, end: from };
  });
}
