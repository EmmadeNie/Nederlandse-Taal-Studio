// The demo video: recorded screens of Taal Studio, cut short, with a moving
// camera, a 3D tilt, big captions and an intro/outro with the logo.
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { MANIFESTS, MUSIC } from "./manifests";

export const { fontFamily } = loadFont("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });

export const FPS = 30;
const OVERLAP = 10; // frames two segments share, for the transition

export const C = {
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
    theory: ["Eerst kort uitgelegd,", "of juist uitgebreid"],
    linked: ["Met gekoppelde werkwoorden", "en woordenlijsten"],
    conjugate: ["Oefen direct,", "met feedback"],
    fill: ["Invullen in", "hele zinnen"],
    levels: ["Woorden per niveau:", "A0 en A1"],
    rank: ["Nr. 2 van 939 NT2-docenten", "in Rotterdam op Superprof"],
    talk: ["Maak kennis", "met Emma"],
    reviews: ["★★★★★ 5,0", "7 reviews van leerlingen"],
    outro: "Log in en ga verder waar je was.",
    // Marketing reels (socials)
    hook: ["Woon je in Nederland?", "Tijd voor je Nederlands"],
    promoTheory: ["Grammatica,", "helder uitgelegd"],
    promoPerfect: ["Perfectum?", "Dat leer je hier"],
    promoCards: ["Nieuwe woorden,", "kaart voor kaart"],
    quiz: ["Snelle quiz:", "wat vul jij in?"],
    lamak: ["Lessen met Lamak", "zijn nooit saai!"],
    follow: "Volg @mijntaalstudio voor meer",
    voiceA: [
      { from: 0.4, to: 4.6, text: "Dus mocht je dit nou leuk lijken, laat het me weten," },
      { from: 4.7, to: 7.4, text: "dan kunnen we een kennismakingsgesprek inplannen." },
    ],
    voiceB: [
      { from: 0.2, to: 3.3, text: "Hierin wil ik van jou weten: wat is je doel," },
      { from: 3.3, to: 6.4, text: "en binnen hoeveel tijd wil je dat bereiken?" },
      { from: 6.6, to: 11.3, text: "Aan de hand daarvan kijken we hoeveel tijd we nodig hebben" },
      { from: 11.4, to: 14.4, text: "en hoe vaak we afspreken." },
    ],
    promoOutro: "Plan je eerste les · link in bio",
    // What Emma says at the start of the reel (seconds in her clip)
    introSubs: [
      { from: 0.7, to: 3.7, text: "Hoi, ik ben Emma en ik geef les" },
      { from: 3.9, to: 6.8, text: "aan wie snel Nederlands wil leren." },
    ],
  },
  en: {
    tagline: "Learn Dutch, at your level.",
    board: ["Your own", "learning path"],
    plan: ["Your teacher plans", "the next step"],
    theory: ["A short explanation,", "or the full story"],
    linked: ["With linked verbs", "and word lists"],
    conjugate: ["Practise right away,", "with feedback"],
    fill: ["Fill in the gaps", "in whole sentences"],
    levels: ["Words by level:", "A0 and A1"],
    rank: ["No. 2 of 939 Dutch teachers", "in Rotterdam on Superprof"],
    talk: ["Meet", "Emma"],
    reviews: ["★★★★★ 5.0", "7 reviews from students"],
    outro: "Log in and carry on where you left off.",
    // Marketing reels (socials)
    hook: ["Living in the Netherlands?", "Let's get your Dutch going"],
    promoTheory: ["Grammar,", "explained simply"],
    promoPerfect: ["The perfect tense?", "You'll nail it"],
    promoCards: ["New words,", "card by card"],
    quiz: ["Quick quiz:", "can you fill it in?"],
    lamak: ["Lessons with Lamak", "are never boring!"],
    follow: "Follow @mijntaalstudio for more",
    voiceA: [
      { from: 0.4, to: 4.6, text: "So if you like the sound of this, let me know," },
      { from: 4.7, to: 7.4, text: "and we'll plan an introductory chat." },
    ],
    voiceB: [
      { from: 0.2, to: 3.3, text: "In it, I'd like to know: what is your goal," },
      { from: 3.3, to: 6.4, text: "and how soon do you want to reach it?" },
      { from: 6.6, to: 11.3, text: "Based on that, we see how much time we need" },
      { from: 11.4, to: 14.4, text: "and how often we'll meet." },
    ],
    promoOutro: "Plan your first lesson · link in bio",
    introSubs: [
      { from: 0.7, to: 3.7, text: "Hi, I am Emma and I tutor" },
      { from: 3.9, to: 6.8, text: "those who want to learn Dutch quickly." },
    ],
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
    kind: "clip", scene: "board", from: 0.9, to: 7.6, speed: 1.5, caption: "board",
    camera: [
      { t: 0.9, zoom: 1.0 },
      { t: 1.6, zoom: 1.3, look: "drag-done", dx: 120 },
      { t: 5.6, zoom: 1.3, look: "drag-done", dx: 160 },
      { t: 6.3, zoom: 1.75, look: "status", dx: 120, dy: -10 },
      { t: 7.6, zoom: 1.75, look: "status", dx: 120, dy: -10 },
    ],
  },
  {
    kind: "clip", scene: "board", from: 8.0, to: 15.2, speed: 1.6, caption: "plan",
    camera: [
      { t: 8.0, zoom: 1.05 },
      { t: 10.6, zoom: 1.05 },
      { t: 11.4, zoom: 1.35, look: "plan", dx: 140 },
      { t: 15.2, zoom: 1.45, x: 860, y: 470 },
    ],
  },
  {
    // The short explanation, "Lees meer", then the full one.
    kind: "clip", scene: "theory", from: 1.0, to: 12.6, speed: 1.6, caption: "theory",
    camera: [
      // On a phone: as wide as the text in the dialog, a bit closer on "Lees meer".
      { t: 1.0, zoom: 1.0, p: { w: 680 } },
      { t: 2.2, zoom: 1.12, x: 720, y: 450, p: { w: 600 } },
      { t: 4.4, zoom: 1.3, x: 720, y: 470, p: { w: 600 } },
      { t: 7.6, zoom: 1.38, x: 700, y: 520, p: { w: 540 } },
      { t: 8.6, zoom: 1.3, x: 720, y: 430, p: { w: 600 } },
      { t: 12.6, zoom: 1.3, x: 720, y: 450, p: { w: 600 } },
    ],
  },
  {
    // The verbs and the word list that come with the lesson.
    kind: "clip", scene: "theory", from: 12.8, to: 19.6, speed: 1.5, caption: "linked",
    camera: [
      { t: 12.8, zoom: 1.2, x: 720, y: 450, p: { w: 600 } },
      { t: 14.0, zoom: 1.32, x: 720, y: 420, p: { w: 600 } },
      { t: 16.0, zoom: 1.32, x: 720, y: 440, p: { w: 600 } },
      { t: 17.0, zoom: 1.5, x: 720, y: 420, p: { w: 560 } },
      { t: 19.6, zoom: 1.5, x: 720, y: 420, p: { w: 560 } },
    ],
  },
  {
    kind: "clip", scene: "conjugate", from: 1.8, to: 10.6, speed: 2.0, caption: "conjugate",
    camera: [
      { t: 1.8, zoom: 1.2, look: "answer-0", dy: 60 },
      { t: 2.6, zoom: 1.9, look: "answer-0", dy: 70 },
      { t: 10.6, zoom: 1.9, look: "answer-0", dy: 70 },
    ],
  },
  {
    kind: "clip", scene: "fill", from: 1.8, to: 10.6, speed: 1.6, caption: "fill",
    camera: [
      { t: 1.8, zoom: 1.2, look: "answer-0", dy: 60 },
      { t: 2.6, zoom: 1.9, look: "answer-0", dy: 70 },
      { t: 10.6, zoom: 1.9, look: "answer-0", dy: 70 },
    ],
  },
  {
    // The flashcards: the whole screen, no close-up, in every format (exact: no extra zoom for the format).
    kind: "clip", scene: "levels", from: 4.6, to: 12.6, speed: 1.5, caption: "levels", exact: true,
    camera: [{ t: 4.6, zoom: 1.0 }],
  },
  {
    // Superprof search (Dutch, Rotterdam): Emma at place 2. Points are 0–1 of the screenshot.
    kind: "shot", image: "superprof/search.jpg", seconds: 4.0, caption: "rank",
    camera: [
      { t: 0, zoom: 1.0, x: 0.5, y: 0.5 },
      { t: 1.0, zoom: 1.0, x: 0.5, y: 0.5 },
      // The whole card, clear of the caption (in the reel that means not filling the height).
      { t: 2.2, zoom: 1.7, x: 0.5, y: 0.63, l: { zoom: 1.8, y: 0.645 }, p: { w: 540, y: 0.64, fill: false } },
      { t: 4.0, zoom: 1.75, x: 0.5, y: 0.63, l: { zoom: 1.85, y: 0.645 }, p: { w: 520, y: 0.64, fill: false } },
    ],
    highlight: { x: 0.379, y: 0.37, w: 0.242, h: 0.513, at: 1.9, label: "#2" },
    // Other teachers out of focus; the old rate covered.
    masks: [
      { kind: "blur", x: 0.122, y: 0.365, w: 0.25, h: 0.523 },
      { kind: "blur", x: 0.627, y: 0.365, w: 0.25, h: 0.523 },
      { kind: "blur", x: 0.118, y: 0.92, w: 0.764, h: 0.08 },
      { kind: "cover", x: 0.375, y: 0.85, w: 0.045, h: 0.03 },
    ],
  },
  {
    // The recommendations, then in on the first one.
    kind: "shot", image: "superprof/recommendations.jpg", seconds: 5.4, caption: "reviews",
    camera: [
      { t: 0, zoom: 1.0, x: 0.5, y: 0.5 },
      { t: 1.3, zoom: 1.0, x: 0.5, y: 0.5 },
      // On a phone: from the start of the lines, so the review reads.
      { t: 2.6, zoom: 1.85, x: 0.36, y: 0.585, p: { w: 600, x: 0.31 } },
      { t: 5.4, zoom: 1.95, x: 0.36, y: 0.59, p: { w: 580, x: 0.305 } },
    ],
    highlight: { x: 0.086, y: 0.441, w: 0.548, h: 0.288, at: 2.3 },
  },
  // The first seconds of Emma's YouTube video (raw/youtube.mp4), with her own sound.
  { kind: "talk", video: "youtube.mp4", seconds: 7.0, caption: "talk" },
  { kind: "outro", seconds: 2.8 },
];

