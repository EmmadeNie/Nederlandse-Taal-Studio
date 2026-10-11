/**
 * "Ordenen per niveau" on a leerpad: one lane per level (A0, A1, …), named after
 * the level; every step with a level goes to its lane. Steps keep their order
 * (lane by lane, top to bottom); steps without a level stay where they are.
 * Pure: no Supabase, so it can be checked in node.
 */
import { LEVELS } from "../data/schema.js";

/**
 * lanes: [{ id, name, position }], steps: [{ id, lane_id, position }],
 * levelOf(step) → "A1" | null.
 * Returns { newLanes: ["A2", …], moves: [{ step, lane: name, position }], noLevel, levels }.
 */
export function planByLevel(lanes, steps, levelOf) {
  const laneOrder = new Map([...lanes].sort((a, b) => a.position - b.position).map((l, i) => [l.id, i]));
  const ordered = [...steps].sort(
    (a, b) => (laneOrder.get(a.lane_id) ?? 0) - (laneOrder.get(b.lane_id) ?? 0) || a.position - b.position
  );
  const laneFor = (level) => lanes.find((l) => l.name.trim().toUpperCase() === level);
  const levels = LEVELS.filter((lv) => ordered.some((s) => levelOf(s) === lv));
  const newLanes = levels.filter((lv) => !laneFor(lv));
  const moves = [];
  levels.forEach((lv) => {
    const target = laneFor(lv);
    ordered
      .filter((s) => levelOf(s) === lv)
      .forEach((s, i) => {
        const position = i + 1;
        if (!target || s.lane_id !== target.id || s.position !== position) moves.push({ step: s, lane: lv, position });
      });
  });
  return { newLanes, moves, levels, noLevel: ordered.filter((s) => !levelOf(s)).length };
}
