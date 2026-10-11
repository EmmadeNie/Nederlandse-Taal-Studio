import { useI18n } from "../i18n/context";
import FlashcardButton from "./FlashcardButton";
import { deckTitle } from "./cards";

/** A list heading in a lesson, with "Flashcards" to add that list to Mijn flashcards. */
export default function ListHeading({ children, lesson, part }) {
  const { t } = useI18n();
  return (
    <h4 className="fc-heading">
      <span>{children}</span>
      {lesson?.id && <FlashcardButton source={{ lesson: lesson.id, part }} title={deckTitle(lesson, part, t)} />}
    </h4>
  );
}
