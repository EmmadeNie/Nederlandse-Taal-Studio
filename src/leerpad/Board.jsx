import { useState } from "react";
import { positionBetween } from "./api";
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
 *   laneFooter    (lane) => node, e.g. an "add card" form
 *   emptyLaneText text for a lane without cards
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
  laneFooter,
  emptyLaneText = "Nog leeg.",
}) {
  const [dragId, setDragId] = useState(null);
  const [dropLane, setDropLane] = useState(null);

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

  return (
    <div className="board">
      <div className="board-lanes">
        {lanes.map((lane) => {
          const all = cardsIn(lane.id);
          const shown = all.filter(isCardVisible);
          return (
            <section
              key={lane.id}
              className={`board-lane ${dropLane === lane.id ? "is-drop" : ""}`}
              aria-label={lane.name}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                setDropLane(lane.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setDropLane(null);
              }}
              onDrop={(e) => handleDrop(e, lane)}
            >
              <LaneHeader
                lane={lane}
                count={all.length}
                onRename={onRenameLane}
                onDelete={all.length === 0 ? onDeleteLane : null}
              />
              <div className="board-cards">
                {shown.map((card) => (
                  <div
                    key={card.id}
                    data-card-id={card.id}
                    className={`board-card ${cardClass(card)} ${dragId === card.id ? "is-dragging" : ""}`}
                    role="button"
                    tabIndex={0}
                    draggable={Boolean(onMoveCard)}
                    onDragStart={(e) => {
                      setDragId(card.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", card.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setDropLane(null);
                    }}
                    onClick={() => onOpenCard?.(card)}
                    onKeyDown={(e) => e.key === "Enter" && onOpenCard?.(card)}
                  >
                    {renderCard(card)}
                  </div>
                ))}
                {shown.length === 0 && (
                  <div className="board-empty">
                    {all.length ? "Geen kaarten die passen bij je filter." : emptyLaneText}
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

function LaneHeader({ lane, count, onRename, onDelete }) {
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
      {editing ? (
        <input
          autoFocus
          value={name}
          aria-label="Naam van de lane"
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
      {onRename && !editing && (
        <button
          className="board-icon-btn"
          title="Hernoemen"
          aria-label={`Hernoem ${lane.name}`}
          onClick={() => setEditing(true)}
        >
          ✎
        </button>
      )}
      {onDelete && !editing && (
        <button
          className="board-icon-btn"
          title="Lege lane verwijderen"
          aria-label={`Verwijder ${lane.name}`}
          onClick={() => onDelete(lane)}
        >
          ✕
        </button>
      )}
    </div>
  );
}

function AddLane({ onAdd }) {
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
            placeholder="Naam, bijv. Huiswerk"
            aria-label="Naam van de nieuwe lane"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          />
          <div className="board-inline-actions">
            <button type="submit" className="fb-btn-primary">Toevoegen</button>
            <button type="button" className="fb-btn-secondary" onClick={() => setOpen(false)}>
              Annuleer
            </button>
          </div>
        </form>
      ) : (
        <button className="board-add-btn" onClick={() => setOpen(true)}>
          + Lane toevoegen
        </button>
      )}
    </div>
  );
}

/** Small inline "add a card" form for a lane footer. */
export function AddCardForm({ label, placeholder, onAdd, extra }) {
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
        <button type="submit" className="fb-btn-primary">Toevoegen</button>
        <button type="button" className="fb-btn-secondary" onClick={() => setOpen(false)}>
          Annuleer
        </button>
      </div>
    </form>
  );
}
