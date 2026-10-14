/**
 * The steps of the student tour (see Tour.jsx): which page each is on, what it
 * points at, and the try-it examples. The menu uses this to offer "uitleg over
 * deze pagina" on the pages the tour covers.
 */
import { ConjugateDemo, FillDemo, FlipDemo } from "./TourDemos";

export const TOUR_STEP_KEY = "tour-step";

export const STEPS = [
  { id: "welcome", page: "leerpad", anchor: ".board" },
  { id: "program", page: "leerpad", anchor: '[data-tour="nav-lesprogramma"]' },
  { id: "levels", page: "lesprogramma", anchor: '[data-tour="add-levels"]', curriculum: ["A0", "A1"] },
  { id: "select", page: "lesprogramma", anchor: '[data-tour="select"]' },
  { id: "practise", page: "leerpad", anchor: ".cp-button, .board" },
  // Mijn flashcards: the three kinds of exercise, each with a tiny example to try.
  { id: "flashcards", page: "flashcards", anchor: '[data-tour="nav-flashcards"]' },
  { id: "demoFlip", page: "flashcards", demo: FlipDemo },
  { id: "demoFill", page: "flashcards", demo: FillDemo },
  { id: "demoConjugate", page: "flashcards", demo: ConjugateDemo },
];

/** The first step on a page (where "uitleg" from the menu starts), or null. */
export const firstStepFor = (page) => {
  const i = STEPS.findIndex((s) => s.page === page);
  return i < 0 ? null : i;
};

/** Start the tour at a step (Tour reads it when it opens). */
export function setTourStart(index) {
  try {
    sessionStorage.setItem(TOUR_STEP_KEY, String(index));
  } catch {
    // private mode: the tour starts at the beginning
  }
}
