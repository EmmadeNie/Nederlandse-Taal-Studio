/** Comparing and labelling item fields in a proposal. */
import { useI18n } from "../i18n/context";
import { FIELDS } from "../library/fields";

/** Deep equality for JSON values (key order does not matter). */
export function same(a, b) {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => same(a[k], b[k]));
}

/** An item's top-level fields in the editor's order, then anything else. */
export function fieldOrder(type, ...items) {
  const known = [...new Set((FIELDS[type] || []).map((f) => f.path.split(".")[0]))];
  const present = new Set(items.flatMap((x) => Object.keys(x || {})));
  present.delete("id");
  return [...known.filter((k) => present.has(k)), ...[...present].filter((k) => !known.includes(k))];
}

export const fieldOf = (type, key) => (FIELDS[type] || []).find((f) => f.path === key);

/** Label of a top-level field. */
export function useFieldLabel(type) {
  const { t } = useI18n();
  return (key) => {
    const f = fieldOf(type, key);
    if (f) return t(f.label);
    const text = t(`f.${key}`);
    return text === `f.${key}` ? key : text;
  };
}
