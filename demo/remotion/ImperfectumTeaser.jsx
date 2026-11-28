// A snappy ~36 s Instagram Reel for the past tense: "Which one is right?" Five quick rounds
// (werken, bellen, spelen, reizen, surfen), each with a ticking 3-2-1, then the right form turns
// green with a ding and the wrong one shakes with a buzz, and a quick animation shows why: the
// infinitive loses -en, the last letter lights up, it's looked up in "soft ketchup" (-te / -de), and
// where the spelling changes (spel → speel, reiz → reis) that follows. Something moves from the first
// frame (Instagram strangers leave after ~5 s of a still screen). The look and the music (A Stroll)
// are the long lesson's; Emma's voice asks the question over the first round. Forms come from the app's data, except surfen (not in the app yet).
// Sounds: raw/teaser_tick.wav, raw/teaser_buzz.wav (imperfectum/teaser_sfx.py), raw/teaser_ding.wav.
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, C, LogoMark, fontFamily } from "./Demo";
import { Rich, card } from "./LessonReel";
import { KetchupMini } from "./LessonVideoPerfect";
import { KOFSCHIP, verb } from "./lessons";

export const IMPF_TEASER_FPS = 30;
const sec = (s) => Math.round(s * IMPF_TEASER_FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
const MARKER = "#ffd84a";
const RED = "#ff5a4f";

const START = 0.2; // the 3-2-1 runs from here…
const REVEAL = 2.2; // …to the answer (a round's own `reveal` overrides it)
const AFTER = 2.8; // the explanation after the answer
// Emma on the end card (26 Nov, "26 Nov at 18-47.m4a", cut [1.0, 3.78] s, -19 dB):
// "Check out my YouTube channel for the full lesson." raw/imperfectum_teaser_end_voice.wav.
const END_VOICE_AT = 0.4; // into the end card
const END_VOICE_LEN = 2.78;
const END = END_VOICE_AT + END_VOICE_LEN + 0.8;
// Emma's intro over the first round (26 Nov, Google Drive "26 Nov at 18-52.m4a", cut [0.8, 7.92] s,
// levelled to -19 dB): "So you've been living in the Netherlands for quite some time now. Feel like a
// real Dutchie? Let's see if you can get these right." raw/imperfectum_teaser_voice.wav. That round's
// 3-2-1 runs in the last 2 s of her voice, the answer right after it.
const VOICE_AT = 0.3;
const VOICE_LEN = 7.12;
// wrongFirst: the wrong form on top (so the right answer isn't always in the same place).
// local: a verb the app doesn't have yet, with its (regular) forms.
const ROUNDS = [
  { verb: "word.werken", wrongFirst: true, start: VOICE_AT + VOICE_LEN - 1.8, reveal: VOICE_AT + VOICE_LEN + 0.4 },
  { verb: "word.bellen", wrongFirst: false },
  { verb: "word.spelen", wrongFirst: true },
  { verb: "word.reizen", wrongFirst: false },
  { local: { nl: "surfen", stem: "surf" }, wrongFirst: true },
];
const T = {
  question: "Which one is right? 🤔",
  spelling: "spelling:",
  end: ["5/5? 🔥", "You've got the Dutch past tense!", "Full lesson on YouTube", "@mijntaalstudio"],
};

const revealOf = (r) => r.reveal ?? REVEAL;
const startOf3 = (r) => r.start ?? START; // where a round's 3-2-1 starts
const lenOf = (r) => revealOf(r) + AFTER;
const startOf = (i) => ROUNDS.slice(0, i).reduce((t, r) => t + lenOf(r), 0);
export const impfTeaserDuration = () => sec(startOf(ROUNDS.length) + END);

const pop = (f, fps, at, damping = 13) => spring({ frame: f - at, fps, config: { damping } });

/**
 * A round's verb: the infinitive, the verb without -en (raw, before any spelling change), its last
 * letter, the stem (spelling fixed) and the right ending: look at raw's last letter, not the stem's
 * (reiz: z → -de, although the stem is reis).
 */
function partsOf(r) {
  const nl = r.local ? r.local.nl : verb(r.verb).nl;
  const stem = r.local ? r.local.stem : verb(r.verb).stem;
  const raw = nl.slice(0, -2);
  const last = raw.endsWith("ch") ? "ch" : raw.slice(-1);
  const end = KOFSCHIP.includes(last) ? "te" : "de";
  if (!r.local && verb(r.verb).past.singular !== stem + end) throw new Error(`${nl}: ${verb(r.verb).past.singular} isn't ${stem}${end}`);
  return { nl, raw, last, stem, end, wrong: end === "te" ? "de" : "te" };
}

function Round({ r, n }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { raw, last, stem, end, wrong } = partsOf(r);
  const reveal = sec(revealOf(r));
  const shown = f >= reveal;
  const ok = pop(f, fps, reveal, 9);
  const shake = shown && f < reveal + 14 ? Math.sin((f - reveal) * 1.6) * 16 * (1 - (f - reveal) / 14) : 0;
  const s0 = sec(startOf3(r));
  const ring = interpolate(f, [s0, reveal], [1, 0], clamp);
  const left = Math.min(3, Math.max(1, Math.ceil(((reveal - f) / (reveal - s0)) * 3)));
  const options = r.wrongFirst ? [wrong, end] : [end, wrong];
  // The first round is complete on frame 0; the next ones slide in fast.
  const inn = n === 1 ? 1 : pop(f, fps, 0, 12);
  // Why: -en off, the last letter lights up, soft ketchup, then the spelling (if it changes).
  const e0 = reveal + 6;
  const why = pop(f, fps, e0);
  const strike = interpolate(f, [e0 + 4, e0 + 12], [0, 1], clamp);
  const lit = pop(f, fps, e0 + 14, 9);
  const bump = Math.sin(Math.min(1, lit) * Math.PI);
  const look = pop(f, fps, e0 + 24, 9);
  const conclude = pop(f, fps, e0 + 32);
  const spell = raw !== stem ? pop(f, fps, e0 + 44) : 0;
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 250, bottom: 360, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 40 }}>
        <span style={{ fontSize: 68, fontWeight: 800, letterSpacing: -1.5 }}>{T.question}</span>
        <span style={{ fontSize: 44, fontWeight: 800, color: C.dim }}>
          {n}/{ROUNDS.length}
        </span>
      </div>
      {options.map((ending, i) => {
        const isRight = ending === end;
        const p = n === 1 ? 1 : pop(f, fps, i * 3, 12);
        const bounce = !shown ? 1 + 0.025 * Math.sin(f * 0.35 + i * Math.PI) : 1;
        const state = !shown ? "idle" : isRight ? "right" : "wrong";
        return (
          <div
            key={ending}
            style={{
              ...card,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "30px 46px",
              marginTop: i ? 26 : 0,
              border: `3px solid ${state === "right" ? C.green : state === "wrong" ? RED : "rgba(255,255,255,0.12)"}`,
              background: state === "right" ? "rgba(47,210,122,0.14)" : "rgba(255,255,255,0.05)",
              opacity: (state === "wrong" ? 0.5 : 1) * p * inn,
              transform: `translateX(${(1 - p * inn) * (i ? 80 : -80) + (state === "wrong" ? shake : 0)}px) scale(${(state === "right" ? 1 + 0.05 * ok : 1) * bounce})`,
            }}
          >
            <span style={{ fontSize: 112, fontWeight: 800, letterSpacing: -3 }}>
              <span style={{ color: C.dim, fontWeight: 700 }}>Ik </span>
              {stem}
              <span style={{ color: state === "right" ? C.green : state === "wrong" ? RED : C.text }}>{ending}</span>
            </span>
            <span style={{ fontSize: 92, opacity: shown ? 1 : 0 }}>{state === "right" ? "✅" : "❌"}</span>
          </div>
        );
      })}
      <div style={{ height: 420, marginTop: 34, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {!shown ? (
          <div style={{ position: "relative", width: 170, height: 170 }}>
            <svg width={170} height={170} style={{ position: "absolute", inset: 0 }}>
              <circle cx={85} cy={85} r={70} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={12} />
              <circle cx={85} cy={85} r={70} fill="none" stroke={C.orange} strokeWidth={12} strokeLinecap="round" strokeDasharray={2 * Math.PI * 70} strokeDashoffset={2 * Math.PI * 70 * (1 - ring)} transform="rotate(-90 85 85)" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 84, fontWeight: 800 }}>{left}</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: why }}>
            {/* werken → werk, the last letter lit */}
            <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -2, whiteSpace: "nowrap" }}>
              {raw.slice(0, -last.length)}
              <span style={{ display: "inline-block", color: lit > 0.3 ? C.bg : C.text, background: `rgba(255,216,74,${lit})`, borderRadius: 14, padding: "0 6px", margin: "0 -6px", transform: `translateY(${-18 * bump}px) scale(${1 + 0.25 * bump})` }}>{last}</span>
              <span style={{ position: "relative", color: C.orange, opacity: 1 - strike * 0.7 }}>
                en
                <span style={{ position: "absolute", left: -4, top: "52%", height: 8, borderRadius: 4, width: `calc(${strike * 100}% + 8px)`, background: C.orange }} />
              </span>
            </div>
            {/* soft ketchup → -te / -de */}
            <div style={{ display: "flex", alignItems: "center", gap: 26, opacity: Math.min(1, look * 1.4) }}>
              <KetchupMini letter={last} size={60} p={look} />
              <span style={{ fontSize: 64, fontWeight: 800, color: C.green, opacity: conclude, transform: `scale(${0.6 + 0.4 * conclude})`, display: "inline-block" }}>
                → <em>-{end}</em>
              </span>
            </div>
            {/* spel → speel, reiz → reis */}
            {raw !== stem && (
              <div style={{ fontSize: 46, fontWeight: 700, color: C.dim, opacity: spell, transform: `translateY(${(1 - spell) * 14}px)` }}>
                {T.spelling} <span style={{ color: C.text }}>{raw}</span> → <span style={{ color: MARKER }}>{stem}</span>
                <span style={{ color: C.green }}>{end}</span>
              </div>
            )}
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
      <div style={{ fontSize: 60, fontWeight: 800, marginTop: 20, opacity: b, transform: `translateY(${(1 - b) * 20}px)` }}>{T.end[1]}</div>
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

