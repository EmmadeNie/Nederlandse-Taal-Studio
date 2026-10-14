import { useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../i18n/context";
import { ICONS } from "../icons";

/**
 * The compass on a menu item (students, pages the tour covers): shows on
 * hover, explains in a tour-style tooltip, and starts the tour at that page.
 * The tooltip goes to <body>, fixed beside the button: inside the sidebar it
 * would be clipped (scrolling) and sit under the board (stacking).
 */
export default function NavTour({ page, label, onStart }) {
  const { t } = useI18n();
  const [at, setAt] = useState(null);
  const show = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setAt({ top: r.top + r.height / 2, left: r.right + 14 });
  };
  const Icon = ICONS.tour;
  return (
    <>
      <button
        type="button"
        className="nav-tour"
        aria-label={t("tour.navAria", { page: label })}
        onMouseEnter={show}
        onFocus={show}
        onMouseLeave={() => setAt(null)}
        onBlur={() => setAt(null)}
        onClick={(e) => {
          e.stopPropagation();
          setAt(null);
          onStart(page);
        }}
      >
        <Icon weight="bold" aria-hidden="true" />
      </button>
      {at &&
        createPortal(
          <span className="tour-tip is-shown nav-tour-tip" role="tooltip" style={{ top: at.top, left: at.left }}>
            <strong>
              <Icon weight="bold" aria-hidden="true" /> {t("tour.navTitle", { page: label })}
            </strong>
            {t(`tour.navText.${page}`)}
          </span>,
          document.body
        )}
    </>
  );
}
