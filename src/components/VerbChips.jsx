import { useState } from "react";
import { VerbTile } from "./RelatedWords";
import { splitVerb } from "./verbSplit";

/** The infinitive, with the separable part marked like in the house style. */
function VerbName({ verb }) {
  const split = splitVerb(verb);
  const inf = verb?.conjugation?.infinitive || verb?.nl;
  if (!split) return <span className="role-verb">{inf}</span>;
  return (
    <>
      <span className="role-part">{split.part}</span>
      <span className="role-verb">{split.base}</span>
    </>
  );
}

/**
 * Verbs as small chips (name + meaning); tap one to see its conjugation right
 * below, tap again to close it. Calmer than a wall of conjugation tables.
 */
export default function VerbChips({ verbs }) {
  const [openId, setOpenId] = useState(null);
  if (!verbs.length) return null;
  const open = verbs.find((v) => v.id === openId);
  return (
    <div className="verb-chips">
      <div className="verb-chips-row">
        {verbs.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`verb-chip ${v.id === openId ? "is-open" : ""}`}
            aria-expanded={v.id === openId}
            onClick={() => setOpenId(v.id === openId ? null : v.id)}
          >
            <span className="verb-chip-name" lang="nl">
              <VerbName verb={v} />
            </span>
            {v.en && <span className="verb-chip-en">{v.en}</span>}
          </button>
        ))}
      </div>
      {open?.conjugation && (
        <div className="verb-chip-conj">
          <VerbTile verb={open} />
        </div>
      )}
    </div>
  );
}
