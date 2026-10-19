/** Grammar topics in Dutch (the default) or English: titleEn, summaryEn, shortEn, explanationEn. */
export const hasEnglish = (topic) => Boolean(topic?.titleEn || topic?.summaryEn || topic?.shortEn || topic?.explanationEn);

/** The texts to show; English falls back to Dutch per field. */
export const topicText = (topic, lang) => {
  const en = lang === "en";
  return {
    title: (en && topic.titleEn) || topic.title,
    summary: (en && topic.summaryEn) || topic.summary,
    explanation: (en && topic.explanationEn) || topic.explanation,
    // The short version: in English only when there is one, or when there is no English text at all
    // (then everything is Dutch anyway); never a Dutch short version above an English full text.
    short: en ? topic.shortEn || (topic.explanationEn ? "" : topic.short) : topic.short,
  };
};
