import { useI18n } from "../i18n/context";
import { setsOfType } from "../data";
import { useContentVersion } from "../data/useContent";

/**
 * Choose a set of one type ("word" or "sentence") from Bibliotheek → Sets,
 * with the number of items. A set that no longer exists stays visible as such.
 */
export default function SetSelect({ type, value, onChange, label }) {
  const { t } = useI18n();
  useContentVersion();
  const sets = setsOfType(type);
  const missing = value && !sets.some((s) => s.id === value);
  return (
    <select className="set-select" value={value || ""} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">{t("set.none")}</option>
      {sets.map((s) => (
        <option key={s.id} value={s.id}>
          {s.title} ({t(`sets.count.${type}`, { n: s.itemIds.length })})
        </option>
      ))}
      {missing && <option value={value}>{t("set.missing", { id: value })}</option>}
    </select>
  );
}
