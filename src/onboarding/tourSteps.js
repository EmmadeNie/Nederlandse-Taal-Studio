/**
 * The steps of the student tour (see Tour.jsx): which page each is on, what it
 * points at, and the try-it examples. The menu uses this to offer "uitleg over
 * deze pagina" on the pages the tour covers.
 */
import { ConjugateDemo, FillDemo, FlipDemo } from "./TourDemos";

export const TOUR_STEP_KEY = "tour-step";

// A lesson card with practise buttons: the one in Doing when the tour just filled the board
// (the lane after the focus lane To do), else any, else the board itself.
// An anchor can be a list: the first one that is on the page is used.
const PRACTISE_CARD = [".board-lane.is-focus + .board-lane .board-card:has(.cp-wrap)", ".board-card:has(.cp-wrap)", ".board"];

export const STEPS = [
  { id: "welcome", page: "leerpad", anchor: ".board" },
  // Which levels of the curriculum go on the board: the student ticks them (A0 and A1 to start with).
  { id: "levels", page: "leerpad", levelChoice: ["A0", "A1"] },
  { id: "browse", page: "leerpad", anchor: '[data-tour="browse"]' },
  // Practising starts on the board: a lesson card's own buttons, then all flashcards together in Mijn flashcards.
  { id: "practise", page: "leerpad", anchor: PRACTISE_CARD },
  // Mijn flashcards: the three kinds of exercise, each with a tiny example to try.
  { id: "flashcards", page: "flashcards", anchor: '[data-tour="nav-flashcards"]' },
  { id: "demoFlip", page: "flashcards", demo: FlipDemo },
  { id: "demoFill", page: "flashcards", demo: FillDemo },
  { id: "demoConjugate", page: "flashcards", demo: ConjugateDemo },
  // The end: back on the board, at the lesson to start with.
  { id: "start", page: "leerpad", anchor: PRACTISE_CARD },
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
