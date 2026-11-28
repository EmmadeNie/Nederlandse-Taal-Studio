// A ~30 s teaser for the separable verbs (9:16, EN, Instagram Reel / YouTube Short), in the light look
// of the separable-verbs lesson. Emma's voice from 0.6 s over a sentence that is on screen from frame 0
// ("Have you ever seen some random preposition at the end of this sentence…"), the particle jumps back
// to its verb, then three quick exercises and "Made a lot of mistakes? Check my profile".
// Audio: raw/teaser_sep_voice.wav and raw/teaser_ding.wav (scheidbaar_teaser/make_audio.py), music
// Tomorrow's Light (the lesson's track).
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoMark, fontFamily } from "./Demo";
import { Rich } from "./LessonReel";
import { L } from "./Carousel";
import { RED } from "./Sinterklaas";

export const TEASER_SEP_FPS = 30;
const sec = (s) => Math.round(s * TEASER_SEP_FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
const BLUE = L.perfect;
const GREEN = L.past;
const card = { background: L.card, border: `2px solid ${L.line}`, borderRadius: 32, boxShadow: "0 10px 30px rgba(11,13,17,0.06)" };

// Emma's line, cut from the recording at 1.1 s; times below are in the video.
const VOICE_AT = 0.6;
const VOICE_LEN = 11.85;
const rec = (t) => VOICE_AT + t - 1.1; // a time in the recording → in the video
const WHAT_AT = rec(7.9); // "what is it doing here?"
const BELONGS_AT = rec(10.1); // "Chances are it actually belongs to the verb."
const HOOK = 13.6;
const Q_LEN = 4.0; // a question: countdown, answer, a moment to read
const Q_REVEAL = 2.8;
const END = 4.2;

const QUIZ = [
  { q: "Gaan jullie vanavond ___?", inf: ["uit", "gaan"], ans: ["uit"], en: "Are you going out tonight?" },
  { q: "Wij ___ een tas ___.", inf: ["mee", "nemen"], ans: ["nemen", "mee"], en: "We're taking a bag with us." },
  { q: "Ik wil mijn kamer ___.", inf: ["op", "ruimen"], ans: ["opruimen"], en: "I want to tidy my room." },
];
const T = {
  kicker: "Dutch separable verbs",
  sentence: { before: "Ik ", verb: "bel", middle: " je ", part: "op", after: "." },
  en: "I'll call you.",
  belongs: ["*op* + *bellen*", "= *opbellen*", "to call (someone)"],
  quiz: "Your turn! ✏️",
  end: ["Made a lot of mistakes? 🙈", "Check my profile for the explanation 👉", "@mijntaalstudio"],
};

// The arrow from op (≈ x 600) back to bel (≈ x 300), in the card's 900-wide box.
const ARROW = "M 600 70 C 540 -50, 370 -50, 300 55";
const HEAD = "300 55";

export const teaserSepDuration = () => sec(HOOK + QUIZ.length * Q_LEN + END);

const pop = (f, fps, at, damping = 14) => spring({ frame: f - at, fps, config: { damping } });
const lift = (p, px = 30) => ({ opacity: p, transform: `translateY(${(1 - p) * px}px)` });
const Body = ({ children }) => (
  <div style={{ position: "absolute", left: 80, right: 80, top: 230, bottom: 400, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>
);

/** An infinitive with the particle red and the verb blue: opbellen. */
const Inf = ({ inf }) => (
  <span>
    <span style={{ color: RED }}>{inf[0]}</span>
    <span style={{ color: BLUE }}>{inf[1]}</span>
  </span>
);

/** "Ik bel je morgen op." from frame 0; op wiggles at "what is it doing here?", then jumps back to bel. */
function Hook() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = T.sentence;
  const what = f - sec(WHAT_AT);
  const wiggle = what > 0 && what < sec(1.4) ? Math.sin(what * 0.9) * 10 * (1 - what / sec(1.4)) : 0;
  const q = pop(f, fps, sec(WHAT_AT), 9) * (1 - pop(f, fps, sec(BELONGS_AT), 20));
  const arrow = interpolate(f, [sec(BELONGS_AT) + 6, sec(BELONGS_AT) + 26], [0, 1], clamp);
  const verbLit = pop(f, fps, sec(BELONGS_AT) + 22, 10);
  const sum = pop(f, fps, sec(BELONGS_AT) + 40);
  const sumB = pop(f, fps, sec(BELONGS_AT) + 56);
  return (
    <Body>
      <div style={{ fontSize: 40, fontWeight: 800, color: L.dim, letterSpacing: 3, textTransform: "uppercase", marginBottom: 110 }}>{T.kicker}</div>
      <div style={{ ...card, position: "relative", padding: "70px 56px 56px", borderLeft: `14px solid ${RED}` }}>
        <div style={{ fontSize: 130, fontWeight: 800, letterSpacing: -3, lineHeight: 1.15, whiteSpace: "nowrap" }}>
          {s.before}
          <span style={{ color: verbLit > 0.05 ? BLUE : L.text, display: "inline-block", transform: `scale(${1 + 0.18 * Math.sin(Math.min(1, verbLit) * Math.PI)})` }}>{s.verb}</span>
          {s.middle}
          <span style={{ position: "relative", display: "inline-block", color: RED, transform: `rotate(${wiggle}deg)` }}>
            {s.part}
            <span style={{ position: "absolute", left: "50%", top: -95, fontSize: 90, color: RED, opacity: q, transform: `translateX(-50%) scale(${0.5 + 0.5 * q})` }}>?</span>
          </span>
          {s.after}
        </div>
        <div style={{ fontSize: 40, color: L.dim, marginTop: 14 }}>{T.en}</div>
        {/* The arrow from op back to bel. */}
        <svg width="100%" height="120" viewBox="0 0 900 120" preserveAspectRatio="none" style={{ position: "absolute", left: 0, top: -40, overflow: "visible" }}>
          <path d={ARROW} fill="none" stroke={RED} strokeWidth="9" strokeLinecap="round" strokeDasharray="700" strokeDashoffset={700 * (1 - arrow)} />
          {arrow > 0.95 && <path d={`M ${HEAD} l -6 -34 M ${HEAD} l 30 -16`} stroke={RED} strokeWidth="9" strokeLinecap="round" fill="none" />}
        </svg>
      </div>
      <div style={{ ...card, marginTop: 50, padding: "36px 50px", ...lift(sum) }}>
        <div style={{ fontSize: 80, fontWeight: 800, lineHeight: 1.2 }}>
          <span style={{ color: RED }}>op</span> + <span style={{ color: BLUE }}>bellen</span>{" "}
          <span style={{ opacity: sumB }}>
            = <Inf inf={["op", "bellen"]} />
          </span>
        </div>
        <div style={{ fontSize: 42, color: L.dim, marginTop: 10, opacity: sumB }}>{T.belongs[2]}</div>
      </div>
    </Body>
  );
}

/** One exercise: the sentence with gaps, the infinitive as a hint, 3-2-1, then the answer. */
function Question({ item, n }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = sec(Q_REVEAL);
  const inn = pop(f, fps, 0);
  const r = pop(f, fps, reveal, 11);
  const left = Math.max(1, Math.ceil(((reveal - f) / (reveal - sec(0.3))) * 3));
  const ring = interpolate(f, [sec(0.3), reveal], [1, 0], clamp);
  const pieces = item.q.split("___");
  const colourOf = (a) => (a === item.inf[0] ? RED : a === item.inf.join("") ? null : BLUE);
  return (
    <Body>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, ...lift(inn) }}>
        <span style={{ fontSize: 58, fontWeight: 800, color: L.accent }}>{T.quiz}</span>
        <span style={{ fontSize: 40, fontWeight: 800, color: L.dim }}>{n} / {QUIZ.length}</span>
      </div>
      <div style={{ ...card, padding: "60px 50px", transform: `scale(${0.94 + 0.06 * inn})` }}>
        <div style={{ fontSize: 80, fontWeight: 800, lineHeight: 1.35 }}>
          {pieces.map((piece, k) => (
            <span key={k}>
              {piece}
              {k < item.ans.length && (
                <span style={{ display: "inline-block", minWidth: 170, padding: "0 14px", margin: "0 4px", borderRadius: 18, borderBottom: r > 0.05 ? "none" : `7px solid ${L.accent}`, background: r > 0.05 ? "rgba(26,158,88,0.12)" : "transparent", textAlign: "center" }}>
                  <span style={{ display: "inline-block", transform: `scale(${r})`, opacity: r }}>
                    {colourOf(item.ans[k]) ? <span style={{ color: colourOf(item.ans[k]) }}>{item.ans[k]}</span> : <Inf inf={item.inf} />}
                  </span>
                </span>
              )}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 54, fontWeight: 800, marginTop: 30 }}>
          (<Inf inf={item.inf} />)
        </div>
        <div style={{ fontSize: 40, color: L.dim, marginTop: 14, opacity: r }}>{item.en}</div>
      </div>
      <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {f < reveal ? (
          <div style={{ position: "relative", width: 170, height: 170 }}>
            <svg width={170} height={170} style={{ position: "absolute", inset: 0 }}>
              <circle cx={85} cy={85} r={70} fill="none" stroke={L.line} strokeWidth={12} />
              <circle cx={85} cy={85} r={70} fill="none" stroke={L.accent} strokeWidth={12} strokeLinecap="round" strokeDasharray={2 * Math.PI * 70} strokeDashoffset={2 * Math.PI * 70 * (1 - ring)} transform="rotate(-90 85 85)" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 84, fontWeight: 800 }}>{left}</div>
          </div>
        ) : (
          <div style={{ fontSize: 120, color: GREEN, ...lift(r) }}>✓</div>
        )}
      </div>
    </Body>
  );
}

