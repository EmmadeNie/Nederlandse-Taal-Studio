import { useState } from "react";
import { useI18n } from "../i18n/context";
import { navigate } from "../hooks/useRoute";
import { pathFor } from "../routes";
import { Dialog } from "../leerpad/shared";
import { CaretLeft, Cards, PencilSimpleLine, Textbox, UserList } from "../icons";
import { getItem } from "../data";
import { sentencesForLists } from "../leerpad/sentenceLists";
import { lessonLists } from "./cards";
import { drillable, fillWordsOf } from "./conjugate";

const verbsIn = (items) => drillable(items.filter((i) => i.partOfSpeech === "verb"));

/**
 * What can be practised from a lesson, per kind: flashcards (every list),
 * Invullen (lists with words that are marked in sentences) and Vervoegen
 * (lists with verbs that have a conjugation table). Each kind lists its
 * lists with a path; Invullen and Vervoegen also offer all lists together.
 */
function practiseKinds(lesson, t) {
  const lists = lessonLists(lesson, t);
  const kinds = [
    {
      key: "flashcards",
      icon: Cards,
      label: t("cp.flashcards"),
      lists: lists.map((l) => ({ ...l, count: l.items.length, path: `oefen-${l.key}-${lesson.id}` })),
    },
    {
      key: "fill",
      icon: Textbox,
      label: t("fd.title"),
      all: `invullen-les-${lesson.id}`,
      lists: lists
        .filter((l) => l.part !== "sentences")
        .map((l) => ({ ...l, count: fillWordsOf(l.items).length, path: `invullen-les.${l.key}-${lesson.id}` }))
        .filter((l) => l.count > 0),
    },
    {
      key: "conjugate",
      icon: PencilSimpleLine,
      label: t("vd.title"),
      // Only the lesson's linked verbs (verb tiles): word and sentence lists are for flashcards.
      lists: lists
        .filter((l) => l.part === "verbs")
        .map((l) => ({ ...l, count: verbsIn(l.items).length, path: `vervoegen-les.${l.key}-${lesson.id}` }))
        .filter((l) => l.count > 0),
    },
  ];
  // Voornaamwoorden: only on a lesson about them (grammar topic). Pronouns are marked in nearly
  // every sentence, so "has sentences with pronouns" would put it on almost every card; anyone can
  // still practise them from Mijn flashcards.
  const aboutPronouns = (lesson.topic_ids || []).some((id) => (getItem(id)?.grammarTags || []).includes("voornaamwoorden"));
  const ownWithPronouns = sentencesForLists(lesson.sentence_list).filter((s) => s.pronouns?.length).length;
  if (aboutPronouns) {
    kinds.push({
      key: "pronouns",
      icon: UserList,
      label: t("pd.title"),
      lists: [{ key: "pronouns", label: t("pd.title"), count: ownWithPronouns, path: `voornaamwoorden-les-${lesson.id}` }],
    });
  }
  return kinds.filter((k) => k.lists.length > 0);
}

// What a lesson is about, from its grammar topics and title → the exercise that fits it.
const VERB_TAGS = [
  "vervoegen", "tegenwoordige-tijd", "verleden-tijd", "perfectum", "plusquamperfectum", "futurum",
  "modale-werkwoorden", "scheidbare-werkwoorden", "reflexieve-werkwoorden", "hoeven", "positiewerkwoorden",
];
const VERB_TITLE = /werkwoord|vervoeg|perfectum|imperfectum|verleden tijd/i;

/** The kind of practice the lesson is about (conjugate / pronouns / fill), or null. */
function recommendedKind(lesson, kinds) {
  const tags = (lesson.topic_ids || []).flatMap((id) => getItem(id)?.grammarTags || []);
  const has = (key) => kinds.some((k) => k.key === key);
  if (tags.includes("voornaamwoorden") && has("pronouns")) return "pronouns";
  if ((tags.some((x) => VERB_TAGS.includes(x)) || VERB_TITLE.test(lesson.title || "")) && has("conjugate")) return "conjugate";
  if (tags.includes("voorzetsels") && has("fill")) return "fill";
  return null;
}

