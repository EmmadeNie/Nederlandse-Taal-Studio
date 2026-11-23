import { useId, useRef, useState } from "react";
import { useI18n } from "../i18n/context";
import LessonExplanation from "./LessonExplanation";
import LessonFiles from "./LessonFiles";
import { GrammarView } from "./LessonGrammar";
import { lessonVerbs } from "./verbIds";
import { grammarCount } from "./grammarTopics";
import { hasWordList, toLists, wordListLabel, wordsForLists } from "./wordLists";
import { hasSentenceList, sentenceListLabel, sentencesForLists } from "./sentenceLists";
import { WordListsView } from "./WordList";
import { SentenceListsView } from "./SentenceList";
import VerbChips from "../components/VerbChips";
import CardPractise from "../flashcards/CardPractise";
import FlashcardButton from "../flashcards/FlashcardButton";
import { deckTitle } from "../flashcards/cards";

/**
 * A lesson as a student reads it (lesprogramma and leerpad): the practise
 * buttons, then tabs, one part at a time. Uitleg holds the lesson's own intro
 * and its grammar topics (each folded to its short version); then Werkwoorden,
 * Woorden, Zinnen and Bestanden, each only when the lesson has them.
 *
 * `lesson`: the lesson row (for practising and Mijn flashcards); null for a zijpad.
 * `forProfileId`: a docent looking at a student's leerpad (flashcards go to that
 * student; no practising there).
 */
export default function LessonContent({
  lesson,
  forProfileId,
  explanation,
  explanationEn,
  hasEn,
  lang,
  topicIds = [],
  verbIds = [],
  wordList,
  sentenceList,
  attachments = [],
}) {
  const { t } = useI18n();
  const verbs = lessonVerbs(verbIds);
  const wordLists = toLists(wordList).filter(hasWordList);
  const sentenceLists = toLists(sentenceList).filter(hasSentenceList);
  const canPractise = Boolean(lesson?.id) && !forProfileId;
  const en = hasEn && lang === "en" && Boolean(explanationEn?.trim());
  const hasIntro = Boolean((en ? explanationEn : explanation)?.trim());

  // "Add to Mijn flashcards" for one part of the lesson, top right of its tab.
  const flashcards = (part) =>
    lesson?.id ? (
      <FlashcardButton source={{ lesson: lesson.id, part }} title={deckTitle(lesson, part, t)} forProfileId={forProfileId} />
    ) : null;

  const tabs = [
    (hasIntro || grammarCount(topicIds) > 0) && {
      key: "uitleg",
      label: t("lp.explanation"),
      body: () => (
        <>
          <LessonExplanation explanation={explanation} explanationEn={explanationEn} hasEn={hasEn} lang={lang} bare />
          {grammarCount(topicIds) > 0 && <GrammarView ids={topicIds} lang={lang} excludeWordIds={verbIds} />}
        </>
      ),
    },
    verbs.length > 0 && {
      key: "verbs",
      label: t("lv.title"),
      count: verbs.length,
      body: () => (
        <>
          <PanelHead text={t("lc.verbsHint")} tools={flashcards("verbs")} />
          <VerbChips verbs={verbs} />
        </>
      ),
    },
    wordLists.length > 0 && {
      key: "words",
      label: t("lc.tabWords"),
      count: wordsForLists(wordList).length,
      body: () => (
        <>
          <PanelHead text={wordLists.map((spec) => wordListLabel(spec, t)).join(" + ")} tools={flashcards("words")} />
          <WordListsView value={wordList} bare />
        </>
      ),
    },
    sentenceLists.length > 0 && {
      key: "sentences",
      label: t("sl.title"),
      count: sentencesForLists(sentenceList).length,
      body: () => (
        <>
          <PanelHead text={sentenceLists.map((spec) => sentenceListLabel(spec, t)).join(" + ")} tools={flashcards("sentences")} />
          <SentenceListsView value={sentenceList} bare />
        </>
      ),
    },
    attachments.length > 0 && {
      key: "files",
      label: t("files.title"),
      count: attachments.length,
      body: () => <LessonFiles lessonId={lesson?.id} attachments={attachments} canEdit={false} />,
    },
  ].filter(Boolean);

  return (
    <div className="lesson-content">
      {canPractise && (
        <div className="lc-practise">
          <span className="lc-practise-label">{t("lc.practise")}</span>
          <CardPractise lesson={lesson} />
        </div>
      )}
      <Tabs tabs={tabs} label={t("lc.tabsLabel")} />
    </div>
  );
}

/** A line about what is in the tab, with its tools (Mijn flashcards) at the right. */
function PanelHead({ text, tools }) {
  if (!text && !tools) return null;
  return (
    <div className="lc-panel-head">
      <span className="dim">{text}</span>
      {tools}
    </div>
  );
}

/** Tabs (one panel at a time); arrow keys move between them. One tab needs no tab bar. */
function Tabs({ tabs, label }) {
  const [current, setCurrent] = useState(tabs[0]?.key);
  const id = useId();
  const refs = useRef({});
  if (!tabs.length) return null;
  const active = tabs.find((tab) => tab.key === current) || tabs[0];
  if (tabs.length === 1) return <div className="lc-panel">{active.body()}</div>;

  const move = (e, i) => {
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next == null) return;
    e.preventDefault();
    const tab = tabs[(next + tabs.length) % tabs.length];
    setCurrent(tab.key);
    refs.current[tab.key]?.focus();
  };

  return (
    <>
      <div className="lc-tabs" role="tablist" aria-label={label}>
        {tabs.map((tab, i) => {
          const on = tab.key === active.key;
          return (
            <button
              key={tab.key}
              ref={(el) => (refs.current[tab.key] = el)}
              type="button"
              role="tab"
              id={`${id}-tab-${tab.key}`}
              aria-selected={on}
              aria-controls={`${id}-panel`}
              tabIndex={on ? 0 : -1}
              className={`lc-tab ${on ? "is-on" : ""}`}
              onClick={() => setCurrent(tab.key)}
              onKeyDown={(e) => move(e, i)}
            >
              {tab.label}
              {tab.count != null && <span className="lc-tab-count">{tab.count}</span>}
            </button>
          );
        })}
      </div>
      <div className="lc-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active.key}`}>
        {active.body()}
      </div>
    </>
  );
}
