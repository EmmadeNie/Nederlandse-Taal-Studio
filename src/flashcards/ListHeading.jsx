import { useI18n } from "../i18n/context";
import FlashcardButton from "./FlashcardButton";
import { deckTitle } from "./cards";
import { navigate } from "../hooks/useRoute";
import { pathFor } from "../routes";
import { PencilSimpleLine } from "../icons";

/**
 * A list heading in a lesson, with "Flashcards" to add that list to Mijn
 * flashcards; the verbs also get "Vervoegen" (typed conjugation drill).
 */
export default function ListHeading({ children, lesson, part, forProfileId }) {
  const { t } = useI18n();
  return (
    <h4 className="fc-heading">
      <span>{children}</span>
      {lesson?.id && (
        <span className="fc-heading-tools">
          {part === "verbs" && !forProfileId && (
            <button
              type="button"
              className="fc-add"
              title={t("vd.hint")}
              onClick={() => navigate(pathFor("flashcards", `vervoegen-les-${lesson.id}`))}
            >
              <PencilSimpleLine aria-hidden="true" /> {t("vd.button")}
            </button>
          )}
          <FlashcardButton source={{ lesson: lesson.id, part }} title={deckTitle(lesson, part, t)} forProfileId={forProfileId} />
        </span>
      )}
    </h4>
  );
}
