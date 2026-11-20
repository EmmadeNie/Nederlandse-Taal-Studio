// Profile picture (1080×1080) for Instagram, YouTube & co.: the logo's blocks on
// the dark app colour, small enough to sit well inside a round crop.
import { AbsoluteFill } from "remotion";
import { C } from "./Demo";

// The blocks of public/logo-icon.svg (viewBox 5 5 30 30).
const BLOCKS = [
  { x: 6, y: 26, fill: C.blue, o: 0.5 },
  { x: 16, y: 26, fill: C.blue, o: 0.75 },
  { x: 16, y: 16, fill: C.blue, o: 0.75 },
  { x: 26, y: 26, fill: C.green, o: 1 },
  { x: 26, y: 16, fill: C.green, o: 1 },
  { x: 26, y: 6, fill: C.orange, o: 1 },
];

export function Avatar() {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, #262b36 0%, ${C.bg} 75%)`, alignItems: "center", justifyContent: "center" }}>
      {/* Nudged up and left: the staircase's weight sits bottom right. */}
      <svg width={600} height={600} viewBox="5 5 30 30" style={{ transform: "translate(-36px, -36px)" }}>
        {BLOCKS.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={8} height={8} rx={2} fill={b.fill} opacity={b.o} />
        ))}
      </svg>
    </AbsoluteFill>
  );
}
