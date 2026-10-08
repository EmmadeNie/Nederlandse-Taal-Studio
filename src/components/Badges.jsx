import { useI18n } from "../i18n/context";

export function LevelBadge({ level }) {
  return <span className={`level-badge ${level}`}>{level}</span>;
}

export function ReviewBadge({ status }) {
  const { t } = useI18n();
  if (!status) return null;
  return <span className={`review-badge ${status}`}>{t(`review.${status}`)}</span>;
}

export function Tag({ children }) {
  return <span className="tag">{children}</span>;
}