function End() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, fps, 0);
  const b = pop(f, fps, 12);
  const c = pop(f, fps, 22, 10);
  return (
    <Body>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: -2, lineHeight: 1.15, ...lift(a) }}>{T.end[0]}</div>
        <div style={{ fontSize: 56, fontWeight: 700, color: L.dim, marginTop: 40, lineHeight: 1.3, ...lift(b) }}>{T.end[1]}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 70, opacity: c, transform: `scale(${0.8 + 0.2 * c})` }}>
          <LogoMark size={130} delay={-60} />
          <span style={{ fontSize: 70, fontWeight: 800, color: RED }}>{T.end[2]}</span>
        </div>
      </div>
    </Body>
  );
}

export function SeparableTeaser() {
  const total = teaserSepDuration();
  const scenes = [
    { len: sec(HOOK), el: <Hook /> },
    ...QUIZ.map((item, i) => ({ len: sec(Q_LEN), el: <Question item={item} n={i + 1} />, ding: true })),
    { len: sec(END), el: <End /> },
  ];
  let from = 0;
  // Music: soft, very soft under Emma, a little louder after her.
  const music = (fr) => interpolate(fr, [0, sec(VOICE_AT - 0.3), sec(VOICE_AT), sec(VOICE_AT + VOICE_LEN), sec(VOICE_AT + VOICE_LEN + 1), total - 30, total], [0.25, 0.25, 0.05, 0.05, 0.2, 0.2, 0], clamp);
  return (
    <AbsoluteFill style={{ background: L.bg, fontFamily, color: L.text }}>
      <Audio src={staticFile("music/tomorrows-light.mp3")} volume={music} />
      <Sequence from={sec(VOICE_AT)}>
        <Audio src={staticFile("teaser_sep_voice.wav")} />
      </Sequence>
      {scenes.map((s, i) => {
        const at = from;
        from += s.len;
        return (
          <Sequence key={i} from={at} durationInFrames={s.len}>
            <Fade len={s.len} still={i === 0}>{s.el}</Fade>
            {s.ding && (
              <Sequence from={sec(Q_REVEAL)}>
                <Audio src={staticFile("teaser_ding.wav")} />
              </Sequence>
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

/** Fades in (not the first scene: complete on frame 0) and out. */
function Fade({ len, still, children }) {
  const f = useCurrentFrame();
  const enter = still ? 1 : interpolate(f, [0, 7], [0, 1], clamp);
  const leave = interpolate(f, [len - 7, len], [1, 0], clamp);
  return <AbsoluteFill style={{ opacity: Math.min(enter, leave) }}>{children}</AbsoluteFill>;
}
