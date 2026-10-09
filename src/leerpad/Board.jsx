import { useState } from "react";
import { positionBetween, laneDropPosition, laneShiftPosition } from "./positions";
import { useI18n } from "../i18n/context";
import "./leerpad.css";

/**
 * Trello-like board: lanes with cards, drag & drop between and within lanes.
 * Used by both the lesprogramma and the leerpaden.
 *
 * Props:
 *   lanes         [{ id, name }] in display order
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
  const [dragId, setDragId] = useState(null);
  const [dropLane, setDropLane] = useState(null);
  // Lane drag: which lane is moving, and where it would land ({ id, side }).
  const [dragLaneId, setDragLaneId] = useState(null);
  const [laneDrop, setLaneDrop] = useState(null);

  const cardsIn = (laneId) =>
    cards.filter((c) => c.lane_id === laneId).sort((a, b) => a.position - b.position);

  const handleDrop = (e, lane) => {
    e.preventDefault();
    setDropLane(null);
    const moving = cards.find((c) => c.id === dragId);
    setDragId(null);
    if (!moving || !onMoveCard) return;

    // Find the card the pointer is above; insert before it.
    const laneCards = cardsIn(lane.id).filter((c) => c.id !== moving.id);
    const nodes = [...e.currentTarget.querySelectorAll("[data-card-id]")].filter(
      (n) => n.dataset.cardId !== moving.id
    );
    const beforeNode = nodes.find((n) => {
      const r = n.getBoundingClientRect();
      return e.clientY < r.top + r.height / 2;
    });
    const idx = beforeNode
      ? laneCards.findIndex((c) => c.id === beforeNode.dataset.cardId)
      : laneCards.length;
    const position = positionBetween(laneCards[idx - 1]?.position, laneCards[idx]?.position);
    if (moving.lane_id === lane.id && moving.position === position) return;
    onMoveCard(moving, lane.id, position);
  };

  const endLaneDrag = () => {
    setDragLaneId(null);
    setLaneDrop(null);
  };

  const moveLane = (lane, position) => {
    if (position != null) onMoveLane(lane, position);
  };

  // Left or right half of the lane under the pointer.
  const dropSide = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return e.clientX < r.left + r.width / 2 ? "before" : "after";
  };

  const handleLaneDrop = (e, target) => {
    e.preventDefault();
    const moving = lanes.find((l) => l.id === dragLaneId);
    endLaneDrag();
    if (moving) moveLane(moving, laneDropPosition(lanes, moving.id, target.id, dropSide(e)));
  };

  const laneClass = (lane) => {
    if (dragLaneId) {
      if (lane.id === dragLaneId) return "is-lane-dragging";
      if (laneDrop?.id === lane.id) return `is-lane-drop-${laneDrop.side}`;
      return "";
    }
    return dropLane === lane.id ? "is-drop" : "";
  };

  return (
    <div className="board">
      <div className="board-lanes">
        {lanes.map((lane, i) => {
          const all = cardsIn(lane.id);
          const shown = all.filter(isCardVisible);
          return (
            <section
              key={lane.id}
              className={`board-lane ${laneClass(lane)}`}
              aria-label={lane.name}
              onDragOver={(e) => {
                if (dragLaneId) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  const side = dropSide(e);
                  if (laneDrop?.id !== lane.id || laneDrop.side !== side) {
                    setLaneDrop({ id: lane.id, side });
                  }
                  return;
                }
                if (!dragId) return;
                e.preventDefault();
                setDropLane(lane.id);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget)) return;
                setDropLane(null);
                setLaneDrop((d) => (d?.id === lane.id ? null : d));
              }}
              onDrop={(e) => (dragLaneId ? handleLaneDrop(e, lane) : handleDrop(e, lane))}
            >
              <LaneHeader
                lane={lane}
                count={all.length}
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
                onDragStart={
                  onMoveLane &&
                  ((e) => {
                    // Show the whole lane as drag image, grabbed at the handle.
                    const section = e.currentTarget.closest(".board-lane");
                    const r = section.getBoundingClientRect();
                    e.dataTransfer.setDragImage(section, e.clientX - r.left, e.clientY - r.top);
                    e.dataTransfer.effectAllowed = "move";
                    // Own type, so a lane can't be dropped as text into an input.
                    e.dataTransfer.setData("application/x-board-lane", lane.id);
                    setDragLaneId(lane.id);
                  })
                }
                onDragEnd={endLaneDrag}
                onMoveLeft={
                  onMoveLane && i > 0 && (() => moveLane(lane, laneShiftPosition(lanes, lane.id, -1)))
                }
                onMoveRight={
                  onMoveLane &&
                  i < lanes.length - 1 &&
                  (() => moveLane(lane, laneShiftPosition(lanes, lane.id, 1)))
                }
              />
              <div className="board-cards">
                {shown.map((card) => {
                  const selected = selection?.selectedIds.has(card.id);
                  return (
                  <div
                    key={card.id}
                    data-card-id={card.id}
                    className={`board-card ${cardClass(card)} ${dragId === card.id ? "is-dragging" : ""} ${selection ? "is-selectable" : ""} ${selected ? "is-selected" : ""}`}
                    role={selection ? "checkbox" : "button"}
                    aria-checked={selection ? Boolean(selected) : undefined}
                    tabIndex={0}
                    draggable={Boolean(onMoveCard) && !selection}
                    onDragStart={(e) => {
                      setDragId(card.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", card.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setDropLane(null);
                    }}
                    onClick={(e) =>
                      selection ? selection.onToggle(card, e, shown) : onOpenCard?.(card)
                    }
                    onKeyDown={(e) => {
                      if (selection && (e.key === " " || e.key === "Enter")) {
                        e.preventDefault();
                        selection.onToggle(card, e, shown);
                      } else if (e.key === "Enter") onOpenCard?.(card);
                    }}
                  >
                    {selection && <span className="board-card-check" aria-hidden="true">{selected ? "✓" : ""}</span>}
                    {renderCard(card)}
                  </div>
                  );
                })}
                {shown.length === 0 && (
                  <div className="board-empty">
                    {all.length ? t("board.filterEmpty") : emptyLaneText || t("board.empty")}
                  </div>
                )}
              </div>
              {laneFooter && <div className="board-lane-footer">{laneFooter(lane)}</div>}
            </section>
          );
        })}
        {onAddLane && <AddLane onAdd={onAddLane} />}
      </div>
    </div>
  );
}

function LaneHeader({
  lane,
  count,
  onRename,
  onDelete,
  onDragStart,
  onDragEnd,
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
      {onDragStart && !editing && (
        <span
          className="board-lane-handle"
          role="img"
          draggable
          title={t("board.dragLane")}
          aria-label={t("board.dragLaneAria", { name: lane.name })}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          ⠿
        </span>
      )}
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
            ‹
          </button>
          <button
            className="board-icon-btn"
            title={t("board.moveLaneRight")}
            aria-label={t("board.moveLaneRightAria", { name: lane.name })}
            disabled={!onMoveRight}
            onClick={() => onMoveRight?.()}
          >
            ›
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
          ✎
        </button>
      )}
      {onDelete && !editing && (
        <button
          className="board-icon-btn"
          title={t("board.deleteLane")}
          aria-label={t("board.deleteLaneAria", { name: lane.name })}
          onClick={() => onDelete(lane)}
        >
          ✕
        </button>
      )}
    </div>
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
