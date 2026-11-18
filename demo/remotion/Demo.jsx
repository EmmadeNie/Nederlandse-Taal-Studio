// The demo video: recorded screens of Taal Studio, cut short, with a moving
// camera, a 3D tilt, big captions and an intro/outro with the logo.
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { MANIFESTS, MUSIC } from "./manifests";

const { fontFamily } = loadFont("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });

export const FPS = 30;
const OVERLAP = 10; // frames two segments share, for the transition

const C = {
  bg: "#0b0d11",
  blue: "#4f9cf9",
  green: "#2fd27a",
  orange: "#f08c3c",
  tile: "#22262f",
  text: "#e6e8ec",
  dim: "#9aa3b2",
};

const TEXT = {
  nl: {
    tagline: "Nederlands leren, op jouw niveau.",
    board: ["Jouw eigen", "leerpad"],
    plan: ["Je docent plant", "de volgende stap"],
    lesson: ["Heldere uitleg", "bij elke les"],
    conjugate: ["Oefen direct,", "met feedback"],
    flashcards: ["Flashcards die", "blijven hangen"],
    outro: "Log in en ga verder waar je was.",
  },
  en: {
    tagline: "Learn Dutch, at your level.",
    board: ["Your own", "learning path"],
    plan: ["Your teacher plans", "the next step"],
    lesson: ["Clear explanations", "for every lesson"],
    conjugate: ["Practise right away,", "with feedback"],
    flashcards: ["Flashcards that", "stick"],
    outro: "Log in and carry on where you left off.",
  },
};

/**
 * The cut, in order. A clip plays its scene from `from` to `to` (seconds in the
 * recording) at `speed`. The camera keys are in recording seconds; x/y are the
 * point to look at in the 1440×900 screen, or a mark's name to look at its box.
 */
const SEGMENTS = [
  { kind: "intro", seconds: 2.4 },
  {
    kind: "clip", scene: "board", from: 0.9, to: 7.6, speed: 1.35, caption: "board",
    camera: [
      { t: 0.9, zoom: 1.0 },
      { t: 1.6, zoom: 1.3, look: "drag-done", dx: 120 },
      { t: 5.6, zoom: 1.3, look: "drag-done", dx: 160 },
      { t: 6.3, zoom: 1.75, look: "status", dx: 120, dy: -10 },
      { t: 7.6, zoom: 1.75, look: "status", dx: 120, dy: -10 },
    ],
  },
  {
    kind: "clip", scene: "board", from: 8.0, to: 15.2, speed: 1.5, caption: "plan",
    camera: [
      { t: 8.0, zoom: 1.05 },
      { t: 10.6, zoom: 1.05 },
      { t: 11.4, zoom: 1.35, look: "plan", dx: 140 },
      { t: 15.2, zoom: 1.45, x: 860, y: 470 },
    ],
  },
  {
    kind: "clip", scene: "lesson", from: 0.2, to: 7.0, speed: 1.35, caption: "lesson",
    camera: [
      { t: 0.2, zoom: 1.0 },
      { t: 1.4, zoom: 1.22, look: "open" },
      { t: 7.0, zoom: 1.3, look: "open", dy: 40 },
    ],
  },
  {
    kind: "clip", scene: "conjugate", from: 1.8, to: 14.4, speed: 2.0, caption: "conjugate",
    camera: [
      { t: 1.8, zoom: 1.2, look: "answer-0", dy: 60 },
      { t: 2.6, zoom: 1.9, look: "answer-0", dy: 70 },
      { t: 14.4, zoom: 1.9, look: "answer-0", dy: 70 },
    ],
  },
  {
    kind: "clip", scene: "flashcards", from: 4.6, to: 10.6, speed: 1.4, caption: "flashcards",
    camera: [
      { t: 4.6, zoom: 1.15, x: 720, y: 430 },
      { t: 10.6, zoom: 1.4, x: 720, y: 440 },
    ],
  },
  { kind: "outro", seconds: 2.8 },
];

const lengthOf = (s) => Math.round((s.kind === "clip" ? (s.to - s.from) / s.speed : s.seconds) * FPS);
export const durationOf = () => SEGMENTS.reduce((n, s) => n + lengthOf(s), 0) - OVERLAP * (SEGMENTS.length - 1);

// Where each segment starts: right after the previous one, minus the overlap.
const STARTS = SEGMENTS.reduce((acc, s, i) => [...acc, i ? acc[i - 1] + lengthOf(SEGMENTS[i - 1]) - OVERLAP : 0], []);

export function Demo({ lang }) {
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily }}>
      <Backdrop />
      {SEGMENTS.map((s, i) => {
        const len = lengthOf(s);
        const from = STARTS[i];
        return (
          <Sequence key={i} from={from} durationInFrames={len}>
            {s.kind === "intro" && <Intro lang={lang} />}
            {s.kind === "outro" && <Outro lang={lang} />}
            {s.kind === "clip" && <Clip lang={lang} seg={s} index={i} />}
          </Sequence>
        );
      })}
      {MUSIC && <Audio src={staticFile("music.mp3")} volume={(f) => interpolate(f, [0, 15, durationOf() - 30, durationOf()], [0, 0.8, 0.8, 0], { extrapolateRight: "clamp" })} />}
    </AbsoluteFill>
  );
}

