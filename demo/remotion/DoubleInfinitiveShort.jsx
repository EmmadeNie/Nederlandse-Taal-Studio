// "Can you say this in one breath?": a ~25 s YouTube Short and Instagram Reel (9:16) for the double
// infinitive (B1), as a teaser for the full lesson (DoubleInfinitiveVideo.jsx). Emma's tongue-twister
// (27 Nov 2026, Google Drive "27 Nov at 19-45.m4a", cut [0.76, 9.7] s → raw/di/short_intro.wav):
// "Can you say this in one breath? Ik zou het hebben moeten kunnen zien. Four verbs, one sentence.
// Welcome to Dutch." The sentence is on screen from frame 0; at "four verbs" the infinitives get
// 1 · 2 · 3 · 4. Then the stack builds up (her lesson clips), the trick (no ge-), and the way to the
// full lesson with her end line. Dark lesson look, music A Stroll (the lesson's).
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, C, LogoMark, fontFamily } from "./Demo";
import { Rich, card, gradientText, pop } from "./LessonReel";
import { Strike, clamp } from "./LessonVideo";

export const DI_SHORT_FPS = 30;
const S = (s) => Math.round(s * DI_SHORT_FPS);
const RED = "#ff5a5a";
const lift = (p, px = 30) => ({ opacity: p, transform: `translateY(${(1 - p) * px}px)` });

// Emma's intro from 0.3 s; times in her clip: the Dutch sentence, "four verbs", "welcome to Dutch", the end.
const VOICE_AT = 0.3;
const V = { sentence: 1.98, four: 5.72, welcome: 7.94, end: 8.94 };
const at = (t) => VOICE_AT + t;

const HOOK = at(V.end) + 1.2;
const STACK = 7.6;
const TRICK = 4.4;
const END_VOICE_AT = 0.4;
const END = END_VOICE_AT + 2.78 + 0.9;
export const diShortDuration = () => S(HOOK + STACK + TRICK + END);

const STACK_ROWS = [
  { s: "Ik [kan] het {zien}.", clip: "kan_zien", n: 2 },
  { s: "Ik [heb] het {kunnen} {zien}.", clip: "kunnen_zien", n: 3 },
  { s: "Ik [had] het {moeten} {kunnen} {zien}.", clip: "moeten_kunnen_zien", n: 4 },
];
const STACK_STEP = 2.2;

const tokens = (s) => s.split(/(\[[^\]]+\]|\{[^}]+\})/).filter(Boolean);
function Sentence({ s }) {
  return tokens(s).map((t, i) => (t.startsWith("[") ? <span key={i} style={{ color: C.orange }}>{t.slice(1, -1)}</span> : t.startsWith("{") ? <span key={i} style={{ color: C.green }}>{t.slice(1, -1)}</span> : <span key={i}>{t}</span>));
}

/** Frame 0: the question and the five-verb sentence; at "four verbs" 1-2-3-4, at "welcome to Dutch" the line. */
function Hook() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const said = pop(f, fps, S(at(V.sentence)), 10);
  const badge = (k) => pop(f, fps, S(at(V.four)) + k * 7, 9);
  const welcome = pop(f, fps, S(at(V.welcome)) - 2, 10);
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 40 }}>
        <LogoMark size={90} delay={-60} />
        <span style={{ fontSize: 36, fontWeight: 800, padding: "8px 22px", borderRadius: 999, background: C.orange, color: C.bg }}>B1</span>
        <span style={{ fontSize: 34, fontWeight: 700, color: C.dim }}>Double infinitive</span>
      </div>
      <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -3, lineHeight: 1.06, marginBottom: 60 }}>
        Can you say this
        <div>
          <span style={{ ...gradientText, paddingBottom: 6 }}>in one breath?</span> 😮‍💨
        </div>
      </div>
      <div style={{ ...card, padding: "40px 44px 40px", transform: `scale(${1 + 0.04 * Math.sin(Math.min(1, said) * Math.PI)})` }}>
        {/* "Ik zou het" on one line, the four infinitives on the next (room for their numbers). */}
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.2 }}>
          Ik <span style={{ color: C.orange }}>zou</span> het
        </div>
        {[["hebben", 0, " ", "moeten", 1], ["kunnen", 2, " ", "zien", 3, "."]].map((line, li) => (
          <div key={li} style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.2, marginTop: 56, whiteSpace: "nowrap" }}>
            {line.map((w, i) =>
              typeof w === "number" ? null : typeof line[i + 1] === "number" ? (
                <span key={i} style={{ position: "relative", display: "inline-block", color: C.green }}>
                  {w}
                  <span style={{ position: "absolute", left: "50%", top: -58, width: 58, height: 58, marginLeft: -29, borderRadius: 29, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 800, color: C.bg, background: C.orange, opacity: badge(line[i + 1]), transform: `scale(${badge(line[i + 1])})` }}>{line[i + 1] + 1}</span>
                </span>
              ) : (
                <span key={i}>{w}</span>
              ),
            )}
          </div>
        ))}
        <div style={{ fontSize: 36, color: C.dim, marginTop: 14 }}>I should have been able to see it.</div>
      </div>
      <div style={{ height: 160, display: "flex", alignItems: "center", marginTop: 40 }}>
        <span style={{ fontSize: 76, fontWeight: 800, whiteSpace: "nowrap", opacity: welcome, transform: `scale(${0.6 + 0.4 * welcome})`, transformOrigin: "left center", display: "inline-block" }}>Welcome to Dutch 🇳🇱😅</span>
      </div>
    </>
  );
}