/**
 * The marketing reel for socials (max ~40 s): Emma first (people stop for a face),
 * then the app in quick cuts, the proof, and a call to action. No Emma at the end.
 */
const byCaption = (caption) => SEGMENTS.find((s) => s.caption === caption);
const PROMO = [
  { kind: "talk", video: "youtube.mp4", seconds: 7.0, caption: "hook", captionTop: true, instant: true, subs: "introSubs" },
  { ...byCaption("board"), from: 0.9, to: 6.3, speed: 1.6 },
  {
    kind: "clip", scene: "theory", from: 1.0, to: 6.6, speed: 1.7, caption: "promoTheory",
    camera: byCaption("theory").camera.slice(0, 3).concat([{ t: 6.6, zoom: 1.3, x: 720, y: 470, p: { w: 600 } }]),
  },
  // Two perfect-tense answers (the third starts at 11.5 s).
  { ...byCaption("conjugate"), to: 9.4, speed: 1.8, caption: "promoPerfect" },
  // Two words, each turned over: an A0 one, then an A1 one.
  { ...byCaption("levels"), from: 5.8, to: 10.9, speed: 1.4, caption: "promoCards", camera: [{ t: 5.8, zoom: 1.0 }] },
  { ...byCaption("rank"), seconds: 3.6 },
  // The first review in full (the login video reads it closer, cut at the sides).
  {
    ...byCaption("reviews"), seconds: 4.4,
    camera: byCaption("reviews").camera.map((k) => (k.p ? { ...k, p: { w: 860, x: 0.36, y: 0.6, fill: false } } : k)),
  },
  { kind: "outro", seconds: 3.0, text: "promoOutro" },
];
// The same reel with a quiz: the perfect-tense card waits, empty, with a countdown.
const PROMO_QUIZ = PROMO.map((s) =>
  s.caption === "promoPerfect" ? { ...s, caption: "quiz", freeze: { at: 2.1, seconds: 2.4 } } : s
);

