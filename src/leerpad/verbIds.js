/** The verbs chosen for a lesson (lessons.verb_ids). */
import { getItem } from "../data";

export const isVerb = (w) => w?.partOfSpeech === "verb" && Boolean(w.conjugation);

/** The verbs of a lesson that still exist, in the chosen order. */
export const lessonVerbs = (ids = []) => ids.map(getItem).filter(isVerb);
