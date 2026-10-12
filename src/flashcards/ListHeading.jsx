import { useI18n } from "../i18n/context";
import FlashcardButton from "./FlashcardButton";
import { deckTitle } from "./cards";
import { navigate } from "../hooks/useRoute";
import { pathFor } from "../routes";
import { Cards, PencilSimpleLine } from "../icons";

/**
 * A list heading in a lesson: "Oefenen" practises the list straight away,
 * "Flashcards" adds it to Mijn flashcards, and the verbs also get
 * "Vervoegen" (typed conjugation drill). `practiseOnly` (docent editing a
 * lesson) leaves out the Mijn flashcards toggle.
 */
export default function ListHeading({ children, lesson, part, forProfileId, practiseOnly }) {
  const { t } = useI18n();
  return (
    <h4 className="fc-heading">
      <span>{children}</span>
      {lesson?.id && (
        <span className="fc-heading-tools">
          {!forProfileId && (
            <button
              type="button"
              className="fc-add"
              title={t("fc.practiseNowHint")}
              onClick={() => navigate(pathFor("flashcards", `oefen-${part}-${lesson.id}`))}
            >
              <Cards aria-hidden="true" /> {t("fc.practiseNow")}
            </button>
          )}
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
          {!practiseOnly && (
            <FlashcardButton source={{ lesson: lesson.id, part }} title={deckTitle(lesson, part, t)} forProfileId={forProfileId} />
          )}
        </span>
      )}
    </h4>
  );
}
