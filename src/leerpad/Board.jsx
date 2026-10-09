import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { positionBetween, lanePositionAt, laneShiftPosition } from "./positions";
import { useI18n } from "../i18n/context";
import { CaretLeft, CaretRight, Check, DotsSixVertical, PencilSimple, X } from "../icons";
import "./leerpad.css";

/**
 * Trello-like board: lanes with cards, drag & drop between and within lanes
 * (mouse, touch and keyboard, via dnd-kit). Cards make room while you drag
 * and the board scrolls along at the edges.
 * Used by both the lesprogramma and the leerpaden.
 *
 * Props:
 *   lanes         [{ id, name, position }] in display order
 *   cards         [{ id, lane_id, position, ... }]
 *   renderCard    (card) => node (the card's inner content)
 *   onOpenCard    (card) => void
 *   onMoveCard    (card, laneId, position) => void; omit to disable dragging
 *   isCardVisible (card) => boolean, for filtering (hidden cards keep their place)
 *   cardClass     (card) => extra class name
 *   onAddLane     (name) => void
 *   onRenameLane  (lane, name) => void
 *   onDeleteLane  (lane) => void (only offered for empty lanes)
 *   onMoveLane    (lane, position) => void; omit to disable lane reordering.
 *                 The caller must keep `lanes` sorted by position afterwards.
 *   laneFooter    (lane) => node, e.g. an "add card" form
 *   emptyLaneText text for a lane without cards
 *   selection     optional select mode: { selectedIds: Set, onToggle(card, event, laneCards),
 *                 onToggleLane(lane, laneCards) }. While set, clicking a card selects it
 *                 instead of opening it, and cards can't be dragged.
 */

// Ids in the drag & drop context: cards use their own id, lanes and the card
// area of a lane (the drop target for empty lanes) get a prefix.
const laneKey = (id) => `lane:${id}`;
const areaKey = (id) => `area:${id}`;

/** Cards snap to cards or a lane's card area; lanes only to lanes. */
function collisionDetection(args) {
  const type = args.active.data.current?.type;
  const containers = args.droppableContainers.filter((c) =>
    type === "lane" ? c.data.current?.type === "lane" : c.data.current?.type !== "lane"
  );
  if (type === "lane") return closestCenter({ ...args, droppableContainers: containers });
  const within = pointerWithin({ ...args, droppableContainers: containers });
  if (within.length) {
    const card = within.find((c) => c.data?.droppableContainer?.data.current?.type === "card");
    return card ? [card] : within;
  }
  return closestCorners({ ...args, droppableContainers: containers });
}

