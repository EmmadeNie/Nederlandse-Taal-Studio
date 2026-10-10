/** Grammar topics on lessons: ids of topics in the grammar library (content_items of type topic). */
import { topics } from "../data";

/** The chosen topics that exist in the grammar library, in the chosen order. */
export const knownTopics = (ids = []) => ids.map((id) => topics.find((t) => t.id === id)).filter(Boolean);

export const grammarCount = (ids) => knownTopics(ids).length;
