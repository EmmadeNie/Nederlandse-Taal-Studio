/**
 * Wederkerende werkwoorden (zich aanmelden, zich concentreren): the pronoun
 * follows a fixed rule, so the app adds it itself; the verb data keeps the
 * forms without it ("meld aan").
 *
 *   ik me · jij je · hij/zij/het zich · wij ons · jullie je · zij (mv) zich
 *
 * In a main clause it comes right after the persoonsvorm, before the rest
 * (a separable part): "ik meld me aan", "ik concentreer me".
 */
export const REFLEXIVE_PRONOUN = { ik: "me", jij: "je", hij: "zich", wij: "ons", jullie: "je", zij: "zich" };

export const isReflexive = (verb) =>
  Boolean(verb) && ((verb.nl || "").startsWith("zich ") || (verb.tags || []).includes("reflexief-ww"));

/** "meld aan" + "me" → "meld me aan"; "concentreer" + "me" → "concentreer me". */
export function withPronoun(form, pronoun) {
  if (!form || !pronoun) return form;
  const [first, ...rest] = form.split(" ");
  return [first, pronoun, ...rest].join(" ");
}
