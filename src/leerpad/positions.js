/**
 * Pure position math for boards (no Supabase import, so it can be checked in node).
 * Positions are floats: an item moved between two neighbours gets their average.
 */

/** Position for an item dropped between two neighbours (either may be missing). */
export function positionBetween(before, after) {
  if (before == null && after == null) return 1;
  if (before == null) return after - 1;
  if (after == null) return before + 1;
  return (before + after) / 2;
}

/**
 * New position for lane `movingId` when it is put at `index` among the other
 * lanes (lanes sorted by position). Returns null when nothing would change.
 */
export function lanePositionAt(lanes, movingId, index) {
  const from = lanes.findIndex((l) => l.id === movingId);
  const rest = lanes.filter((l) => l.id !== movingId);
  if (from < 0 || index < 0 || index > rest.length || index === from) return null;
  return positionBetween(rest[index - 1]?.position, rest[index]?.position);
}

/** Lane dropped on the left ("before") or right ("after") half of lane `targetId`. */
export function laneDropPosition(lanes, movingId, targetId, side) {
  const rest = lanes.filter((l) => l.id !== movingId);
  const idx = rest.findIndex((l) => l.id === targetId);
  if (idx < 0) return null;
  return lanePositionAt(lanes, movingId, side === "after" ? idx + 1 : idx);
}

/** Lane shifted one place left (-1) or right (+1). */
export function laneShiftPosition(lanes, movingId, delta) {
  const from = lanes.findIndex((l) => l.id === movingId);
  return from < 0 ? null : lanePositionAt(lanes, movingId, from + delta);
}