/**
 * The introduction for YouTube (16:9, ~1.5 min): Emma first, then the board with
 * her own words about the introductory chat in a small frame, the app, a fun
 * moment with her learner Lamak, the proof, and "follow for more".
 * raw/emma_full.mp4 is her whole intro video; raw/lamak.mp4 two takes from the
 * Sinterklaas video.
 */
const VOICE_A = { video: "emma_full.mp4", start: 124.8, seconds: 7.5, subs: "voiceA" };
const VOICE_B = { video: "emma_full.mp4", start: 132.35, seconds: 14.55, subs: "voiceB" };
const INTRO = [
  { kind: "talk", video: "youtube.mp4", seconds: 7.0, caption: "talk", captionTop: true, instant: true, subs: "introSubs" },
  { ...byCaption("board"), speed: (7.6 - 0.9) / VOICE_A.seconds, voice: VOICE_A },
  { ...byCaption("plan"), speed: (15.2 - 8.0) / VOICE_B.seconds, voice: VOICE_B },
  byCaption("theory"),
  byCaption("conjugate"),
  byCaption("fill"),
  byCaption("levels"),
  { kind: "talk", video: "lamak.mp4", seconds: 17.0, caption: "lamak", aspect: 16 / 9 },
  byCaption("rank"),
  byCaption("reviews"),
  { kind: "outro", seconds: 4.0, text: "follow" },
];

