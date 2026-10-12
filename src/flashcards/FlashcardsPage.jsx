import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/context";
import { useI18n } from "../i18n/context";
import { navigate, useRoute } from "../hooks/useRoute";
import { pathFor } from "../routes";
import { setItems, setsOfType } from "../data";
import { useContentVersion } from "../data/useContent";
import { supabase } from "../lib/supabase";
import { LevelBadge } from "../components/Badges";
import { ArrowCounterClockwise, Cards, CheckCircle, PencilSimpleLine, Textbox, X } from "../icons";
import FlashcardButton from "./FlashcardButton";
import Practice from "./Practice";
import Drill from "./Drill";
import { drillable, fillWordsOf } from "./conjugate";
import { cardOf, deckTitle, itemsOf, partsOf } from "./cards";
import { loadDecks, removeDeck, setDeckDone, useDecks } from "./store";
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
  // Vervoegen / Invullen: /flashcards/vervoegen-<deck id>, -alles, or -les-<lesson id> (from a lesson).
  const drillMatch = /^(vervoegen|invullen)-(.+)$/.exec(route.param || "");
  const drillKind = drillMatch?.[1] === "invullen" ? "fill" : "verbs";
  const drill = drillMatch?.[2] || null;
  const drillLesson = drill?.startsWith("les-") ? drill.slice(4) : null;
  // Practise a lesson's list straight away: /flashcards/oefen-<part>-<lesson id>.
  const direct = /^oefen-(words|verbs|sentences)-(.+)$/.exec(route.param || "");
  const directSource = direct ? { lesson: direct[2], part: direct[1] } : null;

  // Decks can point at lessons that are not on the leerpad (added from the lesprogramma).
  useEffect(() => {
    if (!decks || !lessons) return;
    const known = new Set(lessons.map((l) => l.id));
    const wanted = [...decks.map((d) => d.source.lesson), drillLesson, directSource?.lesson];
    const missing = [...new Set(wanted.filter((id) => id && !known.has(id)))];
    if (!missing.length) return;
    supabase
      .from("lessons")
      .select(LESSON)
      .in("id", missing)
      .then(({ data }) => setExtra(new Map((data || []).map((l) => [l.id, l]))));
  }, [decks, lessons, drillLesson, directSource?.lesson]);

  const lessonMap = useMemo(
    () => new Map([...(lessons || []).map((l) => [l.id, l]), ...extra]),
    [lessons, extra]
  );
  const cardsOf = (deck) => itemsOf(deck.source, lessonMap).map(cardOf);

  if (drill && decks && lessons) {
    const fill = drillKind === "fill";
    const sources = drillLesson
      ? fill
        ? [{ lesson: drillLesson, part: "words" }, { lesson: drillLesson, part: "verbs" }]
        : [{ lesson: drillLesson, part: "verbs" }]
      : (drill === "alles" ? decks.filter((d) => !d.done_at) : decks.filter((d) => d.id === drill)).map((d) => d.source);
    const items = sources.flatMap((src) => itemsOf(src, lessonMap));
    const verbs = fill ? [] : verbsOf(items);
    const words = fill ? fillWordsOf(items) : [];
    const title = drillLesson ? lessonMap.get(drillLesson)?.title : drill === "alles" ? t("fc.all") : decks.find((d) => d.id === drill)?.title;
    if (verbs.length || words.length) {
      return (
        <Drill
          key={route.param}
          kind={drillKind}
          verbs={verbs}
          words={words}
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
        title={deckTitle(lesson, directSource.part, t)}
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
          onFinish={
            chosen.length === 1 && !chosen[0].done_at
              ? async () => {
                  await setDeckDone(chosen[0], true);
                  navigate(pathFor("flashcards"));
                }
              : undefined
          }
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
      <h2>{t("nav.flashcards")}</h2>
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
              {verbsOf(active.flatMap((d) => itemsOf(d.source, lessonMap))).length > 0 && (
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

/** My lists, each with practise, done/undo and remove. */
function DeckList({ decks, cardsOf, t }) {
  return (
    <ul className="fc-decks">
      {decks.map((d) => {
        const n = cardsOf(d).length;
        return (
          <li key={d.id} className={d.done_at ? "is-done" : undefined}>
            <button type="button" className="fc-deck" onClick={() => navigate(pathFor("flashcards", d.id))} disabled={!n}>
              <span className="fc-deck-title">
                {d.title}
                {d.added_by && d.added_by !== d.profile_id && <span className="fc-from-docent">{t("fc.fromDocent")}</span>}
              </span>
              <span className="dim">{n ? t("fc.cards", { n }) : t("fc.noCards")}</span>
            </button>
            <span className="fc-deck-tools">
              {verbsOf(cardsOf(d).map((c) => c.item)).length > 0 && (
                <button
                  type="button"
                  className="fc-add vd-open"
                  title={t("vd.hint")}
                  onClick={() => navigate(pathFor("flashcards", `vervoegen-${d.id}`))}
                >
                  <PencilSimpleLine aria-hidden="true" /> {t("vd.button")}
                </button>
              )}
              {fillWordsOf(cardsOf(d).map((c) => c.item)).length > 0 && (
                <button
                  type="button"
                  className="fc-add vd-open"
                  title={t("fd.hint")}
                  onClick={() => navigate(pathFor("flashcards", `invullen-${d.id}`))}
                >
                  <Textbox aria-hidden="true" /> {t("fd.button")}
                </button>
              )}
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
