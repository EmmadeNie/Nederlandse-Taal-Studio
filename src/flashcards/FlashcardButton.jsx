import { useState } from "react";
import { useI18n } from "../i18n/context";
import { Cards, Check } from "../icons";
import { addDeck, findDeck, removeDeck, useDecks } from "./store";
import "./flashcards.css";

/** "+ Flashcards" on a list: puts it in (or takes it out of) "Mijn flashcards". */
export default function FlashcardButton({ source, title }) {
  const { t } = useI18n();
  useDecks(); // re-render when decks change
  const [busy, setBusy] = useState(false);
  const deck = findDeck(source);
  const toggle = async (e) => {
    e.stopPropagation();
    setBusy(true);
    try {
      if (deck) await removeDeck(deck.id);
      else await addDeck(source, title);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      className={`fc-add ${deck ? "is-added" : ""}`}
      onClick={toggle}
      disabled={busy}
      title={deck ? t("fc.removeHint") : t("fc.addHint")}
    >
      {deck ? <Check weight="bold" aria-hidden="true" /> : <Cards aria-hidden="true" />}{" "}
      {deck ? t("fc.added") : t("fc.add")}
    </button>
  );
}
