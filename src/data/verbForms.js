/**
 * Verbs without a perfect tense (e.g. "zullen"): no participle, no auxiliary,
 * no regularity.participle. Only all three missing together counts; one or two
 * missing is an incomplete verb. Such verbs show "n.v.t." for those forms and
 * get no exercises on the perfect.
 */
export const hasNoPerfect = (conjugation) =>
  Boolean(conjugation) &&
  !conjugation.participle &&
  !conjugation.auxiliary &&
  !conjugation.regularity?.participle;

/** Fields that such a verb may leave out. */
export const PERFECT_FIELDS = ["conjugation.participle", "conjugation.auxiliary", "conjugation.regularity.participle"];
