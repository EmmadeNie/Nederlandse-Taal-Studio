import { useState } from "react";
import { useAuth } from "../auth/context";
import { useI18n } from "../i18n/context";
import { Cards, Check } from "../icons";
import { addDeck, findDeck, removeDeck, useDecks } from "./store";
import "./flashcards.css";

/**
 * "Flashcards" on a list: puts it in (or takes it out of) "Mijn flashcards".
 * With `forProfileId` (the docent on a student's leerpad) it puts the list in
 * that student's flashcards instead: "Klaarzetten".
 */
export default function FlashcardButton({ source, title, forProfileId }) {
  const { t } = useI18n();
  const { profile } = useAuth();
  const owner = forProfileId || profile.id;
  const forStudent = owner !== profile.id;
  useDecks(owner); // load and re-render when decks change
  const [busy, setBusy] = useState(false);
  const deck = findDeck(owner, source);
  const toggle = async (e) => {
    e.stopPropagation();
    setBusy(true);
    try {
      if (deck) await removeDeck(deck);
      else await addDeck(owner, source, title);
    } finally {
      setBusy(false);
    }
  };
  const label = forStudent ? (deck ? t("fc.prepared") : t("fc.prepare")) : deck ? t("fc.added") : t("fc.add");
  const hint = forStudent
    ? deck
      ? t("fc.unprepareHint")
      : t("fc.prepareHint")
    : deck
      ? t("fc.removeHint")
      : t("fc.addHint");
  return (
    <button type="button" className={`fc-add ${deck ? "is-added" : ""}`} onClick={toggle} disabled={busy} title={hint}>
      {deck ? <Check weight="bold" aria-hidden="true" /> : <Cards aria-hidden="true" />} {label}
    </button>
  );
}
