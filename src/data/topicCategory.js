/**
 * Topics are grammar, spelling or pronunciation (one entity, so ids and links
 * stay). A topic without a category is grammar: older data and changesets keep working.
 */
export const TOPIC_CATEGORIES = ["grammar", "spelling", "pronunciation"];
export const DEFAULT_TOPIC_CATEGORY = "grammar";

export const categoryOf = (topic) =>
  TOPIC_CATEGORIES.includes(topic?.category) ? topic.category : DEFAULT_TOPIC_CATEGORY;
