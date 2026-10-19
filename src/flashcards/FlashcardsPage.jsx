import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/context";
import { useI18n } from "../i18n/context";
import { navigate, useRoute } from "../hooks/useRoute";
import { pathFor } from "../routes";
import { getSet, sentences, setItems, setsOfType } from "../data";
import { sentencesForLists } from "../leerpad/sentenceLists";
import { useContentVersion } from "../data/useContent";
import { supabase } from "../lib/supabase";
import { LevelBadge } from "../components/Badges";
import { ArrowCounterClockwise, Cards, CheckCircle, PencilSimpleLine, Textbox, X } from "../icons";
import FlashcardButton from "./FlashcardButton";
import Practice from "./Practice";
import Drill from "./Drill";
import { drillable, fillWordsOf, tenseForLesson } from "./conjugate";
import { lessonPronounKind, withPronounsOf } from "./pronouns";
import { cardOf, deckTitle, itemsOf, lessonLists, parseListKey, partsOf } from "./cards";
import { loadDecks, removeDeck, setDeckDone, setDeckKindDone, useDecks } from "./store";
import "./flashcards.css";

const LESSON = "id, title, level, word_list, sentence_list, verb_ids";

/** Lessons on a student's leerpad (in leerpad order), or the whole lesprogramma for staff. */
async function loadMyLessons(profileId, isStudent) {
  if (isStudent) {
    const { data, error } = await supabase
      .from("steps")
      .select(`position, lesson:lessons(${LESSON})`)
      .eq("student_id", profileId)
      .not("lesson_id", "is", null)
      .order("position");
    if (error) throw new Error(error.message);
    return data.map((s) => s.lesson).filter(Boolean);
  }
  const { data, error } = await supabase.from("lessons").select(LESSON).order("title");
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Mijn flashcards: the lists someone added, practised one by one or all
 * together; below, the lists to choose from (own leerpad, and the sets).
 * /flashcards/<deck id> or /flashcards/alles practises.
 */
export default function FlashcardsPage() {
  const { t } = useI18n();
  const { profile, role } = useAuth();
  const route = useRoute();
  useContentVersion();
  const decks = useDecks(profile.id);
  const isStudent = role === "leerling";
  const [lessons, setLessons] = useState(null); // lessons to browse
  const [extra, setExtra] = useState(new Map()); // lessons of decks that are not in `lessons`
  const [error, setError] = useState(null);
  const [browse, setBrowse] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadDecks(profile.id, { force: true }).catch((e) => setError(e.message));
    loadMyLessons(profile.id, isStudent)
      .then(setLessons)
      .catch((e) => setError(e.message));
  }, [profile.id, isStudent]);

  // Vervoegen: /flashcards/vervoegen-<deck id>, -alles, or -les-<lesson id> (from a lesson).
  // Voornaamwoorden: /flashcards/voornaamwoorden (all sentences) or -les-<lesson id>.
  const pronounMatch = /^voornaamwoorden(?:-les-(.+))?$/.exec(route.param || "");
  const pronounLesson = pronounMatch?.[1] || null;

  // Vervoegen / Invullen: /flashcards/vervoegen-<deck id>, -alles, or -les-<lesson id> (from a lesson).
  const drillMatch = /^(vervoegen|invullen)-(.+)$/.exec(route.param || "");
  const drillKind = drillMatch?.[1] === "invullen" ? "fill" : "verbs";
  const drill = drillMatch?.[2] || null;
  // From a lesson: "les-<id>" (all its lists) or "les.<list key>-<id>" (one list, e.g. les.words.0-<id>).
  const drillFrom = /^les(?:\.((?:words|sentences)\.\d+|verbs))?-(.+)$/.exec(drill || "");
  const drillLesson = drillFrom?.[2] || null;
  const drillList = parseListKey(drillFrom?.[1]);
  // Flashcards of a lesson's list straight away: oefen-<part>-<id> (all lists of that part) or oefen-words.1-<id> (one list).
  const direct = /^oefen-((?:words|sentences)(?:\.\d+)?|verbs)-(.+)$/.exec(route.param || "");
  const directSource = direct ? { lesson: direct[2], ...parseListKey(direct[1]) } : null;

  // Decks can point at lessons that are not on the leerpad (added from the lesprogramma).
  useEffect(() => {
    if (!decks || !lessons) return;
    const known = new Set(lessons.map((l) => l.id));
    const wanted = [...decks.map((d) => d.source.lesson), drillLesson, directSource?.lesson, pronounLesson];
    const missing = [...new Set(wanted.filter((id) => id && !known.has(id)))];
    if (!missing.length) return;
    supabase
      .from("lessons")
      .select(LESSON)
      .in("id", missing)
      .then(({ data }) => setExtra(new Map((data || []).map((l) => [l.id, l]))));
  }, [decks, lessons, drillLesson, directSource?.lesson, pronounLesson]);

  const lessonMap = useMemo(
    () => new Map([...(lessons || []).map((l) => [l.id, l]), ...extra]),
    [lessons, extra]
  );
  const cardsOf = (deck) => itemsOf(deck.source, lessonMap).map(cardOf);

  // "Klaar met …" at the end of a round of one list: ticks that kind; with one kind it is "Lijst afronden".
  const finishProps = (deck, kind) => {
    if (!deck || deck.done_at || (deck.done_kinds || []).includes(kind)) return {};
    const kinds = deckKinds(deck, cardsOf).map((k) => k.kind);
    return {
      finishLabel: kinds.length > 1 ? t("fc.finishKind", { kind: t(`fc.kind.${kind}`) }) : t("fc.finish"),
      onFinish: async () => {
        await setDeckKindDone(deck, kind, true, kinds);
        navigate(pathFor("flashcards"));
      },
    };
  };

  if (pronounMatch && decks && lessons) {
    const lesson = pronounLesson ? lessonMap.get(pronounLesson) : null;
    if (pronounLesson && !lesson) return <p className="dim">{t("common.loading")}</p>;
    // Reflexive verbs: only the reflexive pronouns (zich, me, je …).
    const pronounKind = lessonPronounKind(lesson);
    // A lesson's own sentences when they have those pronouns, otherwise the whole library.
    const own = lesson ? withPronounsOf(sentencesForLists(lesson.sentence_list), pronounKind) : [];
    const list = own.length ? own : withPronounsOf(sentences, pronounKind);
    if (!list.length) return <p className="dim">{t("pd.none")}</p>;
    return (
      <Drill
        key={route.param}
        kind="pronouns"
        pronounSentences={list}
        pronounKind={pronounKind}
        level={lesson?.level}
        settingsKey={route.param}
        title={lesson?.title || t("pd.title")}
        onExit={() => (window.history.length > 1 ? window.history.back() : navigate(pathFor("flashcards")))}
      />
    );
  }

  if (drill && decks && lessons) {
    const fill = drillKind === "fill";
    const sources = drillList
      ? [{ lesson: drillLesson, ...drillList }]
      : drillLesson
      ? fill
        ? [{ lesson: drillLesson, part: "words" }, { lesson: drillLesson, part: "verbs" }]
        : [{ lesson: drillLesson, part: "verbs" }] // Vervoegen: only the lesson's linked verbs
      : (drill === "alles" ? decks.filter((d) => !d.done_at) : decks.filter((d) => d.id === drill)).map((d) => d.source);
    // Vervoegen only from verb lists (a lesson's linked verbs); In zinnen uses the whole library.
    const verbSources = fill ? sources : sources.filter((src) => src.part === "verbs");
    const items = verbSources.flatMap((src) => itemsOf(src, lessonMap));
    const verbs = fill ? [] : verbsOf(items);
    const words = fill ? fillWordsOf(items) : [];
    const title = drillLesson ? lessonMap.get(drillLesson)?.title : drill === "alles" ? t("fc.all") : decks.find((d) => d.id === drill)?.title;
    // Start at the level of the lesson or set (one list only); "alles" starts at all levels.
    const levelOf = (src) => (src.lesson ? lessonMap.get(src.lesson)?.level : src.set ? getSet(src.set)?.level : null);
    const level = drill === "alles" ? null : levelOf(sources[0] || {});
    if (verbs.length || words.length) {
      return (
        <Drill
          key={route.param}
          kind={drillKind}
          verbs={verbs}
          words={words}
          {...finishProps(decks.find((d) => d.id === drill) || null, fill ? "invullen" : "vervoegen")}
          level={level}
          tense={tenseForLesson(lessonMap.get(sources[0]?.lesson))}
          settingsKey={route.param}
          title={title || ""}
          onExit={() => (window.history.length > 1 ? window.history.back() : navigate(pathFor("flashcards")))}
        />
      );
    }
    if (!drillLesson || lessonMap.has(drillLesson)) return <p className="dim">{fill ? t("fd.none") : t("vd.none")}</p>;
    return <p className="dim">{t("common.loading")}</p>;
  }

  if (directSource && decks && lessons) {
    const lesson = lessonMap.get(directSource.lesson);
    if (!lesson) return <p className="dim">{t("common.loading")}</p>;
    const cards = itemsOf(directSource, lessonMap).map(cardOf);
    if (!cards.length) return <p className="dim">{t("fc.noCards")}</p>;
    return (
      <Practice
        key={route.param}
        settingsKey={route.param}
        cards={cards}
        title={directTitle(lesson, directSource, t)}
        onExit={() => (window.history.length > 1 ? window.history.back() : navigate(pathFor("flashcards")))}
      />
    );
  }

  // Practising one deck, or all of them.
  if (route.param && decks && lessons) {
    const chosen = route.param === "alles" ? decks.filter((d) => !d.done_at) : decks.filter((d) => d.id === route.param);
    const unique = new Map(chosen.flatMap(cardsOf).map((c) => [c.id, c]));
    const title = route.param === "alles" ? t("fc.all") : chosen[0]?.title;
    if (unique.size) {
      return (
        <Practice
          key={route.param}
          settingsKey={route.param}
          cards={[...unique.values()]}
          title={title}
          onExit={() => navigate(pathFor("flashcards"))}
          {...finishProps(chosen.length === 1 ? chosen[0] : null, "flashcards")}
        />
      );
    }
  }

  const active = (decks || []).filter((d) => !d.done_at);
  const done = (decks || []).filter((d) => d.done_at);

  const shownLessons = (lessons || [])
    .filter((l) => partsOf(l).length)
    .filter((l) => !filter || l.title.toLowerCase().includes(filter.toLowerCase()));
  const sets = [...setsOfType("word"), ...setsOfType("sentence")].filter((s) => setItems(s).length);

  return (
    <div className="fc-page">
      <div className="fc-page-head">
        <h2>{t("nav.flashcards")}</h2>
        {sentences.some((s) => s.pronouns?.length) && (
          <button type="button" className="fc-add" title={t("pd.hint")} onClick={() => navigate(pathFor("flashcards", "voornaamwoorden"))}>
            <Textbox aria-hidden="true" /> {t("pd.button")}
          </button>
        )}
      </div>
      {error && <div className="lp-error">{error}</div>}

      {decks === null ? (
        <p className="dim">{t("common.loading")}</p>
      ) : decks.length === 0 ? (
        <div className="fc-empty">
          <Cards size={36} aria-hidden="true" />
          <p>{t("fc.empty")}</p>
          <button type="button" className="fb-btn-primary" onClick={() => setBrowse(true)}>
            {t("fc.browse")}
          </button>
        </div>
      ) : (
        <>
          {active.length > 1 && (
            <div className="fc-all-row">
              <button type="button" className="fb-btn-primary fc-all" onClick={() => navigate(pathFor("flashcards", "alles"))}>
                <Cards aria-hidden="true" /> {t("fc.practiseAll")}
              </button>
              {verbsOf(active.filter((d) => d.source?.part === "verbs").flatMap((d) => itemsOf(d.source, lessonMap))).length > 0 && (
                <button type="button" className="fb-btn-secondary fc-all" onClick={() => navigate(pathFor("flashcards", "vervoegen-alles"))}>
                  <PencilSimpleLine aria-hidden="true" /> {t("vd.allButton")}
                </button>
              )}
              {fillWordsOf(active.flatMap((d) => itemsOf(d.source, lessonMap))).length > 0 && (
                <button type="button" className="fb-btn-secondary fc-all" onClick={() => navigate(pathFor("flashcards", "invullen-alles"))}>
                  <Textbox aria-hidden="true" /> {t("fd.allButton")}
                </button>
              )}
            </div>
          )}
          <DeckList decks={active} cardsOf={cardsOf} t={t} />
          {done.length > 0 && (
            <details className="fc-done-list">
              <summary>{t("fc.doneList", { n: done.length })}</summary>
              <DeckList decks={done} cardsOf={cardsOf} t={t} />
            </details>
          )}
          <button type="button" className="fb-link fc-browse-toggle" onClick={() => setBrowse((b) => !b)}>
            {browse ? t("fc.browseHide") : t("fc.browse")}
          </button>
        </>
      )}

      {browse && (
        <section className="fc-browse">
          <h3>{isStudent ? t("fc.fromLeerpad") : t("fc.fromProgram")}</h3>
          {!isStudent && (
            <input
              type="search"
              className="fc-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t("lp.searchLesson")}
              aria-label={t("lp.searchLesson")}
            />
          )}
          {lessons === null ? (
            <p className="dim">{t("common.loading")}</p>
          ) : shownLessons.length === 0 ? (
            <p className="dim">{isStudent ? t("fc.noLessons") : t("fc.noMatch")}</p>
          ) : (
            <ul className="fc-lessons">
              {shownLessons.map((l) => (
                <li key={l.id}>
                  <div className="fc-lesson-head">
                    <strong>{l.title}</strong> {l.level && <LevelBadge level={l.level} />}
                  </div>
                  <div className="fc-parts">
                    {partsOf(l).map(({ part, count }) => (
                      <span key={part} className="fc-part">
                        <span>
                          {t(`fc.part.${part}`)} <span className="dim">({count})</span>
                        </span>
                        <FlashcardButton source={{ lesson: l.id, part }} title={deckTitle(l, part, t)} />
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {sets.length > 0 && (
            <>
              <h3>{t("fc.sets")}</h3>
              <ul className="fc-lessons">
                {sets.map((s) => (
                  <li key={s.id} className="fc-part">
                    <span>
                      <strong>{s.title}</strong>{" "}
                      <span className="dim">
                        ({t(`sets.count.${s.type}`, { n: setItems(s).length })})
                      </span>
                    </span>
                    <FlashcardButton source={{ set: s.id }} title={s.title} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  );
}

/**
 * The kinds of practice a list offers (only those it has material for), each
 * with its count and path: flashcards for every list, Vervoegen when it has
 * verbs with a conjugation, Invullen when its words are marked in sentences.
 */
function deckKinds(deck, cardsOf) {
  const cards = cardsOf(deck);
  const items = cards.map((c) => c.item);
  return [
    { kind: "flashcards", n: cards.length, path: deck.id },
    // Vervoegen only for a lesson's verb list; word and sentence lists get flashcards (and Invullen).
    { kind: "vervoegen", n: deck.source?.part === "verbs" ? verbsOf(items).length : 0, path: `vervoegen-${deck.id}` },
    { kind: "invullen", n: fillWordsOf(items).length, path: `invullen-${deck.id}` },
  ].filter((k) => k.n > 0);
}

const KIND_ICONS = { flashcards: Cards, vervoegen: PencilSimpleLine, invullen: Textbox };

/**
 * My lists: each a card with its title, ✓ (the whole list done / again) and
 * remove, and below one button per kind of practice that starts it; a kind
 * the student finished shows a tick.
 */
function DeckList({ decks, cardsOf, t }) {
  return (
    <ul className="fc-decks">
      {decks.map((d) => {
        const kinds = deckKinds(d, cardsOf);
        const done = new Set(d.done_kinds || []);
        return (
          <li key={d.id} className={`fc-deck-card ${d.done_at ? "is-done" : ""}`}>
            <div className="fc-deck-head">
              <span className="fc-deck-title">
                {d.title}
                {d.added_by && d.added_by !== d.profile_id && <span className="fc-from-docent">{t("fc.fromDocent")}</span>}
              </span>
              <button
                type="button"
                className="board-icon-btn fc-done-btn"
                aria-label={d.done_at ? t("fc.undoDoneAria", { name: d.title }) : t("fc.markDoneAria", { name: d.title })}
                title={d.done_at ? t("fc.undoDone") : t("fc.markDone")}
                onClick={() => setDeckDone(d, !d.done_at)}
              >
                {d.done_at ? <ArrowCounterClockwise /> : <CheckCircle />}
              </button>
              <button
                type="button"
                className="board-icon-btn"
                aria-label={t("fc.removeDeck", { name: d.title })}
                title={t("fc.removeHint")}
                onClick={() => removeDeck(d)}
              >
                <X />
              </button>
            </div>
            {kinds.length === 0 ? (
              <span className="dim">{t("fc.noCards")}</span>
            ) : (
              <div className="fc-kinds">
                {kinds.map((k) => {
                  const Icon = KIND_ICONS[k.kind];
                  return (
                    <button
                      key={k.kind}
                      type="button"
                      className={`fc-kind ${done.has(k.kind) ? "is-done" : ""}`}
                      onClick={() => navigate(pathFor("flashcards", k.path))}
                      title={t(`fc.kindHint.${k.kind}`)}
                    >
                      <Icon aria-hidden="true" />
                      <span className="fc-kind-label">{t(`fc.kind.${k.kind}`)}</span>
                      <span className="fc-kind-n">{k.n}</span>
                      {done.has(k.kind) && <span className="fc-kind-tick" aria-label={t("fc.kindDone")}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** The verbs (with a present-tense table) among some items, each once. */
function verbsOf(items) {
  return drillable([...new Map(items.filter((i) => i?.partOfSpeech === "verb").map((i) => [i.id, i])).values()]);
}


/** "Werkwoorden vervoegen · Woorden", or with one list: "Werkwoorden vervoegen · Dieren A1". */
function directTitle(lesson, source, t) {
  if (source.index == null) return deckTitle(lesson, source.part, t);
  const list = lessonLists(lesson, t).find((l) => l.part === source.part && l.index === source.index);
  return list ? `${lesson.title} · ${list.label}` : deckTitle(lesson, source.part, t);
}
