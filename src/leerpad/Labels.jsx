import { useState } from "react";
import { useI18n } from "../i18n/context";
import { LABEL_COLORS, createLabel, deleteLabel, labelName, updateLabel, useLabels } from "./labelStore";
import { Plus, X } from "../icons";

/** One label: a small tinted pill with a colour dot. */
export function LabelChip({ label }) {
  const { lang } = useI18n();
  return <span className={`label-chip label-${label.color}`}>{labelName(label, lang)}</span>;
}

/** The labels of a card, in the order they were added. Unknown ids are skipped. */
export function LabelChips({ ids = [] }) {
  const labels = useLabels();
  return ids
    .map((id) => labels.find((l) => l.id === id))
    .filter(Boolean)
    .map((l) => <LabelChip key={l.id} label={l} />);
}

/** Docent: switch labels on and off for a lesson, add new ones, manage them. */
export function LabelPicker({ value = [], onChange }) {
  const { t, lang } = useI18n();
  const labels = useLabels();
  const [name, setName] = useState("");
  const [managing, setManaging] = useState(false);
  const [error, setError] = useState(null);

  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  const add = async () => {
    const n = name.trim();
    if (!n) return;
    setError(null);
    try {
      const row = await createLabel(n);
      onChange([...value, row.id]);
      setName("");
    } catch (e) {
      setError(t(e.message));
    }
  };

  return (
    <div className="label-picker">
      <div className="label-picker-list" role="group" aria-label={t("lp.labels")}>
        {labels.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`label-chip label-${l.color} label-toggle`}
            aria-pressed={value.includes(l.id)}
            onClick={() => toggle(l.id)}
          >
            {labelName(l, lang)}
          </button>
        ))}
        {labels.length === 0 && <span className="dim">{t("labels.none")}</span>}
      </div>
      <div className="lp-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("labels.newPh")}
          aria-label={t("labels.new")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="fb-btn-secondary" onClick={add} disabled={!name.trim()}>
          <Plus aria-hidden="true" /> {t("labels.add")}
        </button>
        <button type="button" className="fb-link" onClick={() => setManaging((m) => !m)} aria-expanded={managing}>
          {managing ? t("labels.doneManaging") : t("labels.manage")}
        </button>
      </div>
      {error && <div className="auth-error">{error}</div>}
      {managing && <LabelManager />}
    </div>
  );
}

/** Rename (NL + EN), recolour and delete labels. Changes apply to every lesson. */
function LabelManager() {
  const { t } = useI18n();
  const labels = useLabels();
  const [error, setError] = useState(null);

  const save = async (label, patch) => {
    setError(null);
    try {
      await updateLabel(label.id, patch);
    } catch (e) {
      setError(t(e.message));
    }
  };

  const remove = async (label) => {
    if (!window.confirm(t("labels.confirmDelete", { name: label.name_nl }))) return;
    setError(null);
    try {
      await deleteLabel(label.id);
    } catch (e) {
      setError(t(e.message));
    }
  };

  return (
    <div className="label-manager">
      <p className="dim label-manager-hint">{t("labels.manageHint")}</p>
      {labels.map((l) => (
        <div key={l.id} className="label-manager-row">
          <span className={`label-dot label-${l.color}`} aria-hidden="true" />
          <input
            defaultValue={l.name_nl}
            aria-label={t("labels.nameNl")}
            placeholder="NL"
            onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== l.name_nl && save(l, { name_nl: e.target.value.trim() })}
          />
          <input
            defaultValue={l.name_en}
            aria-label={t("labels.nameEn")}
            placeholder="EN"
            onBlur={(e) => e.target.value.trim() !== l.name_en && save(l, { name_en: e.target.value.trim() })}
          />
          <select value={l.color} onChange={(e) => save(l, { color: e.target.value })} aria-label={t("labels.color")}>
            {LABEL_COLORS.map((c) => (
              <option key={c} value={c}>
                {t(`color.${c}`)}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="board-icon-btn"
            aria-label={t("labels.delete", { name: l.name_nl })}
            title={t("fb.delete")}
            onClick={() => remove(l)}
          >
            <X />
          </button>
        </div>
      ))}
      {error && <div className="auth-error">{error}</div>}
    </div>
  );
}

/** Filter select: all labels, or one. */
export function LabelFilter({ value, onChange }) {
  const { t, lang } = useI18n();
  const labels = useLabels();
  if (!labels.length) return null;
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={t("lp.labelsShort")}>
      <option value="">{t("labels.all")}</option>
      {labels.map((l) => (
        <option key={l.id} value={l.id}>
          {labelName(l, lang)}
        </option>
      ))}
    </select>
  );
}
