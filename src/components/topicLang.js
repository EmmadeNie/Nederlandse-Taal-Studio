/** Grammar topics in Dutch (the default) or English: titleEn, summaryEn, explanationEn. */
export const hasEnglish = (topic) => Boolean(topic?.titleEn || topic?.summaryEn || topic?.explanationEn);

/** The texts to show; English falls back to Dutch per field. */
export const topicText = (topic, lang) => {
  const en = lang === "en";
  return {
    title: (en && topic.titleEn) || topic.title,
    summary: (en && topic.summaryEn) || topic.summary,
    explanation: (en && topic.explanationEn) || topic.explanation,
  };
};
