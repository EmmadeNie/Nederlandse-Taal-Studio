// "Heb or ben? 🏠": a snappy ~25 s Instagram Reel for the perfect tense, hebben or zijn with verbs of
// movement ("het perfectum huis"). Four rounds; in each, an emoji moves from the first frame: it rides
// in circles (just moving, how long? → hebben) or into a house / onto the beach (a destination,
// where to? → zijn). Ticking 3-2-1, then the right word turns green with a ding, the wrong one shakes
// with a buzz, and the rule for that round pops up. The look is the long lesson's; `music` adds
// A Stroll (YouTube) or leaves it out (Instagram, where Emma picks a song in the app). Forms come
// from the app's data. Sounds: raw/teaser_tick.wav, teaser_buzz.wav, teaser_ding.wav; Emma's end line
// raw/imperfectum_teaser_end_voice.wav; her intro (when recorded) raw/perfectum_teaser_voice.wav.
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, C, LogoMark, fontFamily } from "./Demo";
import { Rich, card } from "./LessonReel";
import { auxForm, verb } from "./lessons";

export const PERF_TEASER_FPS = 30;
const sec = (s) => Math.round(s * PERF_TEASER_FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
const RED = "#ff5a4f";

const START = 0.2; // the 3-2-1 runs from here…
const REVEAL = 2.4; // …to the answer (a round's own `reveal` overrides it)
const AFTER = 2.6; // the rule after the answer
// Emma's intro over the first round, once recorded: { len } of raw/perfectum_teaser_voice.wav
// (that round's 3-2-1 then runs in her last 2 s). null: no intro yet.
const VOICE = null;
const VOICE_AT = 0.3;
// Emma on the end card, the same line as the imperfectum teaser: "Check out my YouTube channel for the full lesson."
const END_VOICE_AT = 0.4;
const END_VOICE_LEN = 2.78;
const END = END_VOICE_AT + END_VOICE_LEN + 0.8;

// dest: the emoji it moves to (a destination → zijn); none: it goes round in circles (→ hebben).
// flip: emoji that face left by default, so they move to the right.
const ROUNDS = [
  { verb: "word.fietsen", aux: "hebben", text: "Ik ___ een uur [p].", en: "I cycled for an hour.", emoji: "🚲" },
  { verb: "word.fietsen", aux: "zijn", text: "Ik ___ naar huis [p].", en: "I cycled home.", emoji: "🚲", dest: "🏠" },
  { verb: "word.wandelen", aux: "zijn", text: "Ik ___ naar het strand [p].", en: "I walked to the beach.", emoji: "🚶", flip: true, dest: "🏖️" },
  { verb: "word.zwemmen", aux: "hebben", text: "Ik ___ een uur [p].", en: "I swam for an hour.", emoji: "🏊", flip: true },
];
const T = {
  question: "Heb or ben? 🤔",
  hebben: "Just moving (how long?) → *hebben*",
  zijn: "Moving to a place (where to?) → *zijn*",
  end: ["4/4? 🔥", "You've got *hebben* and *zijn*!", "Full lesson on YouTube", "@mijntaalstudio"],
};

const ROUND1 = VOICE ? { start: VOICE_AT + VOICE.len - 1.8, reveal: VOICE_AT + VOICE.len + 0.4 } : {};
const revealOf = (i) => (i === 0 && ROUND1.reveal) || REVEAL;
const startOf3 = (i) => (i === 0 && ROUND1.start) || START;
const lenOf = (i) => revealOf(i) + AFTER;
const startOf = (i) => ROUNDS.slice(0, i).reduce((t, _, k) => t + lenOf(k), 0);
export const perfTeaserDuration = () => sec(startOf(ROUNDS.length) + END);

const pop = (f, fps, at, damping = 13) => spring({ frame: f - at, fps, config: { damping } });

/** The moving emoji: round and round (no destination), or along a path into its destination. */
function Motion({ r, reveal }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const W = 920;
  const H = 280;
  const size = 160;
  const face = r.flip ? "scaleX(-1)" : "none";
  if (!r.dest) {
    const a = f * 0.09;
    const x = W / 2 + Math.cos(a) * 300 - size / 2;
    const y = H / 2 + Math.sin(a) * 70 - size / 2;
    // Moving right on the near side of the loop, left on the far side.
    const right = Math.sin(a) > 0 ? -1 : 1;
    return (
      <div style={{ position: "relative", width: W, height: H }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <ellipse cx={W / 2} cy={H / 2} rx={300} ry={70} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={5} strokeDasharray="14 14" />
        </svg>
        <div style={{ position: "absolute", left: x, top: y, fontSize: size, lineHeight: 1, transform: `${r.flip ? "scaleX(-1)" : ""} scaleX(${right})` }}>{r.emoji}</div>
      </div>
    );
  }
  const arrive = Math.min(reveal - 4, sec(1.6));
  const p = interpolate(f, [4, arrive], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 2) });
  const x0 = 20;
  const x1 = W - 330;
  const there = pop(f, fps, arrive, 8);
  const bump = f >= arrive ? Math.sin(Math.min(1, there) * Math.PI) : 0;
  return (
    <div style={{ position: "relative", width: W, height: H }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <line x1={x0 + size / 2} y1={H / 2} x2={W - 220} y2={H / 2} stroke="rgba(255,255,255,0.18)" strokeWidth={5} strokeDasharray="14 14" />
      </svg>
      <div style={{ position: "absolute", right: 20, top: H / 2 - 100, fontSize: 200, lineHeight: 1, transform: `scale(${1 + 0.22 * bump})` }}>{r.dest}</div>
      <div style={{ position: "absolute", left: x0 + (x1 - x0) * p, top: H / 2 - size / 2, fontSize: size, lineHeight: 1, opacity: 1 - interpolate(f, [arrive, arrive + 8], [0, 0.85], clamp), transform: face }}>{r.emoji}</div>
    </div>
  );
}

function Round({ r, i }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = i + 1;
  const reveal = sec(revealOf(i));
  const s0 = sec(startOf3(i));
  const shown = f >= reveal;
  const ok = pop(f, fps, reveal, 9);
  const shake = shown && f < reveal + 14 ? Math.sin((f - reveal) * 1.6) * 16 * (1 - (f - reveal) / 14) : 0;
  const ring = interpolate(f, [s0, reveal], [1, 0], clamp);
  const left = Math.min(3, Math.max(1, Math.ceil(((reveal - f) / (reveal - s0)) * 3)));
  const inn = n === 1 ? 1 : pop(f, fps, 0, 12);
  const rule = pop(f, fps, reveal + 10);
  const part = verb(r.verb).participle;
  const right = auxForm(r.aux, "ik");
  const [before, after] = r.text.split("___");
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 240, bottom: 360, display: "flex", flexDirection: "column", justifyContent: "center", opacity: inn }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 34 }}>
        <span style={{ fontSize: 72, fontWeight: 800, letterSpacing: -1.5 }}>{T.question}</span>
        <span style={{ fontSize: 44, fontWeight: 800, color: C.dim }}>
          {n}/{ROUNDS.length}
        </span>
      </div>
      <div style={{ ...card, padding: "34px 44px", transform: `translateY(${(1 - inn) * 40}px)` }}>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.25, letterSpacing: -1.5 }}>
          {before}
          <span style={{ display: "inline-block", minWidth: 150, textAlign: "center", padding: "0 10px", borderRadius: 16, borderBottom: shown ? "none" : `7px solid ${C.orange}`, background: shown ? "rgba(240,140,60,0.16)" : "transparent", color: C.orange }}>
            <span style={{ display: "inline-block", transform: `scale(${ok})`, opacity: ok }}>{right}</span>
          </span>
          {after.split("[p]")[0]}
          <span style={{ color: C.green }}>{part}</span>
          {after.split("[p]")[1]}
        </div>
        <div style={{ fontSize: 38, color: C.dim, marginTop: 10 }}>{r.en}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 30 }}>
        <Motion r={r} reveal={reveal} />
      </div>
      <div style={{ display: "flex", gap: 30, marginTop: 20 }}>
        {["heb", "ben"].map((w) => {
          const isRight = w === right;
          const state = !shown ? "idle" : isRight ? "right" : "wrong";
          const bounce = !shown ? 1 + 0.03 * Math.sin(f * 0.35 + (w === "ben" ? Math.PI : 0)) : 1;
          return (
            <div
              key={w}
              style={{
                ...card,
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                padding: "26px 0",
                border: `3px solid ${state === "right" ? C.green : state === "wrong" ? RED : "rgba(255,255,255,0.12)"}`,
                background: state === "right" ? "rgba(47,210,122,0.14)" : "rgba(255,255,255,0.05)",
                opacity: state === "wrong" ? 0.5 : 1,
                transform: `translateX(${state === "wrong" ? shake : 0}px) scale(${(state === "right" ? 1 + 0.06 * ok : 1) * bounce})`,
              }}
            >
              <span style={{ fontSize: 100, fontWeight: 800, fontStyle: "italic", color: state === "right" ? C.green : state === "wrong" ? RED : C.text }}>{w}</span>
              {shown && <span style={{ fontSize: 70 }}>{state === "right" ? "✅" : "❌"}</span>}
            </div>
          );
        })}
      </div>
      <div style={{ height: 210, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {!shown ? (
          <div style={{ position: "relative", width: 150, height: 150 }}>
            <svg width={150} height={150} style={{ position: "absolute", inset: 0 }}>
              <circle cx={75} cy={75} r={62} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={11} />
              <circle cx={75} cy={75} r={62} fill="none" stroke={C.orange} strokeWidth={11} strokeLinecap="round" strokeDasharray={2 * Math.PI * 62} strokeDashoffset={2 * Math.PI * 62 * (1 - ring)} transform="rotate(-90 75 75)" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 74, fontWeight: 800 }}>{left}</div>
          </div>
        ) : (
          <div style={{ fontSize: 46, fontWeight: 800, color: C.green, textAlign: "center", lineHeight: 1.3, opacity: rule, transform: `scale(${0.8 + 0.2 * rule})` }}>
            {r.aux === "zijn" ? "🏠 " : "🔄 "}
            <Rich text={r.aux === "zijn" ? T.zijn : T.hebben} />
          </div>
        )}
      </div>
    </div>
  );
}