/** How you get there: the stack grows one verb at a time, in Emma's voice. */
function Stack() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, fps, 0);
  return (
    <>
      <div style={{ fontSize: 78, fontWeight: 800, letterSpacing: -2, marginBottom: 50, ...lift(a) }}>How do you get there? 🧗</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {STACK_ROWS.map((r, i) => {
          const p = pop(f, fps, S(0.5 + i * STACK_STEP) - 4);
          return (
            <div key={i} style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "28px 40px", ...lift(p) }}>
              <span style={{ fontSize: 64 - i * 4, fontWeight: 800, whiteSpace: "nowrap" }}>
                <Sentence s={r.s} />
              </span>
              <span style={{ fontSize: 34, fontWeight: 800, color: C.orange, marginLeft: 20, whiteSpace: "nowrap" }}>{r.n} verbs</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** The trick: no ge- (Ik heb gemoeten wachten ✗ → moeten ✓), in Emma's voice. */
function Trick() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, fps, 0);
  const strike = interpolate(f, [12, 22], [0, 1], clamp);
  const ok = pop(f, fps, 24, 10);
  return (
    <>
      <div style={{ fontSize: 80, fontWeight: 800, letterSpacing: -2, marginBottom: 50, ...lift(a) }}>
        The trick: <Rich text="no *ge-*!" />
      </div>
      <div style={{ ...card, padding: "34px 44px", ...lift(a) }}>
        <div style={{ fontSize: 70, fontWeight: 800 }}>
          Ik <span style={{ color: C.orange }}>heb</span>{" "}
          <span style={{ position: "relative", color: RED }}>
            gemoeten
            <Strike p={strike} color={RED} />
          </span>
        </div>
        <div style={{ fontSize: 70, fontWeight: 800, marginTop: 18, ...lift(ok, 20) }}>
          Ik <span style={{ color: C.orange }}>heb</span> <span style={{ color: C.green }}>moeten wachten</span> ✅
        </div>
      </div>
    </>
  );
}

function End() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, fps, 0, 9);
  const c = pop(f, fps, 12, 10);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <LogoMark size={170} delay={-60} />
      <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -2, marginTop: 50, ...lift(a) }}>Want the full lesson?</div>
      <div style={{ ...card, width: "100%", padding: "30px 40px", marginTop: 50, ...lift(c) }}>
        <div style={{ fontSize: 40, fontWeight: 700 }}>▶️ Double infinitive, explained on YouTube</div>
        <div style={{ fontSize: 60, fontWeight: 800, color: RED, marginTop: 8 }}>@mijntaalstudio</div>
      </div>
    </div>
  );
}

function Frame({ len, still, children }) {
  const f = useCurrentFrame();
  const enter = still ? 1 : interpolate(f, [0, 7], [0, 1], clamp);
  const leave = interpolate(f, [len - 7, len], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: Math.min(enter, leave), transform: `translateY(${(1 - enter) * 24}px)` }}>
      <div style={{ position: "absolute", left: 80, right: 80, top: 240, bottom: 380, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>
    </AbsoluteFill>
  );
}

/** music: a track from raw/music/, or false (Instagram, where a song can be added in the app). */
export function DoubleInfinitiveShort({ music = "music/a-stroll.mp3" }) {
  const total = diShortDuration();
  const t1 = S(HOOK);
  const t2 = t1 + S(STACK);
  const t3 = t2 + S(TRICK);
  // Music soft under Emma, a little louder between her lines, out at the end.
  const level = (fr) => interpolate(fr, [0, S(VOICE_AT), S(at(V.end)), S(at(V.end)) + 15, t3, t3 + S(END_VOICE_AT), total - 10, total], [0.12, 0.06, 0.06, 0.25, 0.25, 0.08, 0.08, 0], clamp);
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily, color: C.text }}>
      <Backdrop />
      {music && <Audio src={staticFile(music)} volume={level} />}
      <Sequence from={S(VOICE_AT)}>
        <Audio src={staticFile("di/short_intro.wav")} />
      </Sequence>
      <Sequence from={0} durationInFrames={t1}>
        <Frame len={t1} still>
          <Hook />
        </Frame>
      </Sequence>
      <Sequence from={t1} durationInFrames={S(STACK)}>
        <Frame len={S(STACK)}>
          <Stack />
        </Frame>
        {STACK_ROWS.map((r, i) => (
          <Sequence key={r.clip} from={S(0.5 + i * STACK_STEP)}>
            <Audio src={staticFile(`di/${r.clip}.wav`)} />
          </Sequence>
        ))}
      </Sequence>
      <Sequence from={t2} durationInFrames={S(TRICK)}>
        <Frame len={S(TRICK)}>
          <Trick />
        </Frame>
        <Sequence from={24}>
          <Audio src={staticFile("di/heb_moeten.wav")} />
        </Sequence>
      </Sequence>
      <Sequence from={t3}>
        <Frame len={S(END)}>
          <End />
        </Frame>
        <Sequence from={S(END_VOICE_AT)}>
          <Audio src={staticFile("imperfectum_teaser_end_voice.wav")} />
        </Sequence>
      </Sequence>
    </AbsoluteFill>
  );
}
