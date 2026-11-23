import { useId, useState } from "react";
import { CaretDown } from "../icons";

/**
 * One row of a lesson or topic card: an icon, a title and a short line about
 * what is inside; click to open. Folded by default. `tools` (e.g. the
 * Mijn flashcards toggle) sit to the right, outside the toggle button.
 */
export default function Fold({ icon: Icon, title, sub, tools, defaultOpen = false, className = "", children }) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  return (
    <section className={`fold ${open ? "is-open" : ""} ${className}`}>
      <div className="fold-head">
        <button type="button" className="fold-toggle" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen(!open)}>
          {Icon && (
            <span className="fold-icon" aria-hidden="true">
              <Icon />
            </span>
          )}
          <span className="fold-text">
            <strong>{title}</strong>
            {sub && <span className="fold-sub">{sub}</span>}
          </span>
          <CaretDown className="fold-caret" aria-hidden="true" />
        </button>
        {tools && <div className="fold-tools">{tools}</div>}
      </div>
      {open && (
        <div className="fold-body" id={bodyId}>
          {children}
        </div>
      )}
    </section>
  );
}
