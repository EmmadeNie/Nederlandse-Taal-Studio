/**
 * A separable verb split the way the videos draw it: the part that moves (red)
 * and the base verb (blue), from the conjugation ("bel op" → op + bellen).
 * Returns null for a verb that does not split.
 */
export function splitVerb(verb) {
  const inf = verb?.conjugation?.infinitive || verb?.nl || "";
  const stem = verb?.conjugation?.stem || "";
  const part = stem.includes(" ") ? stem.split(" ").pop() : "";
  if (!part || part.length >= inf.length || !inf.startsWith(part)) return null;
  return { part, base: inf.slice(part.length) };
}
