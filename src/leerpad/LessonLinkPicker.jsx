import { useState } from "react";
import { useI18n } from "../i18n/context";
import { LevelBadge } from "../components/Badges";
import { LinkSimple } from "../icons";
import * as api from "./api";

/**
 * "Les linken": search a lesson of the lesprogramma and hand it to onPick,
 * which puts a link to it in the text. Loads the lessons itself when they
 * aren't passed in.
 */
export default function LessonLinkPicker({ lessons, excludeId, onPick }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(null);
  const all = lessons || loaded;

  const toggle = () => {
    if (!open && !lessons && !loaded) {
      api
        .loadProgram()
        .then((d) => setLoaded(d.lessons))
        .catch(() => setLoaded([]));
    }
    setOpen((o) => !o);
    setQuery("");
  };

  const q = query.trim().toLowerCase();
  const shown = (all || [])
    .filter((l) => l.id !== excludeId && (!q || l.title.toLowerCase().includes(q)))
    .sort((a, b) => a.title.localeCompare(b.title, "nl"))
    .slice(0, 40);

  return (
    <span className="ll">
      <button type="button" className="fb-link ll-toggle" onClick={toggle} aria-expanded={open}>
        <LinkSimple aria-hidden="true" /> {t("ll.button")}
      </button>
      {open && (
        <div
          className="ll-panel"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              setOpen(false);
            }
          }}
        >
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("ll.search")}
            aria-label={t("ll.search")}
          />
          {all === null ? (
            <p className="dim lp-empty">{t("common.loading")}</p>
          ) : shown.length === 0 ? (
            <p className="dim lp-empty">{t("picker.none")}</p>
          ) : (
            <ul className="ll-list">
              {shown.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(l);
                      setOpen(false);
                    }}
                  >
                    <span>{l.title}</span> {l.level && <LevelBadge level={l.level} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </span>
  );
}
