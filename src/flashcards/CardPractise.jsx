import { useState } from "react";
import { useI18n } from "../i18n/context";
import { navigate } from "../hooks/useRoute";
import { pathFor } from "../routes";
import { Dialog } from "../leerpad/shared";
import { Cards, PencilSimpleLine, Textbox } from "../icons";
import { itemsOf } from "./cards";
import { drillable, fillWordsOf } from "./conjugate";

/** What can be practised from a lesson: flashcards per list, Vervoegen, Invullen. */
function practiseOptions(lesson, t) {
  const lessons = new Map([[lesson.id, lesson]]);
  const of = (part) => itemsOf({ lesson: lesson.id, part }, lessons);
  const words = of("words");
  const verbs = of("verbs");
  const sentences = of("sentences");
  const options = [];
  if (words.length) options.push({ key: "words", icon: Cards, label: t("cp.words", { n: words.length }), path: `oefen-words-${lesson.id}` });
  if (verbs.length) options.push({ key: "verbs", icon: Cards, label: t("cp.verbs", { n: verbs.length }), path: `oefen-verbs-${lesson.id}` });
  if (sentences.length) {
    options.push({ key: "sentences", icon: Cards, label: t("cp.sentences", { n: sentences.length }), path: `oefen-sentences-${lesson.id}` });
  }
  if (drillable(verbs).length) options.push({ key: "conjugate", icon: PencilSimpleLine, label: t("vd.title"), path: `vervoegen-les-${lesson.id}` });
  if (fillWordsOf([...words, ...verbs]).length) {
    options.push({ key: "fill", icon: Textbox, label: t("fd.title"), path: `invullen-les-${lesson.id}` });
  }
  return options;
}

/**
 * "Oefenen" on a lesson card on the board: straight to the practice when
 * there is one kind, otherwise a small menu (flashcards per list, Vervoegen,
 * Invullen). Clicks don't open the card itself.
 */
export default function CardPractise({ lesson }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (!lesson?.id) return null;
  const options = practiseOptions(lesson, t);
  if (!options.length) return null;
  const go = (option) => navigate(pathFor("flashcards", option.path));
  return (
    // Keep clicks and keys inside: the card around this opens the lesson.
    <span className="cp-wrap" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="cp-button"
        title={t("cp.hint")}
        aria-label={t("cp.aria", { name: lesson.title })}
        onClick={() => (options.length === 1 ? go(options[0]) : setOpen(true))}
      >
        <Cards aria-hidden="true" /> {t("fc.practiseNow")}
      </button>
      {open && (
        <Dialog title={t("cp.title", { name: lesson.title })} onClose={() => setOpen(false)}>
          <div className="cp-options">
            {options.map((o) => (
              <button key={o.key} type="button" className="cp-option" onClick={() => go(o)}>
                <o.icon aria-hidden="true" /> {o.label}
              </button>
            ))}
          </div>
        </Dialog>
      )}
    </span>
  );
}