export function ImperfectumTeaser() {
  const total = impfTeaserDuration();
  // Music: soft under Emma, a bit louder after her.
  const endAt = startOf(ROUNDS.length);
  const music = (fr) =>
    interpolate(
      fr,
      [0, sec(VOICE_AT), sec(VOICE_AT + VOICE_LEN), sec(VOICE_AT + VOICE_LEN + 0.8), sec(endAt), sec(endAt + END_VOICE_AT), total - 10, total],
      [0.15, 0.06, 0.06, 0.4, 0.4, 0.08, 0.08, 0],
      clamp,
    );
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily, color: C.text }}>
      <Backdrop />
      <Audio src={staticFile("music/a-stroll.mp3")} volume={music} />
      <Sequence from={sec(VOICE_AT)}>
        <Audio src={staticFile("imperfectum_teaser_voice.wav")} />
      </Sequence>
      {ROUNDS.map((r, i) => (
        <Sequence key={i} from={sec(startOf(i))} durationInFrames={sec(lenOf(r))}>
          <Round r={r} n={i + 1} />
          {[0, 1, 2].map((k) => startOf3(r) + (k * (revealOf(r) - startOf3(r))) / 3).map((t) => (
            <Sequence key={t} from={sec(t)} durationInFrames={sec(0.2)}>
              <Audio src={staticFile("teaser_tick.wav")} />
            </Sequence>
          ))}
          <Sequence from={sec(revealOf(r))}>
            <Audio src={staticFile("teaser_ding.wav")} />
          </Sequence>
          <Sequence from={sec(revealOf(r)) + 4}>
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
