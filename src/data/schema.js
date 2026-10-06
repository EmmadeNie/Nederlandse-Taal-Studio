/**
 * Nederlandse Taal Studio - Datamodel (v2)
 * =========================================
 *
 * Herbruikbare bouwblokken, via tags gekoppeld. Een oefening slaat geen eigen
 * content op maar is een "recept" (query) over woorden en zinnen.
 *
 * Kern-bouwblokken:
 *   1. words     - woordenschat (incl. werkwoorden met volledige vervoeging)
 *   2. sentences - voorbeeld- en oefenzinnen (rijk gemetadateerd)
 *   3. topics    - grammatica-/theorie-onderwerpen
 *   4. exercises - recepten die query'en op tags
 *
 * ID-CONVENTIE
 *   `type.slug` in kleine letters, koppeltekens binnen de slug.
 *   word.hond | sentence.gisteren-slecht-geslapen | topic.perfectum | exercise.perfectum-a2
 *
 * NIVEAU
 *   `introducedAtLevel` = laagste CEFR-niveau waarop het item wordt geïntroduceerd.
 *   Een A0-item is dus ook bruikbaar in A2-oefeningen (zie queryUpToLevel).
 *
 * REVIEWSTATUS
 *   "draft"          - ruwe import, nog niet gecontroleerd
 *   "ai-reviewed"    - door AI gecontroleerd/omgebouwd, wacht op menselijke verificatie
 *   "human-verified" - door een mens (de docent) expliciet goedgekeurd
 *   Regel: alleen een mens zet "human-verified". AI gaat niet verder dan "ai-reviewed".
 */

/** @typedef {"A0"|"A1"|"A2"|"B1"|"B2"} Level */
/** @typedef {"draft"|"ai-reviewed"|"human-verified"} ReviewStatus */
/** @typedef {"regular"|"irregular"} Regularity */

export const LEVELS = ["A0", "A1", "A2", "B1", "B2"];
export const REVIEW_STATUSES = ["draft", "ai-reviewed", "human-verified"];
export const PARTS_OF_SPEECH = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "pronoun",
  "conjunction",
  "numeral",
  "other",
];

/**
 * Canonieke THEMES (betekenisvelden). Gebruik voor woordenschat.
 * Houd deze lijst leidend; voeg hier bewust nieuwe thema's toe.
 */
export const THEMES = [
  "eten",
  "fruit",
  "dieren",
  "kleuren",
  "mensen",
  "familie",
  "kleding",
  "huis",
  "keuken",
  "badkamer",
  "huishouden",
  "apparaten",
  "dingen",
  "plaatsen",
  "vervoer",
  "beweging",
  "sport",
  "vrije-tijd",
  "werk",
  "school",
  "communicatie",
  "emoties",
  "weer",
  "natuur",
  "zintuigen",
  "beschrijvend",
  "dagelijks-leven",
  "grammatica",
  "uitspraak",
];

/**
 * Canonieke GRAMMAR TAGS (grammaticale verschijnselen).
 * Gebruik op sentences en topics om ze te koppelen.
 */
export const GRAMMAR_TAGS = [
  "tegenwoordige-tijd",
  "verleden-tijd",
  "perfectum",
  "futurum",
  "inversie",
  "woordvolgorde",
  "bijzin",
  "modale-werkwoorden",
  "scheidbare-werkwoorden",
  "vragen",
  "ontkenning",
  "lidwoorden",
  "de-het",
  "vervoegen",
  "klinkers",
  "lettergrepen",
  "uitspraak",
];

/**
 * Canonieke TAGS (vrije eigenschappen die geen thema of grammatica zijn).
 */
export const TAGS = [
  "regelmatig-ww",
  "onregelmatig-ww",
  "hulpwerkwoord",
  "modaal-werkwoord",
  "scheidbaar-ww",
  "formeel",
  "informeel",
];

export const TENSES = [
  "tegenwoordige-tijd",
  "verleden-tijd",
  "perfectum",
  "futurum",
];
export const SENTENCE_TYPES = [
  "statement",
  "question",
  "imperative",
  "negation",
];
export const WORD_ORDERS = ["svo", "inversion", "subordinate"];

/**
 * @typedef {Object} Conjugation
 * @property {string} infinitive
 * @property {string} stem
 * @property {Object} present      - {ik, jij, hij, wij}
 * @property {Object} past         - {singular, plural}
 * @property {string} participle   - voltooid deelwoord
 * @property {"hebben"|"zijn"} auxiliary
 * @property {Object} regularity   - {present?, past, participle} elk "regular" | "irregular"
 */

/**
 * @typedef {Object} Word
 * @property {string} id
 * @property {string} nl
 * @property {string} [article]            - "de" | "het"
 * @property {string} en
 * @property {string} partOfSpeech
 * @property {Level} introducedAtLevel
 * @property {string[]} themes
 * @property {string[]} tags
 * @property {string} [plural]
 * @property {Conjugation} [conjugation]   - alleen bij werkwoorden
 * @property {ReviewStatus} reviewStatus
 * @property {string} [reviewNotes]
 */

/**
 * @typedef {Object} Sentence
 * @property {string} id
 * @property {string} nl
 * @property {string} en
 * @property {Level} introducedAtLevel
 * @property {number} difficulty           - 1-5, fijnmaziger dan CEFR
 * @property {string[]} themes
 * @property {string[]} grammarTags
 * @property {string} [tense]              - zie TENSES
 * @property {string} [sentenceType]       - zie SENTENCE_TYPES
 * @property {string} [wordOrder]          - zie WORD_ORDERS
 * @property {string[]} wordIds            - alle woorden uit de zin (hergebruik)
 * @property {string[]} [focusWordIds]     - kernwoord(en) voor invuloefeningen
 * @property {ReviewStatus} reviewStatus
 * @property {string} [reviewNotes]
 */

/**
 * @typedef {Object} Topic
 * @property {string} id
 * @property {string} title
 * @property {Level} introducedAtLevel
 * @property {string} summary
 * @property {string} [explanation]
 * @property {string[]} grammarTags
 * @property {string[]} themes
 * @property {string[]} docLinks
 * @property {ReviewStatus} reviewStatus
 */

/**
 * @typedef {Object} Exercise
 * @property {string} id
 * @property {string} title
 * @property {string} type                 - "fill-in" | "multiple-choice" | "translate" | "flashcards"
 * @property {Level} level                 - doelniveau van de oefening
 * @property {Object} query                - recept
 * @property {string[]} [query.themes]
 * @property {string[]} [query.grammarTags]
 * @property {Level}    [query.maxLevel]   - neem alles t/m dit niveau
 * @property {string}   [query.tense]
 * @property {number}   [query.limit]
 * @property {string}   [topicId]
 */
