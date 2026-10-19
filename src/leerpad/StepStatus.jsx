import { useI18n } from "../i18n/context";
import { ChalkboardTeacher, CheckCircle, HourglassMedium, House, Star } from "../icons";

/** Statuses of a step on a leerpad, in click order (after the last: none). */
const STEP_STATUSES = ["in_class", "homework", "homework_done", "ongoing"];
const ICON = { in_class: ChalkboardTeacher, homework: House, homework_done: CheckCircle, ongoing: HourglassMedium };

const nextStatus = (status) => {
  const i = STEP_STATUSES.indexOf(status);
  return i === STEP_STATUSES.length - 1 ? null : STEP_STATUSES[i + 1];
};

/**
 * The status icon on a card. Clicking moves to the next status (without
 * opening the card); hover shows which status it is. Without onChange it is
 * only shown, and only when set.
 */
export default function StepStatus({ status, onChange }) {
  const { t } = useI18n();
  if (!status && !onChange) return null;
  const Icon = ICON[status] || ChalkboardTeacher;
  const name = status ? t(`status.${status}`) : t("status.none");
  const next = nextStatus(status);
  const title = onChange ? t("status.title", { name, next: next ? t(`status.${next}`) : t("status.none") }) : name;
  const stop = (e) => e.stopPropagation();
  return onChange ? (
    <button
      type="button"
      className={`step-status ${status ? `is-${status}` : "is-none"}`}
      title={title}
      aria-label={title}
      onPointerDown={stop}
      onKeyDown={stop}
      onClick={(e) => {
        e.stopPropagation();
        onChange(next);
      }}
    >
      <Icon weight={status ? "fill" : "regular"} />
    </button>
  ) : (
    <span className={`step-status is-${status}`} title={title} aria-label={title} role="img">
      <Icon weight="fill" />
    </span>
  );
}

/** Legend above a leerpad: what each status icon means, and how to change it. */
export function StatusLegend({ canChange }) {
  const { t } = useI18n();
  return (
    <div className="status-legend" aria-label={t("status.legend")}>
      {STEP_STATUSES.map((s) => {
        const Icon = ICON[s];
        return (
          <span key={s} className="status-legend-item">
            <span className={`step-status is-${s}`} aria-hidden="true">
              <Icon weight="fill" />
            </span>
            {t(`status.${s}`)}
          </span>
        );
      })}
      {canChange && <span className="dim status-legend-hint">{t("status.legendHint")}</span>}
    </div>
  );
}

/**
 * ⭐ Belangrijk on a card: the student marks what they find important. A click
 * toggles it (without opening the card); without onChange only shown when set.
 */
export function StepImportant({ important, onChange }) {
  const { t } = useI18n();
  if (!important && !onChange) return null;
  const title = important ? t("important.on") : t("important.off");
  const stop = (e) => e.stopPropagation();
  return onChange ? (
    <button
      type="button"
      className={`step-important ${important ? "is-on" : ""}`}
      title={title}
      aria-label={title}
      aria-pressed={important}
      onPointerDown={stop}
      onKeyDown={stop}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!important);
      }}
    >
      <Star weight={important ? "fill" : "regular"} />
    </button>
  ) : (
    <span className="step-important is-on" title={title} aria-label={title} role="img">
      <Star weight="fill" />
    </span>
  );
}
