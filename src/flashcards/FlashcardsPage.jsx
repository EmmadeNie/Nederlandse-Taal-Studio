import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/context";
import { useI18n } from "../i18n/context";
import { navigate, useRoute } from "../hooks/useRoute";
import { pathFor } from "../routes";
import { setItems, setsOfType } from "../data";
import { useContentVersion } from "../data/useContent";
import { supabase } from "../lib/supabase";
import { LevelBadge } from "../components/Badges";
import { ArrowCounterClockwise, Cards, CheckCircle, X } from "../icons";
import FlashcardButton from "./FlashcardButton";
import Practice from "./Practice";
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

  // Decks can point at lessons that are not on the leerpad (added from the lesprogramma).
  useEffect(() => {
    if (!decks || !lessons) return;
    const known = new Set(lessons.map((l) => l.id));
    const missing = [...new Set(decks.map((d) => d.source.lesson).filter((id) => id && !known.has(id)))];
    if (!missing.length) return;
    supabase
      .from("lessons")
      .select(LESSON)
      .in("id", missing)
      .then(({ data }) => setExtra(new Map((data || []).map((l) => [l.id, l]))));
  }, [decks, lessons]);

  const lessonMap = useMemo(
    () => new Map([...(lessons || []).map((l) => [l.id, l]), ...extra]),
    [lessons, extra]
  );
  const cardsOf = (deck) => itemsOf(deck.source, lessonMap).map(cardOf);

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
            <button type="button" className="fb-btn-primary fc-all" onClick={() => navigate(pathFor("flashcards", "alles"))}>
              <Cards aria-hidden="true" /> {t("fc.practiseAll")}
            </button>
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
