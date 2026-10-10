/** Where something a proposal deletes is still used: lessons, grammar, sets, sentences, exercises. */
import { exercises, getSet, sentences, setsWithItem, topics } from "../data";
import { lessonsUsing } from "../data/contentApi";
import { itemLabel } from "../library/fields";

const MAX = 5; // per kind; the rest is counted

/** [{ key, vars }] for t(); empty when nothing uses it. */
export async function usageOf(change) {
  const out = [];
  const list = (key, items, name = itemLabel) => {
    items.slice(0, MAX).forEach((x) => out.push({ key, vars: { name: name(x) } }));
    if (items.length > MAX) out.push({ key: "pr.use.more", vars: { n: items.length - MAX } });
  };
  const lessonNames = (rows) => rows.map((l) => l.title).join(", ");

  if (change.op === "set.delete") {
    if (!getSet(change.set)) return out;
    list("ie.inLesson", await lessonsUsing({ setId: change.set }), (l) => l.title);
    return out;
  }
  if (change.op !== "delete") return out;

  const id = change.id;
  for (const s of setsWithItem(id)) {
    const lessons = await lessonsUsing({ setId: s.id });
    out.push(
      lessons.length
        ? { key: "pr.use.setInLessons", vars: { name: s.title, lessons: lessonNames(lessons) } }
        : { key: "ie.inSet", vars: { name: s.title } }
    );
  }
  list("pr.use.topic", topics.filter((x) => x.relatedWordIds?.includes(id) || x.exampleSentenceIds?.includes(id)));
  list("pr.use.sentence", sentences.filter((x) => x.wordIds?.includes(id) || x.focusWordIds?.includes(id)));
  if (id.startsWith("word.")) list("ie.inLesson", await lessonsUsing({ verbId: id }), (l) => l.title);
  if (id.startsWith("topic.")) {
    list("ie.inLesson", await lessonsUsing({ topicId: id }), (l) => l.title);
    list("pr.use.exercise", exercises.filter((x) => x.topicId === id));
  }
  return out;
}
