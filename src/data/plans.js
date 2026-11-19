/**
 * The subscriptions as students see them: price and what each one includes.
 * One list for the app (Mijn abonnement) and the public lessons page
 * (scripts/build-seo.mjs), so they always say the same. No payments yet: the
 * docent sets a student's plan by hand (see src/auth/plan.jsx).
 *
 * Trial is not on the list: it is a free try of Compleet that every new account starts with,
 * TRIAL_DAYS long (not enforced yet: the docent ends a trial by hand, for now not at all).
 */
export const TRIAL_DAYS = 14;

export const PLAN_OFFERS = [
  { id: "gratis", price: 0, features: ["look"] },
  { id: "onderweg", price: 10, features: ["look", "practise"] },
  // Compleet goes through the docent; with 8 lessons a month it is included.
  { id: "compleet", price: 50, freeWithLessons: 8, featured: true, features: ["look", "practise", "lessons", "path"] },
];

/** Every feature, in the order the cards list them. */
export const PLAN_FEATURES = ["look", "practise", "lessons", "path"];

export const PLAN_TEXT = {
  nl: {
    title: "Abonnementen",
    intro: `Kies wat bij je past. Nieuw? Je probeert Taal Studio Compleet eerst ${TRIAL_DAYS / 7} weken gratis.`,
    name: { gratis: "Gratis", onderweg: "Onderweg", compleet: "Compleet" },
    tagline: {
      gratis: "Rondkijken",
      onderweg: "Oefenen, waar je ook bent",
      compleet: "Alles, met je eigen docent",
    },
    price: (n) => (n ? `€${n}` : "€0"),
    perMonth: "per maand",
    freeWith: (n) => `Gratis bij ${n} lessen per maand`,
    viaDocent: "Verrekend met je docent",
    feature: {
      look: "Je leerpad en het lesprogramma bekijken",
      practise: "Flashcards, Invullen en Vervoegen",
      lessons: "Alle lessen met uitleg, werkwoorden en woordenlijsten",
      path: "Een leerpad dat je docent voor je samenstelt",
    },
  },
  en: {
    title: "Plans",
    intro: `Choose what suits you. New? You try Taal Studio Compleet free for ${TRIAL_DAYS / 7} weeks first.`,
    name: { gratis: "Free", onderweg: "On the go", compleet: "Compleet" },
    tagline: {
      gratis: "Look around",
      onderweg: "Practise wherever you are",
      compleet: "Everything, with your own teacher",
    },
    price: (n) => (n ? `€${n}` : "€0"),
    perMonth: "per month",
    freeWith: (n) => `Free with ${n} lessons a month`,
    viaDocent: "Settled with your teacher",
    feature: {
      look: "View your learning path and the curriculum",
      practise: "Flashcards, Fill in and Conjugate",
      lessons: "Every lesson with explanations, verbs and word lists",
      path: "A learning path your teacher puts together for you",
    },
  },
};
