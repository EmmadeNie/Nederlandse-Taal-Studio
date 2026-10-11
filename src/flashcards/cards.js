/**
 * Which cards a deck holds, worked out from the lesson or set it points at
 * (so a deck follows changes to its list).
 */
import { getSet, setItems } from "../data";
import { wordsForLists } from "../leerpad/wordLists";
import { sentencesForLists } from "../leerpad/sentenceLists";
import { lessonVerbs } from "../leerpad/verbIds";

export const PARTS = ["words", "verbs", "sentences"];

/** The items of a list: words (incl. verbs), sentences. `lessons` is a Map id → lesson row. */
export function itemsOf(source, lessons) {
  if (source.set) return setItems(getSet(source.set));
  const lesson = lessons.get(source.lesson);
  if (!lesson) return [];
  if (source.part === "words") return wordsForLists(lesson.word_list);
  if (source.part === "sentences") return sentencesForLists(lesson.sentence_list);
  if (source.part === "verbs") return lessonVerbs(lesson.verb_ids);
  return [];
}

/** One card: what is asked (nl) and the answer (en), plus extras for the back. */
export function cardOf(item) {
  const isSentence = item.id.startsWith("sentence.");
  return {
    id: item.id,
    item,
    kind: isSentence ? "sentence" : item.partOfSpeech === "verb" && item.conjugation ? "verb" : "word",
    nl: isSentence ? item.nl : `${item.article ? item.article + " " : ""}${item.nl}`,
    en: item.en || "",
  };
}

/** The lists of a lesson that have something to practise. */
export function partsOf(lesson) {
  const lessons = new Map([[lesson.id, lesson]]);
  return PARTS.map((part) => ({ part, count: itemsOf({ lesson: lesson.id, part }, lessons).length })).filter(
    (p) => p.count > 0
  );
}

/** Fisher–Yates. */
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Title of a deck made from a lesson part: "Werkwoorden vervoegen · Woorden". */
export const deckTitle = (lesson, part, t) => `${lesson.title} · ${t(`fc.part.${part}`)}`;