/** Slow-moving glow in the logo colours. */
function Backdrop() {
  const f = useCurrentFrame();
  const blob = (color, x, y, r, speed, phase) => {
    const dx = Math.sin(f / speed + phase) * 120;
    const dy = Math.cos(f / (speed * 1.3) + phase) * 90;
    return (
      <div
        style={{
          position: "absolute",
          left: x + dx - r,
          top: y + dy - r,
          width: r * 2,
          height: r * 2,
          borderRadius: "50%",
          background: color,
          opacity: 0.22,
          filter: "blur(140px)",
        }}
      />
    );
  };
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {blob(C.blue, 380, 300, 420, 70, 0)}
      {blob(C.green, 1600, 900, 380, 85, 2)}
      {blob(C.orange, 1500, 180, 300, 60, 4)}
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />
    </AbsoluteFill>
  );
}

/** Enter/leave of a segment: 0→1 at the start, 1→0 at the end. */
function useInOut(len) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: f, fps, config: { damping: 18, mass: 0.8 } });
  const leave = interpolate(f, [len - OVERLAP, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { f, fps, enter, leave };
}

const frameAt = (frames, t) => {
  let lo = 0;
  let hi = frames.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (frames[mid].t <= t) lo = mid;
    else hi = mid - 1;
  }
  return frames[lo].file;
};