export default function Board({
  lanes,
  cards,
  renderCard,
  onOpenCard,
  onMoveCard,
  isCardVisible = () => true,
  cardClass = () => "",
  onAddLane,
  onRenameLane,
  onDeleteLane,
  onMoveLane,
  laneFooter,
  emptyLaneText,
  selection,
}) {
  const { t } = useI18n();
  // What is being dragged: { type: "card" | "lane", id }.
  const [active, setActive] = useState(null);
  // While a card is dragged: the visible card ids per lane, as they would be
  // after the drop. The card moves between lanes here as you drag.
  const [columns, setColumns] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter opens a card, so only Space picks it up.
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    })
  );

  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const cardsIn = (laneId) =>
    cards.filter((c) => c.lane_id === laneId).sort((a, b) => a.position - b.position);

  const visibleIds = () =>
    Object.fromEntries(lanes.map((l) => [l.id, cardsIn(l.id).filter(isCardVisible).map((c) => c.id)]));

  const laneOfCard = (cols, cardId) => Object.keys(cols).find((laneId) => cols[laneId].includes(cardId));

  const canDragCards = Boolean(onMoveCard) && !selection;

  const onDragStart = ({ active: a }) => {
    const type = a.data.current?.type;
    if (type === "lane") setActive({ type, id: a.data.current.laneId });
    else {
      setActive({ type: "card", id: a.id });
      setColumns(visibleIds());
    }
  };

  // A card crossing into another lane: move it there right away, so the
  // cards in that lane make room.
  const onDragOver = ({ active: a, over }) => {
    if (a.data.current?.type !== "card" || !over || !columns) return;
    const overType = over.data.current?.type;
    const from = laneOfCard(columns, a.id);
    const to = overType === "area" ? over.data.current.laneId : laneOfCard(columns, over.id);
    if (!from || !to || from === to) return;
    setColumns((cols) => {
      const target = cols[to].filter((id) => id !== a.id);
      let index = target.length;
      if (overType === "card") {
        index = target.indexOf(over.id);
        const r = a.rect.current.translated;
        if (r && r.top > over.rect.top + over.rect.height / 2) index += 1;
      }
      return {
        ...cols,
        [from]: cols[from].filter((id) => id !== a.id),
        [to]: [...target.slice(0, index), a.id, ...target.slice(index)],
      };
    });
  };

  const finish = () => {
    setActive(null);
    setColumns(null);
  };

  const onDragEnd = ({ active: a, over }) => {
    const type = a.data.current?.type;
    if (type === "lane") {
      const laneId = a.data.current.laneId;
      const overLane = over?.data.current?.laneId;
      finish();
      if (!overLane || overLane === laneId) return;
      const index = lanes.findIndex((l) => l.id === overLane);
      const position = lanePositionAt(lanes, laneId, index);
      if (position != null) onMoveLane(lanes.find((l) => l.id === laneId), position);
      return;
    }

    const cols = columns;
    finish();
    const card = cardById.get(a.id);
    if (!cols || !card || !over) return;
    const laneId = laneOfCard(cols, a.id);
    let ids = cols[laneId];
    if (over.data.current?.type === "card" && over.id !== a.id && ids.includes(over.id)) {
      ids = arrayMove(ids, ids.indexOf(a.id), ids.indexOf(over.id));
    }
    const i = ids.indexOf(a.id);
    const before = cardById.get(ids[i - 1]);
    const after = cardById.get(ids[i + 1]);
    // Unchanged when it stays in its lane between the same neighbours.
    if (laneId === card.lane_id && (before?.position ?? -Infinity) < card.position && card.position < (after?.position ?? Infinity)) {
      return;
    }
    onMoveCard(card, laneId, positionBetween(before?.position, after?.position));
  };

  const activeCard = active?.type === "card" ? cardById.get(active.id) : null;
  const activeLane = active?.type === "lane" ? lanes.find((l) => l.id === active.id) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={finish}
      accessibility={{ screenReaderInstructions: { draggable: t("board.dragHelp") } }}
    >
      <div className="board">
        <div className="board-lanes">
          <SortableContext items={lanes.map((l) => laneKey(l.id))} strategy={horizontalListSortingStrategy}>
            {lanes.map((lane, i) => {
              const all = cardsIn(lane.id);
              const shown = columns
                ? columns[lane.id].map((id) => cardById.get(id)).filter(Boolean)
                : all.filter(isCardVisible);
              return (
                <SortableLane
                  key={lane.id}
                  lane={lane}
                  canDrag={Boolean(onMoveLane)}
                  isOver={columns && activeCard && columns[lane.id].includes(activeCard.id) && activeCard.lane_id !== lane.id}
                >
                  {(handle) => (
                    <>
                      <LaneHeader
                        lane={lane}
                        count={all.length}
                        handle={handle}
                        selectState={
                          selection &&
                          shown.length > 0 && {
                            checked: shown.every((c) => selection.selectedIds.has(c.id)),
                            some: shown.some((c) => selection.selectedIds.has(c.id)),
                            onToggle: () => selection.onToggleLane(lane, shown),
                          }
                        }
                        onRename={onRenameLane}
                        onDelete={all.length === 0 ? onDeleteLane : null}
                        onMoveLeft={
                          onMoveLane && i > 0 && (() => onMoveLaneTo(onMoveLane, lanes, lane, -1))
                        }
                        onMoveRight={
                          onMoveLane &&
                          i < lanes.length - 1 &&
                          (() => onMoveLaneTo(onMoveLane, lanes, lane, 1))
                        }
                      />
                      <CardArea laneId={lane.id}>
                        <SortableContext items={shown.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                          {shown.map((card) => (
                            <SortableCard
                              key={card.id}
                              card={card}
                              laneId={lane.id}
                              canDrag={canDragCards}
                              className={cardClass(card)}
                              selection={selection}
                              laneCards={shown}
                              onOpenCard={onOpenCard}
                            >
                              {renderCard(card)}
                            </SortableCard>
                          ))}
                        </SortableContext>
                        {shown.length === 0 && (
                          <div className="board-empty">
                            {all.length ? t("board.filterEmpty") : emptyLaneText || t("board.empty")}
                          </div>
                        )}
                      </CardArea>
                      {laneFooter && <div className="board-lane-footer">{laneFooter(lane)}</div>}
                    </>
                  )}
                </SortableLane>
              );
            })}
          </SortableContext>
          {onAddLane && <AddLane onAdd={onAddLane} />}
        </div>
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
        {activeCard && (
          <div className={`board-card is-overlay ${cardClass(activeCard)}`}>{renderCard(activeCard)}</div>
        )}
        {activeLane && (
          <section className="board-lane is-overlay">
            <div className="board-lane-head">
              <span className="board-lane-handle">
                <DotsSixVertical weight="bold" />
              </span>
              <h3>{activeLane.name}</h3>
              <span className="board-count">{cardsIn(activeLane.id).length}</span>
            </div>
            <div className="board-cards">
              {cardsIn(activeLane.id)
                .filter(isCardVisible)
                .slice(0, 6)
                .map((card) => (
                  <div key={card.id} className={`board-card ${cardClass(card)}`}>
                    {renderCard(card)}
                  </div>
                ))}
            </div>
          </section>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function onMoveLaneTo(onMoveLane, lanes, lane, delta) {
  const position = laneShiftPosition(lanes, lane.id, delta);
  if (position != null) onMoveLane(lane, position);
}

/** A lane that can be dragged by its handle. children(handle) renders its content. */
function SortableLane({ lane, canDrag, isOver, children }) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } =
    useSortable({ id: laneKey(lane.id), data: { type: "lane", laneId: lane.id }, disabled: !canDrag });
  return (
    <section
      ref={setNodeRef}
      className={`board-lane ${isDragging ? "is-lane-dragging" : ""} ${isOver ? "is-drop" : ""}`}
      aria-label={lane.name}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      {children(canDrag ? { setNode: setActivatorNodeRef, listeners, attributes } : null)}
    </section>
  );
}

/** The card list of a lane; also the drop target when the lane is empty. */
function CardArea({ laneId, children }) {
  const { setNodeRef } = useDroppable({ id: areaKey(laneId), data: { type: "area", laneId } });
  return (
    <div ref={setNodeRef} className="board-cards">
      {children}
    </div>
  );
}

function SortableCard({ card, laneId, canDrag, className, selection, laneCards, onOpenCard, children }) {
  const { setNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", laneId },
    disabled: !canDrag,
  });
  const selected = selection?.selectedIds.has(card.id);
  return (
    <div
      ref={setNodeRef}
      data-card-id={card.id}
      {...attributes}
      {...listeners}
      className={`board-card ${className} ${canDrag ? "is-draggable" : ""} ${isDragging ? "is-dragging" : ""} ${selection ? "is-selectable" : ""} ${selected ? "is-selected" : ""}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      role={selection ? "checkbox" : "button"}
      aria-checked={selection ? Boolean(selected) : undefined}
      aria-roledescription={canDrag ? attributes["aria-roledescription"] : undefined}
      tabIndex={0}
      onClick={(e) => (selection ? selection.onToggle(card, e, laneCards) : onOpenCard?.(card))}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (selection && (e.key === " " || e.key === "Enter")) {
          e.preventDefault();
          selection.onToggle(card, e, laneCards);
        } else if (e.key === "Enter") onOpenCard?.(card);
      }}
    >
      {selection && (
        <span className="board-card-check" aria-hidden="true">
          {selected ? <Check weight="bold" /> : null}
        </span>
      )}
      {children}
    </div>
  );
}

function LaneHeader({
  lane,
  count,
  onRename,
  onDelete,
  handle,
  onMoveLeft,
  onMoveRight,
  selectState,
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(lane.name);

  const save = () => {
    setEditing(false);
    const v = name.trim();
    if (v && v !== lane.name) onRename(lane, v);
    else setName(lane.name);
  };

  return (
    <div className="board-lane-head">
      {selectState && (
        <input
          type="checkbox"
          className="board-lane-select"
          checked={selectState.checked}
          ref={(el) => el && (el.indeterminate = selectState.some && !selectState.checked)}
          onChange={selectState.onToggle}
          title={t("select.lane")}
          aria-label={t("select.laneAria", { name: lane.name })}
        />
      )}
      {handle && !editing && <LaneHandle {...handle} lane={lane} />}
      {editing ? (
        <input
          autoFocus
          value={name}
          aria-label={t("board.laneName")}
          onChange={(e) => setName(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setName(lane.name);
              setEditing(false);
            }
          }}
        />
      ) : (
        <h3 onDoubleClick={() => onRename && setEditing(true)}>{lane.name}</h3>
      )}
      <span className="board-count">{count}</span>
      {(onMoveLeft || onMoveRight) && !editing && (
        <span className="board-lane-move">
          <button
            className="board-icon-btn"
            title={t("board.moveLaneLeft")}
            aria-label={t("board.moveLaneLeftAria", { name: lane.name })}
            disabled={!onMoveLeft}
            onClick={() => onMoveLeft?.()}
          >
            <CaretLeft weight="bold" />
          </button>
          <button
            className="board-icon-btn"
            title={t("board.moveLaneRight")}
            aria-label={t("board.moveLaneRightAria", { name: lane.name })}
            disabled={!onMoveRight}
            onClick={() => onMoveRight?.()}
          >
            <CaretRight weight="bold" />
          </button>
        </span>
      )}
      {onRename && !editing && (
        <button
          className="board-icon-btn"
          title={t("common.rename")}
          aria-label={t("board.renameLane", { name: lane.name })}
          onClick={() => setEditing(true)}
        >
          <PencilSimple />
        </button>
      )}
      {onDelete && !editing && (
        <button
          className="board-icon-btn"
          title={t("board.deleteLane")}
          aria-label={t("board.deleteLaneAria", { name: lane.name })}
          onClick={() => onDelete(lane)}
        >
          <X />
        </button>
      )}
    </div>
  );
}

/** Grip to drag a lane (the rest of the lane header stays clickable). */
function LaneHandle({ setNode, listeners, attributes, lane }) {
  const { t } = useI18n();
  return (
    <span
      ref={setNode}
      className="board-lane-handle"
      {...attributes}
      {...listeners}
      title={t("board.dragLane")}
      aria-label={t("board.dragLaneAria", { name: lane.name })}
    >
      <DotsSixVertical weight="bold" />
    </span>
  );
}

function AddLane({ onAdd }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
    setOpen(false);
  };
  return (
    <div className="board-add-lane">
      {open ? (
        <form className="board-inline-form" onSubmit={submit}>
          <input
            autoFocus
            value={name}
            placeholder={t("board.newLane")}
            aria-label={t("board.laneName")}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          />
          <div className="board-inline-actions">
            <button type="submit" className="fb-btn-primary">{t("common.add")}</button>
            <button type="button" className="fb-btn-secondary" onClick={() => setOpen(false)}>
              {t("common.cancelShort")}
            </button>
          </div>
        </form>
      ) : (
        <button className="board-add-btn" onClick={() => setOpen(true)}>
          {t("board.addLane")}
        </button>
      )}
    </div>
  );
}

/** Small inline "add a card" form for a lane footer. */
export function AddCardForm({ label, placeholder, onAdd, extra }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim());
    setTitle("");
    setOpen(false);
  };
  if (!open) {
    return (
      <button className="board-add-btn" onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }
  return (
    <form className="board-inline-form" onSubmit={submit}>
      <input
        autoFocus
        value={title}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />
      {extra}
      <div className="board-inline-actions">
        <button type="submit" className="fb-btn-primary">{t("common.add")}</button>
        <button type="button" className="fb-btn-secondary" onClick={() => setOpen(false)}>
          {t("common.cancelShort")}
        </button>
      </div>
    </form>
  );
}
