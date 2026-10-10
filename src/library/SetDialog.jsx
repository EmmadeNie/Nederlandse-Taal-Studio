import { useEffect, useRef, useState } from "react";
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useI18n } from "../i18n/context";
import { LEVELS, getItem, sets } from "../data";
import { deleteSet, lessonsUsing, updateSet } from "../data/contentApi";
import { validateSet } from "../data/validate";
import { LevelBadge } from "../components/Badges";
import { Dialog } from "../leerpad/shared";
import SaveStatus from "../leerpad/SaveStatus";
import { useAutosave } from "../leerpad/useAutosave";
import { navigate } from "../hooks/useRoute";
import { pathFor } from "../routes";
import { DotsSixVertical, X } from "../icons";
import { ItemPicker } from "./FieldInput";
import { itemLabel } from "./fields";

const ctx = { has: (id) => Boolean(getItem(id)), hasSet: (id) => sets.some((s) => s.id === id) };

/** One set: title, level and its items in order (docent: drag, add, remove). */
export default function SetDialog({ set, canEdit, onClose }) {
  const { t } = useI18n();
  const autosave = useAutosave();
  const [title, setTitle] = useState(set.title);
  const sentTitle = useRef(set.title);
  const [lessons, setLessons] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    lessonsUsing({ setId: set.id })
      .then(setLessons)
      .catch(() => setLessons([]));
  }, [set.id]);

  const save = (patch) => {
    const next = { ...set, ...patch };
    const found = validateSet(next, ctx);
    if (found.length) {
      setError(t(found[0].key, found[0].vars));
      return Promise.resolve(false);
    }
    setError(null);
    return autosave.save(() => updateSet(set.id, patch));
  };

  const saveTitle = () => {
    const v = title.trim();
    if (!v) {
      setTitle(sentTitle.current);
      return autosave.settled();
    }
    if (v === sentTitle.current) return autosave.settled();
    sentTitle.current = v;
    return save({ title: v });
  };

  const close = async () => {
    if (canEdit && !(await saveTitle())) return;
    onClose();
  };

  const items = set.itemIds.map((id) => getItem(id)).filter(Boolean);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const ids = set.itemIds;
    save({ itemIds: arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id)) });
  };

  // Lowest level first; within a level the current order stays (Array.sort is stable).
  const rank = (id) => {
    const i = LEVELS.indexOf(getItem(id)?.introducedAtLevel || getItem(id)?.level);
    return i === -1 ? LEVELS.length : i;
  };
  const byLevel = [...set.itemIds].sort((a, b) => rank(a) - rank(b));
  const sortedByLevel = byLevel.every((id, i) => id === set.itemIds[i]);

  const remove = async () => {
    const used = (lessons || []).map((l) => l.title);
    const question = used.length
      ? t("sets.confirmDeleteUsed", { name: set.title, lessons: used.join(", ") })
      : t("sets.confirmDelete", { name: set.title });
    if (!window.confirm(question)) return;
    try {
      await deleteSet(set.id);
      onClose();
    } catch (e) {
      setError(t(e.message));
    }
  };

  return (
    <Dialog title={canEdit ? t("sets.edit") : set.title} onClose={close} wide>
      <div className="lp-source">
        <strong>{t(`sets.type.${set.type}`)}</strong> · <code>{set.id}</code>
      </div>

      {canEdit && (
        <div className="lp-row">
          <label className="fb-field" style={{ flex: "3 1 220px" }}>
            <span>{t("sets.title")}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveTitle} />
          </label>
          <label className="fb-field" style={{ flex: "1 1 100px" }}>
            <span>{t("lp.level")}</span>
            <select value={set.level || ""} onChange={(e) => save({ level: e.target.value || null })}>
              <option value="">—</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="lp-section">
        <div className="set-items-head">
          <h4>{t(`sets.count.${set.type}`, { n: items.length })}</h4>
          {canEdit && items.length > 1 && (
            <button type="button" className="fb-link" onClick={() => save({ itemIds: byLevel })} disabled={sortedByLevel}>
              {t("sets.sortLevel")}
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="dim lp-empty">{t("sets.empty")}</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={set.itemIds} strategy={verticalListSortingStrategy}>
              <ol className="set-items">
                {items.map((item) => (
                  <SetItem
                    key={item.id}
                    item={item}
                    canEdit={canEdit}
                    onRemove={() => save({ itemIds: set.itemIds.filter((id) => id !== item.id) })}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}
        {canEdit && (
          <ItemPicker
            type={set.type}
            exclude={set.itemIds}
            label={t("sets.add")}
            onPick={(item) => save({ itemIds: [...set.itemIds, item.id] })}
          />
        )}
      </div>

      <div className="lp-section">
        <h4>{t("sets.usedIn")}</h4>
        {lessons === null ? (
          <p className="dim lp-empty">{t("common.loading")}</p>
        ) : lessons.length === 0 ? (
          <p className="dim lp-empty">{t("sets.notUsed")}</p>
        ) : (
          <ul className="ie-setlist">
            {lessons.map((l) => (
              <li key={l.id}>
                <a
                  href={pathFor("lesprogramma", l.id)}
                  onClick={(e) => {
                    e.preventDefault();
                    close().then(() => navigate(pathFor("lesprogramma", l.id)));
                  }}
                >
                  {l.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <div className="auth-error">{error}</div>}
      {canEdit && <SaveStatus status={autosave.status} error={autosave.error} />}
      {canEdit && (
        <div className="lp-actions">
          <button className="lp-danger" onClick={remove}>
            {t("sets.delete")}
          </button>
        </div>
      )}
    </Dialog>
  );
}

function SetItem({ item, canEdit, onRemove }) {
  const { t } = useI18n();
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canEdit,
  });
  return (
    <li
      ref={setNodeRef}
      className={`set-item ${isDragging ? "is-dragging" : ""}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      {canEdit && (
        <span
          ref={setActivatorNodeRef}
          className="board-lane-handle"
          {...attributes}
          {...listeners}
          aria-label={t("sets.dragItem", { name: itemLabel(item) })}
        >
          <DotsSixVertical weight="bold" />
        </span>
      )}
      <span className="set-item-text">
        {itemLabel(item)} {item.en && <span className="dim">· {item.en}</span>}
      </span>
      {(item.introducedAtLevel || item.level) && <LevelBadge level={item.introducedAtLevel || item.level} />}
      {canEdit && (
        <button type="button" className="board-icon-btn" aria-label={t("sets.removeItem", { name: itemLabel(item) })} onClick={onRemove}>
          <X />
        </button>
      )}
    </li>
  );
}
