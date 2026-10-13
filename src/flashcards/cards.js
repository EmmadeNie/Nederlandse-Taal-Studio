/**
 * Which cards a deck holds, worked out from the lesson or set it points at
 * (so a deck follows changes to its list).
 */
import { getSet, setItems } from "../data";
import { hasWordList, toLists, wordsForList, wordsForLists } from "../leerpad/wordLists";
import { hasSentenceList, sentencesForList, sentencesForLists } from "../leerpad/sentenceLists";
import { lessonVerbs } from "../leerpad/verbIds";

export const PARTS = ["words", "verbs", "sentences"];

/**
 * The items of a list: words (incl. verbs), sentences. `lessons` is a Map id →
 * lesson row. A lesson source is one part (all its lists), or with `index`
 * one of the lesson's word or sentence lists.
 */
export function itemsOf(source, lessons) {
  if (source.set) return setItems(getSet(source.set));
  const lesson = lessons.get(source.lesson);
  if (!lesson) return [];
  const one = source.index != null;
  if (source.part === "words") {
    return one ? wordsForList(toLists(lesson.word_list)[source.index]) : wordsForLists(lesson.word_list);
  }
  if (source.part === "sentences") {
    return one ? sentencesForList(toLists(lesson.sentence_list)[source.index]) : sentencesForLists(lesson.sentence_list);
  }
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

/** A list recipe in words: "Voorzetsels en richtingwoorden · t/m A1". */
export function listLabel(spec, t) {
  return [
    spec.set && (getSet(spec.set)?.title || spec.set.replace(/-/g, " ")),
    spec.theme && spec.theme.replace(/-/g, " "),
    spec.grammarTag && spec.grammarTag.replace(/-/g, " "),
    spec.partOfSpeech && t(`pos.${spec.partOfSpeech}`).toLowerCase(),
    spec.level && (spec.upTo ? t("wl.upToLevel", { level: spec.level }) : spec.level),
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * The separate lists of a lesson, each with its items: every word list, the
 * verbs, every sentence list. `key` goes in the practice path: "words.0",
 * "verbs", "sentences.1".
 */
export function lessonLists(lesson, t) {
  const lessons = new Map([[lesson.id, lesson]]);
  const out = [];
  toLists(lesson.word_list).forEach((spec, index) => {
    if (!hasWordList(spec)) return;
    const items = itemsOf({ lesson: lesson.id, part: "words", index }, lessons);
    if (items.length) out.push({ part: "words", index, key: `words.${index}`, label: listLabel(spec, t) || t("fc.part.words"), items });
  });
  const verbs = itemsOf({ lesson: lesson.id, part: "verbs" }, lessons);
  if (verbs.length) out.push({ part: "verbs", index: null, key: "verbs", label: t("fc.part.verbs"), items: verbs });
  toLists(lesson.sentence_list).forEach((spec, index) => {
    if (!hasSentenceList(spec)) return;
    const items = itemsOf({ lesson: lesson.id, part: "sentences", index }, lessons);
    if (items.length) {
      out.push({ part: "sentences", index, key: `sentences.${index}`, label: listLabel(spec, t) || t("fc.part.sentences"), items });
    }
  });
  return out;
}

/** "words.1" → { part: "words", index: 1 }; "verbs" → { part: "verbs", index: null }. */
export function parseListKey(key) {
  const m = /^(words|verbs|sentences)(?:\.(\d+))?$/.exec(key || "");
  return m ? { part: m[1], index: m[2] != null ? Number(m[2]) : null } : null;
}