/**
 * "Oefenen" on a lesson card on the board: first what (flashcards, Invullen,
 * Vervoegen — only what this lesson has), then which of the lesson's lists.
 * A step with only one choice is skipped. Clicks don't open the card itself.
 */
export default function CardPractise({ lesson }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [kindKey, setKindKey] = useState(null);
  if (!lesson?.id) return null;
  const kinds = practiseKinds(lesson, t);
  if (!kinds.length) return null;

  const go = (path) => navigate(pathFor("flashcards", path));
  const choose = (kind) => {
    if (kind.lists.length === 1) go(kind.lists[0].path);
    else {
      setKindKey(kind.key);
      setOpen(true);
    }
  };
  // A lesson about verbs (pronouns, prepositions) starts that exercise straight away, all its lists
  // together; ▾ next to the button opens the menu with every kind.
  const recommended = kinds.find((k) => k.key === recommendedKind(lesson, kinds));
  const openMenu = () => {
    setKindKey(null);
    setOpen(true);
  };
  const start = () => {
    if (recommended) go(recommended.lists.length > 1 && recommended.all ? recommended.all : recommended.lists[0].path);
    else if (kinds.length === 1) choose(kinds[0]);
    else openMenu();
  };
  const kind = kinds.find((k) => k.key === kindKey);
  const close = () => {
    setOpen(false);
    setKindKey(null);
  };

  return (
    // Keep clicks and keys inside: the card around this opens the lesson.
    <span className="cp-wrap" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={`cp-button ${recommended && kinds.length > 1 ? "has-more" : ""}`}
        title={recommended ? t("cp.startKind", { kind: recommended.label }) : t("cp.hint")}
        aria-label={t("cp.aria", { name: lesson.title })}
        onClick={start}
      >
        {recommended ? <recommended.icon aria-hidden="true" /> : <Cards aria-hidden="true" />}{" "}
        {recommended ? recommended.label : t("fc.practiseNow")}
      </button>
      {recommended && kinds.length > 1 && (
        <button type="button" className="cp-button cp-more" title={t("cp.otherKinds")} aria-label={t("cp.otherKinds")} onClick={openMenu}>
          ▾
        </button>
      )}
      {open && (
        <Dialog title={t("cp.title", { name: lesson.title })} onClose={close}>
          {!kind ? (
            <>
              <p className="cp-question">{t("cp.what")}</p>
              <div className="cp-options">
                {kinds.map((k) => (
                  <button key={k.key} type="button" className="cp-option" onClick={() => choose(k)}>
                    <k.icon aria-hidden="true" />
                    <span>
                      <strong>{k.label}</strong>
                      <span className="dim">{t(`cp.about.${k.key}`)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="cp-question">
                <kind.icon aria-hidden="true" /> {kind.label}: {t("cp.which")}
              </p>
              <div className="cp-options">
                {kind.lists.map((l) => (
                  <button key={l.key} type="button" className="cp-option" onClick={() => go(l.path)}>
                    <span>
                      <strong>{l.label}</strong>
                      <span className="dim">{t(`cp.count.${kind.key}`, { n: l.count })}</span>
                    </span>
                  </button>
                ))}
                {kind.all && kind.lists.length > 1 && (
                  <button type="button" className="cp-option is-all" onClick={() => go(kind.all)}>
                    <span>
                      <strong>{t("cp.allLists")}</strong>
                    </span>
                  </button>
                )}
              </div>
              {kinds.length > 1 && (
                <button type="button" className="fb-link cp-back" onClick={() => setKindKey(null)}>
                  <CaretLeft aria-hidden="true" /> {t("cp.back")}
                </button>
              )}
            </>
          )}
        </Dialog>
      )}
    </span>
  );
}