// The same introduction as a Short (9:16, under a minute).
const INTRO_SHORT = [
  { kind: "talk", video: "youtube.mp4", seconds: 7.0, caption: "talk", captionTop: true, instant: true, subs: "introSubs" },
  { ...byCaption("board"), speed: (7.6 - 0.9) / VOICE_A.seconds, voice: VOICE_A },
  { ...byCaption("plan"), speed: (15.2 - 8.0) / VOICE_B.seconds, voice: VOICE_B },
  byCaption("conjugate"),
  { kind: "talk", video: "lamak.mp4", seconds: 17.0, caption: "lamak", aspect: 16 / 9 },
  { kind: "outro", seconds: 3.5, text: "follow" },
];

export const CUTS = { demo: SEGMENTS, promo: PROMO, quiz: PROMO_QUIZ, intro: INTRO, introShort: INTRO_SHORT };

const lengthOf = (s) =>
  Math.round((s.kind === "clip" ? (s.to - s.from) / s.speed + (s.freeze?.seconds ?? 0) : s.seconds) * FPS);
export const durationOf = (cut = "demo") => {
  const segs = CUTS[cut];
  return segs.reduce((n, s) => n + lengthOf(s), 0) - OVERLAP * (segs.length - 1);
};

// Where each segment starts: right after the previous one, minus the overlap.
const startsOf = (segs) => segs.reduce((acc, s, i) => [...acc, i ? acc[i - 1] + lengthOf(segs[i - 1]) - OVERLAP : 0], []);

/** Recording time `sec` seconds into a clip; a freeze holds one moment for a while (the quiz). */
function recordingTime(seg, sec) {
  const z = seg.freeze;
  const before = z ? (z.at - seg.from) / seg.speed : Infinity;
  if (sec < before) return seg.from + sec * seg.speed;
  if (sec < before + z.seconds) return z.at;
  return z.at + (sec - before - z.seconds) * seg.speed;
}

