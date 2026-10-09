/** Grammar topics on lessons: ids of topics in the grammar library (src/data/topics.json). */
import { topics } from "../data";

const topicById = new Map(topics.map((t) => [t.id, t]));

/** The chosen topics that exist in the grammar library, in the chosen order. */
export const knownTopics = (ids = []) => ids.map((id) => topicById.get(id)).filter(Boolean);

export const grammarCount = (ids) => knownTopics(ids).length;