function End() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, fps, 0, 9);
  const b = pop(f, fps, 8);
  const c = pop(f, fps, 16, 10);
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 250, bottom: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div style={{ fontSize: 190, fontWeight: 800, letterSpacing: -5, transform: `scale(${0.5 + 0.5 * a})`, opacity: a }}>{T.end[0]}</div>
      <div style={{ fontSize: 60, fontWeight: 800, marginTop: 20, opacity: b, transform: `translateY(${(1 - b) * 20}px)` }}>
        <Rich text={T.end[1]} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 26, marginTop: 70, opacity: c, transform: `scale(${0.8 + 0.2 * c})` }}>
        <LogoMark size={120} delay={-60} />
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 44, fontWeight: 700, color: C.dim }}>▶️ {T.end[2]}</div>
          <div style={{ fontSize: 64, fontWeight: 800, color: RED }}>{T.end[3]}</div>
        </div>
      </div>
    </div>
  );
}

/** music: a track from raw/music/ (YouTube Audio Library, MUSIC.md), or false (Instagram, where a song is added in the app). */
export function PerfectumTeaser({ music = "music/a-stroll.mp3" }) {
  const total = perfTeaserDuration();
  const endAt = startOf(ROUNDS.length);
  const vEnd = VOICE ? VOICE_AT + VOICE.len : 0;
  // Music: soft under Emma's intro (if any) and her end line, otherwise 0.4.
  const level = (fr) =>
    VOICE
      ? interpolate(fr, [0, sec(VOICE_AT), sec(vEnd), sec(vEnd + 0.8), sec(endAt), sec(endAt + END_VOICE_AT), total - 10, total], [0.15, 0.06, 0.06, 0.4, 0.4, 0.08, 0.08, 0], clamp)
      : interpolate(fr, [0, sec(endAt), sec(endAt + END_VOICE_AT), total - 10, total], [0.4, 0.4, 0.08, 0.08, 0], clamp);
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily, color: C.text }}>
      <Backdrop />
      {music && <Audio src={staticFile(music)} volume={level} />}
      {VOICE && (
        <Sequence from={sec(VOICE_AT)}>
          <Audio src={staticFile("perfectum_teaser_voice.wav")} />
        </Sequence>
      )}
      {ROUNDS.map((r, i) => (
        <Sequence key={i} from={sec(startOf(i))} durationInFrames={sec(lenOf(i))}>
          <Round r={r} i={i} />
          {[0, 1, 2].map((k) => startOf3(i) + (k * (revealOf(i) - startOf3(i))) / 3).map((t) => (
            <Sequence key={t} from={sec(t)} durationInFrames={sec(0.2)}>
              <Audio src={staticFile("teaser_tick.wav")} />
            </Sequence>
          ))}
          <Sequence from={sec(revealOf(i))}>
            <Audio src={staticFile("teaser_ding.wav")} />
          </Sequence>
          <Sequence from={sec(revealOf(i)) + 4}>
            <Audio src={staticFile("teaser_buzz.wav")} volume={0.7} />
          </Sequence>
        </Sequence>
      ))}
      <Sequence from={sec(endAt)}>
        <End />
        <Sequence from={sec(END_VOICE_AT)}>
          <Audio src={staticFile("imperfectum_teaser_end_voice.wav")} />
        </Sequence>
      </Sequence>
    </AbsoluteFill>
  );
}
