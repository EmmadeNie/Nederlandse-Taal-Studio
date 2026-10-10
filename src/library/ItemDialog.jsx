import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/context";
import { getItem, setsWithItem, typeOfId } from "../data";
import { validateItem } from "../data/validate";
import { createItem, deleteItem, lessonsUsing, updateItem } from "../data/contentApi";
import { Dialog } from "../leerpad/shared";
import SaveStatus from "../leerpad/SaveStatus";
import { useAutosave } from "../leerpad/useAutosave";
import { navigate } from "../hooks/useRoute";
import { pathFor } from "../routes";
import FieldInput from "./FieldInput";
import { FIELDS, getPath, itemLabel, setPath, suggestId } from "./fields";

const ctx = { has: (id) => Boolean(getItem(id)) };

/**
 * Edit a word, sentence, grammar topic or exercise (docent). An existing item
 * saves as you go, like the lesson window; a new one is created with
 * "Aanmaken" once it is valid and then saves as you go too.
 */
export default function ItemDialog({ item: initial, type: newType, onClose }) {
  const { t } = useI18n();
  const type = initial.id ? typeOfId(initial.id) : newType;
  const [isNew, setIsNew] = useState(!initial.id);
  const [draft, setDraft] = useState(initial);
  const draftRef = useRef(initial);
  const savedRef = useRef(JSON.stringify(initial));
  const [idTouched, setIdTouched] = useState(false);
  const [problems, setProblems] = useState([]);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState(null);
  const autosave = useAutosave();

  const message = (p) => t(p.key, p.vars);
  const fieldErrors = (path) => problems.filter((p) => p.field === path).map(message);

  const update = (next) => {
    draftRef.current = next;
    setDraft(next);
  };

  const change = (path, value) => {
    let next = setPath(draftRef.current, path, value);
    // A new item gets its id from its Dutch text or title, until you type one.
    if (isNew && !idTouched && (path === "nl" || path === "title")) next = { ...next, id: suggestId(type, next) };
    update(next);
  };

  /** Save the draft (existing items). Resolves false when it can't be saved. */
  const save = () => {
    if (isNew) return Promise.resolve(true);
    const current = draftRef.current;
    const json = JSON.stringify(current);
    if (json === savedRef.current) return autosave.settled();
    const found = validateItem(type, current, ctx);
    setProblems(found);
    if (found.length) return Promise.resolve(false);
    savedRef.current = json;
    return autosave.save(() => updateItem(current));
  };

  const create = async () => {
    const current = draftRef.current;
    const found = validateItem(type, current, ctx, { isNew: true });
    setProblems(found);
    if (found.length) return;
    setError(null);
    try {
      await createItem(current);
      savedRef.current = JSON.stringify(current);
      setIsNew(false);
    } catch (e) {
      setError(t(e.message));
    }
  };

  const close = async () => {
    if (isNew) {
      const touched = JSON.stringify(draftRef.current) !== savedRef.current;
      if (touched && !window.confirm(t("ie.discardNew"))) return;
      onClose();
      return;
    }
    if (!(await save()) && !window.confirm(t("ie.discardInvalid"))) return;
    onClose();
  };

  // Where an item is used, shown before deleting it.
  const inSets = isNew ? [] : setsWithItem(draft.id);
  useEffect(() => {
    if (isNew || (type !== "topic" && type !== "word")) return;
    lessonsUsing(type === "topic" ? { topicId: initial.id } : { verbId: initial.id })
      .then(setUsage)
      .catch(() => setUsage([]));
  }, [isNew, type, initial.id]);

  const remove = async () => {
    const where = [
      ...inSets.map((s) => t("ie.inSet", { name: s.title })),
      ...(usage || []).map((l) => t("ie.inLesson", { name: l.title })),
    ];
    const question = where.length
      ? t("ie.confirmDeleteUsed", { name: itemLabel(draft), where: where.join("\n") })
      : t("ie.confirmDelete", { name: itemLabel(draft) });
    if (!window.confirm(question)) return;
    try {
      await deleteItem(draft.id);
      onClose();
    } catch (e) {
      setError(t(e.message));
    }
  };

  const fields = FIELDS[type].filter((f) => !f.when || f.when(draft));
  const title = isNew ? t(`ie.new.${type}`) : itemLabel(draft) || draft.id;

  return (
    <Dialog title={title} onClose={close} wide>
      <div className="ie-form">
        {isNew && (
          <label className="fb-field ie-field">
            <span>{t("ie.id")}</span>
            <input
              value={draft.id}
              spellCheck={false}
              onChange={(e) => {
                setIdTouched(true);
                update({ ...draftRef.current, id: e.target.value.trim() });
              }}
            />
            <span className="dim ie-hint">{t("ie.idHint", { prefix: `${type}.` })}</span>
            {fieldErrors("id").map((msg, i) => (
              <span key={i} className="ie-error">
                {msg}
              </span>
            ))}
          </label>
        )}

        {fields.map((field) => (
          <div key={field.path} className="ie-row">
            {field.group && <h4 className="ie-group">{t(field.group)}</h4>}
            <FieldInput
              field={field}
              value={getPath(draft, field.path)}
              errors={fieldErrors(field.path)}
              onChange={(value) => change(field.path, value)}
              onCommit={() => save()}
            />
          </div>
        ))}

        {!isNew && inSets.length > 0 && (
          <div className="lp-section">
            <h4>{t("ie.inSets")}</h4>
            <ul className="ie-setlist">
              {inSets.map((s) => (
                <li key={s.id}>
                  <a
                    href={pathFor("sets", s.id)}
                    onClick={(e) => {
                      e.preventDefault();
                      close().then(() => navigate(pathFor("sets", s.id)));
                    }}
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {problems.length > 0 && <div className="auth-error">{t("ie.notSaved")}</div>}
      {error && <div className="auth-error">{error}</div>}
      {!isNew && <SaveStatus status={autosave.status} error={autosave.error} />}

      <div className="lp-actions">
        {isNew ? (
          <>
            <button className="fb-btn-primary" onClick={create}>
              {t("ie.create")}
            </button>
            <button className="fb-btn-secondary" onClick={close}>
              {t("common.cancel")}
            </button>
          </>
        ) : (
          <button className="lp-danger" onClick={remove}>
            {t("ie.delete")}
          </button>
        )}
      </div>
    </Dialog>
  );
}