/** Camera at recording time t: eased between the keys. */
function cameraAt(keys, marks, t) {
  const pos = (k) => {
    const m = k.look && marks.find((x) => x.name === k.look)?.box;
    const x = k.x ?? (m ? m.x + m.width / 2 : 720);
    const y = k.y ?? (m ? m.y + m.height / 2 : 450);
    return { zoom: k.zoom, x: x + (k.dx ?? 0), y: y + (k.dy ?? 0) };
  };
  const ps = keys.map((k) => ({ t: k.t, ...pos(k) }));
  if (t <= ps[0].t) return ps[0];
  for (let i = 1; i < ps.length; i++) {
    if (t <= ps[i].t) {
      const a = ps[i - 1];
      const b = ps[i];
      const k = Easing.inOut(Easing.cubic)((t - a.t) / (b.t - a.t || 1));
      return { zoom: a.zoom + (b.zoom - a.zoom) * k, x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
  }
  return ps[ps.length - 1];
}

const SCREEN_W = 1440;
const SCREEN_H = 900;
const BASE = 1.12; // screen size at zoom 1, against the 1920×1200 frame

function Clip({ lang, seg, index }) {
  const len = lengthOf(seg);
  const { f, fps, enter, leave } = useInOut(len);
  const m = MANIFESTS[lang][seg.scene];
  const t = seg.from + (f / fps) * seg.speed;
  const file = frameAt(m.frames, t);
  const cam = cameraAt(seg.camera, m.marks, t);

  // Keep the screen inside the frame: the look-at point may not pull an edge in.
  const s = BASE * cam.zoom;
  const half = { w: 960, h: 600 };
  const clampX = Math.min(Math.max(cam.x, half.w / s), SCREEN_W - half.w / s);
  const clampY = Math.min(Math.max(cam.y, half.h / s), SCREEN_H - half.h / s);
  const fx = cam.zoom * BASE * SCREEN_W > 1920 ? clampX : SCREEN_W / 2;
  const fy = cam.zoom * BASE * SCREEN_H > 1200 ? clampY : SCREEN_H / 2;

  // Each clip swings in from a different side.
  const side = index % 2 ? 1 : -1;
  const tiltY = interpolate(enter, [0, 1], [24 * side, 0]) + interpolate(leave, [0, 1], [-14 * side, 0]);
  const tiltX = interpolate(enter, [0, 1], [10, 0]);
  const pop = interpolate(enter, [0, 1], [0.82, 1]) * interpolate(leave, [0, 1], [1.08, 1]);
  const opacity = Math.min(enter * 1.4, 1) * leave;
  const blur = interpolate(enter, [0, 1], [12, 0]) + interpolate(leave, [0, 1], [10, 0]);

  return (
    <AbsoluteFill style={{ perspective: 2400, opacity }}>
      <AbsoluteFill
        style={{
          transform: `scale(${pop}) rotateY(${tiltY}deg) rotateX(${tiltX}deg)`,
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: SCREEN_W,
            height: SCREEN_H,
            transformOrigin: "0 0",
            transform: `translate(${960 - fx * s}px, ${600 - fy * s}px) scale(${s})`,
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 40px 120px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          <Img src={staticFile(`${lang}/${seg.scene}/${file}`)} style={{ width: SCREEN_W, height: SCREEN_H, display: "block" }} />
        </div>
      </AbsoluteFill>
      <Caption lines={TEXT[lang][seg.caption]} len={len} />
    </AbsoluteFill>
  );
}

/** Two lines, word by word, bottom left, on a dark glass card. */
function Caption({ lines, len }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = 6;
  const out = interpolate(f, [len - OVERLAP - 6, len - OVERLAP + 2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const box = spring({ frame: f - start + 2, fps, config: { damping: 16 } });
  let n = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        bottom: 90,
        padding: "28px 40px 32px",
        borderRadius: 26,
        background: "rgba(11,13,17,0.72)",
        backdropFilter: "blur(18px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.08)",
        transform: `translateY(${(1 - box) * 40}px) scale(${0.9 + 0.1 * box})`,
        transformOrigin: "left bottom",
        opacity: box * out,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", gap: 18, overflow: "hidden", paddingBottom: 4 }}>
          {line.split(" ").map((w) => {
            const s = spring({ frame: f - start - n++ * 3, fps, config: { damping: 14, mass: 0.6 } });
            return (
              <span
                key={w + li}
                style={{
                  fontSize: 64,
                  fontWeight: 800,
                  letterSpacing: -1.5,
                  lineHeight: 1.08,
                  color: li === 1 ? "transparent" : C.text,
                  backgroundImage: li === 1 ? `linear-gradient(90deg, ${C.blue}, ${C.green})` : undefined,
                  WebkitBackgroundClip: li === 1 ? "text" : undefined,
                  transform: `translateY(${(1 - s) * 80}px)`,
                  opacity: s,
                  display: "inline-block",
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** The logo's cards, each dropping into place. size = width of the mark in px. */
function LogoMark({ size, delay = 0 }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = size / 40;
  const cards = [
    { x: 6, y: 26, c: C.blue, o: 0.5 },
    { x: 16, y: 26, c: C.blue, o: 0.75 },
    { x: 16, y: 16, c: C.blue, o: 0.75 },
    { x: 26, y: 26, c: C.green, o: 1 },
    { x: 26, y: 16, c: C.green, o: 1 },
    { x: 26, y: 6, c: C.orange, o: 1 },
  ];
  const tile = spring({ frame: f - delay, fps, config: { damping: 15 } });
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div
        style={{
          position: "absolute",
          inset: k,
          borderRadius: 9 * k,
          background: C.tile,
          transform: `scale(${tile})`,
          boxShadow: `0 ${20 * k / 8}px ${60 * k / 8}px rgba(0,0,0,0.45)`,
        }}
      />
      {cards.map((card, i) => {
        const s = spring({ frame: f - delay - 6 - i * 3, fps, config: { damping: 11, mass: 0.7 } });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: card.x * k,
              top: card.y * k,
              width: 8 * k,
              height: 8 * k,
              borderRadius: 2 * k,
              background: card.c,
              opacity: card.o * Math.min(1, s * 1.5),
              transform: `translateY(${(1 - s) * -40 * k}px) scale(${0.6 + 0.4 * s})`,
              boxShadow: i === 5 ? `0 0 ${18 * k}px ${C.orange}88` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

function Title({ delay, size = 120 }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 16 } });
  return (
    <div style={{ fontSize: size, fontWeight: 800, letterSpacing: -4, color: C.text, opacity: s, transform: `translateX(${(1 - s) * -40}px)` }}>
      Taal Studio
    </div>
  );
}

function Intro({ lang }) {
  const len = Math.round(2.4 * FPS);
  const { f, fps, leave } = useInOut(len);
  const tag = spring({ frame: f - 22, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: leave, transform: `scale(${interpolate(leave, [0, 1], [1.15, 1])})` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
        <LogoMark size={220} />
        <div>
          <Title delay={10} />
          <div style={{ fontSize: 46, fontWeight: 500, color: C.dim, marginTop: 6, opacity: tag, transform: `translateY(${(1 - tag) * 24}px)` }}>
            {TEXT[lang].tagline}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Outro({ lang }) {
  const { f, fps, enter } = useInOut(Math.round(2.8 * FPS));
  const url = spring({ frame: f - 16, fps, config: { damping: 15 } });
  const line = spring({ frame: f - 24, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40, opacity: enter }}>
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <LogoMark size={150} />
        <Title delay={6} size={96} />
      </div>
      <div
        style={{
          fontSize: 58,
          fontWeight: 700,
          letterSpacing: -1,
          color: "transparent",
          backgroundImage: `linear-gradient(90deg, ${C.blue}, ${C.green} 60%, ${C.orange})`,
          WebkitBackgroundClip: "text",
          opacity: url,
          transform: `translateY(${(1 - url) * 30}px)`,
        }}
      >
        mijntaalstudio.nl
      </div>
      <div style={{ fontSize: 38, fontWeight: 500, color: C.dim, opacity: line }}>{TEXT[lang].outro}</div>
    </AbsoluteFill>
  );
}
