import { useI18n } from "../i18n/context";
import { ChalkboardTeacher, CheckCircle, HourglassMedium, House } from "../icons";

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
