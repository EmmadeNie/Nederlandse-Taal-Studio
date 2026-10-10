import { useState } from "react";
import FeedbackDialog from "./FeedbackDialog";
import { useFeedbackCount } from "./useFeedback";
import { useI18n } from "../i18n/context";
import { ICONS } from "../icons";
import { usePrefs } from "../prefs/context";

/**
 * Small feedback button to attach to any content card. Only shown in
 * feedback mode (the speech-bubble switch top right).
 *
 * Props:
 *   itemType  - "word" | "verb" | "sentence" | "topic" | "exercise"
 *   itemId    - id of the content item
 *   itemLabel - human-readable label (shown in the dialog)
 */
export default function FeedbackButton({ itemType, itemId, itemLabel }) {
  const [open, setOpen] = useState(false);
  const count = useFeedbackCount(itemId);
  const { t } = useI18n();
  const { feedbackMode } = usePrefs();
  if (!feedbackMode) return null;

  return (
    <>
      <button
        className={`fb-button ${count > 0 ? "has-feedback" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title={t("fb.title")}
        aria-label={t("fb.aboutItem", { label: itemLabel })}
      >
        <ICONS.feedback weight={count > 0 ? "fill" : "regular"} />
        {count > 0 ? ` ${count}` : ""}
      </button>
      {open && (
        <FeedbackDialog
          itemType={itemType}
          itemId={itemId}
          itemLabel={itemLabel}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