/** Music: fades in and out, and goes quiet while someone talks (Emma, a voice-over, Lamak). */
function musicVolume(cut, f) {
  const segs = CUTS[cut];
  const end = durationOf(cut);
  const starts = startsOf(segs);
  const fade = interpolate(f, [0, 15, end - 30, end], [0, 0.8, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let duck = 1;
  segs.forEach((s, i) => {
    if (s.kind !== "talk" && !s.voice) return;
    const a = starts[i];
    const b = a + lengthOf(s);
    const low = s.voice ? 0.12 : 0.08;
    duck = Math.min(duck, interpolate(f, [a - 8, a + 6, b - 14, b], [1, low, low, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  });
  return fade * duck;
}

export function Demo({ lang, cut = "demo" }) {
  const segs = CUTS[cut];
  const starts = startsOf(segs);
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily }}>
      <Backdrop />
      {segs.map((s, i) => {
        const len = lengthOf(s);
        const from = starts[i];
        return (
          <Sequence key={i} from={from} durationInFrames={len}>
            {s.kind === "intro" && <Intro lang={lang} />}
            {s.kind === "outro" && <Outro lang={lang} seg={s} />}
            {s.kind === "shot" && <Shot lang={lang} seg={s} index={i} />}
            {s.kind === "talk" && <Talk lang={lang} seg={s} />}
            {s.kind === "clip" && <Clip lang={lang} seg={s} index={i} />}
          </Sequence>
        );
      })}
      {MUSIC && <Audio src={staticFile("music.mp3")} volume={(f) => musicVolume(cut, f)} />}
    </AbsoluteFill>
  );
}

/** Slow-moving glow in the logo colours. */
export function Backdrop() {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // Each glow makes a whole number of rounds over the video, so the last frame
  // flows into the first one when the video loops.
  const turn = (rounds) => (2 * Math.PI * rounds * f) / durationInFrames;
  const blob = (color, x, y, r, speed, phase) => {
    const rx = Math.max(1, Math.round(durationInFrames / (2 * Math.PI * speed)));
    const ry = Math.max(1, Math.round(durationInFrames / (2 * Math.PI * speed * 1.3)));
    const dx = Math.sin(turn(rx) + phase) * 120;
    const dy = Math.cos(turn(ry) + phase) * 90;
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

export const frameAt = (frames, t) => {
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
/**
 * Landscape (1920×1200, desktop) shows the whole screen floating in the frame.
 * Portrait (1080×1350, phones) shows it bigger, cut off at the sides, with the
 * camera following the action and room for the caption below.
 */
function useLayout() {
  const { width: W, height: H } = useVideoConfig();
  const portrait = H > W;
  // A reel (9:16): bigger screen, caption kept clear of the app's buttons at the bottom.
  const reel = H / W > 1.5;
  // The camera goes closer than the zooms in SEGMENTS say, most on a phone
  // (every zoom × boost), but never narrower than minView screen px across (see cameraKey).
  return portrait
    ? { W, H, portrait, reel, base: reel ? 1.3 : 1.05, boost: reel ? 1.3 : 1.5, minView: 440, cx: W / 2, cy: H * (reel ? 0.4 : 0.43), captionBottom: reel ? 360 : 70 }
    : { W, H, portrait, reel, base: Math.min((W * 0.84) / 1440, (H * 0.84) / 900), minView: 800, cx: W / 2, cy: H / 2, captionBottom: H < 1150 ? 70 : 90 };
}

/**
 * A camera key as this format shows it. On a computer: a bit closer (×1.1 on the
 * whole screen, so it still floats; ×1.2 once zoomed in); `l` on a key overrides
 * that (zoom as shown, x, y). On a phone: closer still;
 * `p` on a key overrides it there: p.w = how many screen px to show across the
 * frame, p.fill = false keeps a zoom just short of the frame's height as it is.
 */
function cameraKey(k, L) {
  if (!L.portrait) {
    const boost = 1.1 + 0.1 * Math.min(Math.max((k.zoom - 1) / 0.3, 0), 1);
    return { ...k, zoom: Math.min(k.zoom * boost, L.W / (L.base * L.minView)), ...k.l };
  }
  const { w, fill: canFill = true, ...p } = k.p ?? {};
  const zoom = w ? L.W / (L.base * w) : Math.min(k.zoom * L.boost, L.W / (L.base * L.minView));
  // Just short of filling the frame's height: fill it, rather than show a thin band below the screen.
  // (A hair over, so focus() keeps the screen's edges outside the frame.)
  const fill = (L.H / (L.base * SCREEN_H)) * 1.002;
  return { ...k, ...p, zoom: canFill && zoom < fill && zoom > fill * 0.9 ? fill : zoom };
}

/** The point of the screen at the frame's centre, so the screen never shows an edge inside the frame where it is bigger than the frame. */
function focus(look, size, s, center, frame) {
  if (size * s <= frame) return size / 2;
  return Math.min(Math.max(look, center / s), size - (frame - center) / s);
}

function Clip({ lang, seg, index }) {
  const { f, fps } = useInOut(lengthOf(seg));
  const m = MANIFESTS[lang][seg.scene];
  const L = useLayout();
  const t = recordingTime(seg, f / fps);
  const cam = cameraAt(seg.exact ? seg.camera : seg.camera.map((k) => cameraKey(k, L)), m.marks, t);
  return (
    <>
      <Screen lang={lang} seg={seg} index={index} cam={cam} src={staticFile(`${lang}/${seg.scene}/${frameAt(m.frames, t)}`)} />
      {seg.freeze && <Countdown start={((seg.freeze.at - seg.from) / seg.speed) * fps} len={seg.freeze.seconds * fps} />}
      {seg.voice && <VoiceOver lang={lang} voice={seg.voice} len={lengthOf(seg)} />}
    </>
  );
}

/** A screenshot (Superprof), with the same camera and a highlight that draws itself. */
function Shot({ lang, seg, index }) {
  const { f, fps } = useInOut(lengthOf(seg));
  const L = useLayout();
  const keys = seg.camera.map((k) => cameraKey(k, L)).map((k) => ({ ...k, x: k.x * SCREEN_W, y: k.y * SCREEN_H }));
  const cam = cameraAt(keys, [], f / fps);
  const hl = seg.highlight;
  const k = hl ? spring({ frame: f - hl.at * fps, fps, config: { damping: 14 } }) : 0;
  const overlay = hl && (
    <div
      style={{
        position: "absolute",
        left: hl.x * SCREEN_W - 8,
        top: hl.y * SCREEN_H - 8,
        width: hl.w * SCREEN_W + 16,
        height: hl.h * SCREEN_H + 16,
        borderRadius: 22,
        border: `5px solid ${C.orange}`,
        boxShadow: `0 0 0 ${(1 - k) * 30}px rgba(240,140,60,${0.35 * k}), 0 0 40px rgba(240,140,60,0.5)`,
        opacity: k,
        transform: `scale(${1.08 - 0.08 * k})`,
      }}
    >
      {hl.label && (
        <div
          style={{
            position: "absolute",
            left: -22,
            top: -22,
            padding: "6px 14px",
            borderRadius: 14,
            background: C.orange,
            color: "#0b0d11",
            fontSize: 30,
            fontWeight: 800,
            transform: `scale(${k})`,
          }}
        >
          {hl.label}
        </div>
      )}
    </div>
  );
  // A blurred copy of the screenshot, cut out where others should be unrecognisable
  // (clip-path moves with the camera; backdrop-filter does not under a transform).
  const masks = (seg.masks ?? []).map((m, i) => {
    const inset = `inset(${m.y * 100}% ${(1 - m.x - m.w) * 100}% ${(1 - m.y - m.h) * 100}% ${m.x * 100}% round 18px)`;
    return m.kind === "blur" ? (
      <Img
        key={i}
        src={staticFile(seg.image)}
        style={{ position: "absolute", inset: 0, width: SCREEN_W, height: SCREEN_H, objectFit: "cover", objectPosition: "top", filter: "blur(16px) saturate(0.7)", clipPath: inset }}
      />
    ) : (
      <div key={i} style={{ position: "absolute", left: m.x * SCREEN_W, top: m.y * SCREEN_H, width: m.w * SCREEN_W, height: m.h * SCREEN_H, background: "#ffffff" }} />
    );
  });
  return <Screen lang={lang} seg={seg} index={index} cam={cam} src={staticFile(seg.image)} overlay={<>{masks}{overlay}</>} />;
}

/** The screen floating in the frame: camera, 3D swing in/out, caption. */
function Screen({ lang, seg, index, cam, src, overlay }) {
  const len = lengthOf(seg);
  const { enter, leave } = useInOut(len);
  const L = useLayout();

  const s = L.base * cam.zoom;
  const fx = focus(cam.x, SCREEN_W, s, L.cx, L.W);
  const fy = focus(cam.y, SCREEN_H, s, L.cy, L.H);

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
            transform: `translate(${L.cx - fx * s}px, ${L.cy - fy * s}px) scale(${s})`,
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 40px 120px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          <Img src={src} style={{ width: SCREEN_W, height: SCREEN_H, display: "block", objectFit: "cover", objectPosition: "top" }} />
          {overlay}
        </div>
      </AbsoluteFill>
      <Caption lines={TEXT[lang][seg.caption]} len={len} />
    </AbsoluteFill>
  );
}

/** Two lines, word by word, bottom left, on a dark glass card. */
function Caption({ lines, len, top = false }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = top ? 0 : 6; // the hook is there from the first frame
  const out = interpolate(f, [len - OVERLAP - 6, len - OVERLAP + 2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const box = spring({ frame: f - start + 2, fps, config: { damping: 16 } });
  const { portrait, captionBottom } = useLayout();
  let n = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: portrait ? 56 : 90,
        ...(top ? { top: portrait ? 70 : 60 } : { bottom: captionBottom }),
        padding: "28px 40px 32px",
        borderRadius: 26,
        background: "rgba(11,13,17,0.72)",
        backdropFilter: "blur(18px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.08)",
        transform: `translateY(${(1 - box) * 40}px) scale(${0.9 + 0.1 * box})`,
        transformOrigin: top ? "left top" : "left bottom",
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
                  color: li === 1 ? "transparent" : /^★+$/.test(w) ? "#f5b301" : C.text,
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
export function LogoMark({ size, delay = 0 }) {
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
  const { portrait } = useLayout();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: leave, transform: `scale(${interpolate(leave, [0, 1], [1.15, 1])})` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 48, flexDirection: portrait ? "column" : "row", textAlign: portrait ? "center" : "left" }}>
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

function Outro({ lang, seg }) {
  const len = lengthOf(seg);
  const { f, fps, enter } = useInOut(len);
  const url = spring({ frame: f - 16, fps, config: { damping: 15 } });
  const line = spring({ frame: f - 24, fps, config: { damping: 16 } });
  const { portrait } = useLayout();
  // The last frames empty the screen to the plain backdrop the intro starts
  // from, so the video loops without a jump.
  const away = interpolate(f, [len - 18, len - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 40,
        opacity: enter * (1 - away),
        transform: `translateY(${away * -40}px) scale(${1 - away * 0.06})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 36, flexDirection: portrait ? "column" : "row" }}>
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
      {seg.text ? (
        // The marketing reels: the call to action as a button.
        <div
          style={{
            fontSize: 46,
            fontWeight: 800,
            color: "#0b0d11",
            background: `linear-gradient(90deg, ${C.blue}, ${C.green})`,
            padding: "22px 44px",
            borderRadius: 999,
            boxShadow: `0 16px 50px rgba(79,156,249,0.35)`,
            opacity: line,
            transform: `scale(${0.85 + 0.15 * line})`,
            textAlign: "center",
          }}
        >
          {TEXT[lang][seg.text]}
        </div>
      ) : (
        <div style={{ fontSize: 38, fontWeight: 500, color: C.dim, opacity: line, textAlign: "center", maxWidth: portrait ? 860 : undefined }}>{TEXT[lang].outro}</div>
      )}
    </AbsoluteFill>
  );
}


/** A piece of video with sound, in a floating frame (wide on a computer, cut taller on a phone). */
function Talk({ lang, seg }) {
  const len = lengthOf(seg);
  const { f, enter: swing, leave } = useInOut(len);
  const enter = seg.instant ? 1 : swing; // the reel's first frame already shows Emma
  const L = useLayout();
  let h = L.reel ? 1300 : L.portrait ? 1180 : Math.min(1000, L.H * 0.86);
  const w = L.portrait ? (seg.aspect ? 1040 : 960) : h * (seg.aspect ?? 1.5);
  if (L.portrait && seg.aspect) h = w / seg.aspect;
  const top = L.portrait && seg.aspect ? (L.H - h) / 2 : L.reel ? 220 : L.portrait ? 50 : (L.H - h) / 2;
  const zoom = interpolate(f, [0, len], [1.0, 1.06]);
  const pop = interpolate(enter, [0, 1], [0.85, 1]) * interpolate(leave, [0, 1], [1.06, 1]);
  return (
    <AbsoluteFill style={{ perspective: 2400, opacity: Math.min(enter * 1.4, 1) * leave }}>
      <div
        style={{
          position: "absolute",
          left: (L.W - w) / 2,
          top,
          width: w,
          height: h,
          borderRadius: 26,
          overflow: "hidden",
          boxShadow: "0 40px 120px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08)",
          transform: `scale(${pop}) rotateY(${interpolate(enter, [0, 1], [-18, 0])}deg)`,
        }}
      >
        <OffthreadVideo
          src={staticFile(seg.video)}
          startFrom={Math.round((seg.start ?? 0) * FPS)}
          volume={(vf) => interpolate(vf, [0, 6, len - 14, len - 2], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: L.portrait ? "36% 30%" : "50% 30%", transform: `scale(${seg.aspect ? 1 : zoom})` }}
        />
      </div>
      <Caption lines={TEXT[lang][seg.caption]} len={len} top={seg.captionTop} />
      {seg.subs && <Subtitles cues={TEXT[lang][seg.subs]} bottom={L.H - top - h + 70} />}
    </AbsoluteFill>
  );
}

/** Emma in a small frame in the corner, talking over a clip, with subtitles. */
function VoiceOver({ lang, voice, len }) {
  const { enter, leave } = useInOut(len);
  const L = useLayout();
  const w = L.portrait ? 420 : 520;
  const h = w / 1.5;
  return (
    <>
      <div
        style={{
          position: "absolute",
          right: L.portrait ? 40 : 70,
          top: L.portrait ? 200 : 60,
          width: w,
          height: h,
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 24px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)",
          opacity: Math.min(enter * 1.4, 1) * leave,
          transform: `scale(${interpolate(enter, [0, 1], [0.8, 1])})`,
          transformOrigin: "right top",
        }}
      >
        <OffthreadVideo
          src={staticFile(voice.video)}
          startFrom={Math.round(voice.start * FPS)}
          volume={(vf) => interpolate(vf, [0, 6, len - 14, len - 2], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%" }}
        />
      </div>
      <VoiceSubs cues={TEXT[lang][voice.subs]} right={L.portrait ? 40 : 70} top={(L.portrait ? 200 : 60) + h + 18} opacity={leave} />
    </>
  );
}

/** The voice-over's subtitles, right under Emma's small frame. */
function VoiceSubs({ cues, right, top, opacity }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const cue = cues.find((c) => t >= c.from && t < c.to);
  if (!cue) return null;
  const fade = Math.min(
    interpolate(t, [cue.from, cue.from + 0.12], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(t, [cue.to - 0.12, cue.to], [1, 0], { extrapolateLeft: "clamp" }),
  );
  return (
    <div style={{ position: "absolute", right, top, width: 820, display: "flex", justifyContent: "flex-end", opacity: fade * opacity }}>
      <span style={{ padding: "12px 24px 14px", borderRadius: 16, background: "rgba(0,0,0,0.78)", color: "#fff", fontSize: 40, fontWeight: 700, lineHeight: 1.25, textAlign: "right", textWrap: "balance" }}>
        {cue.text}
      </span>
    </div>
  );
}

/** What is said, as subtitles: one line at a time, centred near the bottom of the video. */
function Subtitles({ cues, bottom }) {
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = f / fps;
  const cue = cues.find((c) => t >= c.from && t < c.to);
  if (!cue) return null;
  const fade = Math.min(
    interpolate(t, [cue.from, cue.from + 0.12], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(t, [cue.to - 0.12, cue.to], [1, 0], { extrapolateLeft: "clamp" }),
  );
  return (
    <div style={{ position: "absolute", left: 0, width, bottom, display: "flex", justifyContent: "center", opacity: fade }}>
      <span
        style={{
          maxWidth: width - 160,
          padding: "14px 28px 16px",
          borderRadius: 18,
          background: "rgba(0,0,0,0.72)",
          color: "#fff",
          fontSize: 50,
          fontWeight: 700,
          lineHeight: 1.2,
          textAlign: "center",
          textWrap: "balance",
        }}
      >
        {cue.text}
      </span>
    </div>
  );
}

/** The quiz: a ring that runs down 3, 2, 1 while the card waits for an answer. */
function Countdown({ start, len }) {
  const f = useCurrentFrame() - start;
  const { fps } = useVideoConfig();
  const L = useLayout();
  if (f < 0 || f > len + 8) return null;
  const left = Math.max(0, len - f);
  const n = Math.ceil((left / len) * 3);
  const pop = spring({ frame: f, fps, config: { damping: 12 } });
  const out = interpolate(f, [len, len + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tick = spring({ frame: f % Math.round(len / 3), fps, config: { damping: 10, mass: 0.5 } });
  const r = 92;
  const arc = 2 * Math.PI * r;
  return (
    <div
      style={{
        position: "absolute",
        left: L.cx - 120,
        top: L.cy + (L.portrait ? 280 : 250),
        width: 240,
        height: 240,
        opacity: pop * out,
        transform: `scale(${0.6 + 0.4 * pop})`,
      }}
    >
      <svg width={240} height={240} style={{ position: "absolute", inset: 0 }}>
        <circle cx={120} cy={120} r={r + 18} fill="rgba(11,13,17,0.78)" />
        <circle cx={120} cy={120} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={12} />
        <circle
          cx={120}
          cy={120}
          r={r}
          fill="none"
          stroke={C.orange}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={arc}
          strokeDashoffset={arc * (1 - left / len)}
          transform="rotate(-90 120 120)"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 110,
          fontWeight: 800,
          color: C.text,
          transform: `scale(${1.25 - 0.25 * tick})`,
        }}
      >
        {n || "✓"}
      </div>
    </div>
  );
}
