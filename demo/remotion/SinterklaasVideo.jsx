// YouTube video (16:9): Sinterklaas in 7 words, "repeat after me" with Emma and
// a learner. The voice track and the scene timing come from the recording
// (sinterklaasTimeline.json, made by demo/sinterklaas/build_track.py);
// this file only draws the scenes. Dutch words inside English text are *italic*.
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoMark, fontFamily } from "./Demo";
import { Rich } from "./LessonReel";
import { L } from "./Carousel";
import { RED, GOLD } from "./Sinterklaas";
import TIMELINE from "./sinterklaasTimeline.json";

export const SINT_VIDEO_FPS = 30;
export const SINT_VIDEO_SIZE = { width: 1920, height: 1080 };
export const sintVideoDuration = () => Math.ceil(TIMELINE.total * SINT_VIDEO_FPS);

const W = TIMELINE.words;
const BLUE = L.perfect;
const card = { background: L.card, border: `2px solid ${L.line}`, borderRadius: 32, boxShadow: "0 10px 30px rgba(11,13,17,0.06)" };
const sec = (s) => Math.round(s * SINT_VIDEO_FPS);

function useIn(at = 0) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 200 } });
  return { opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)` };
}

/** Which part of the video a scene belongs to, for the progress chips. */
function sectionOf(s) {
  if (s.kind === "word" || s.kind === "line" || s.kind === "slow") return `w${s.w}`;
  if (s.kind.startsWith("verb")) return "verbs";
  if (s.kind.startsWith("quiz")) return "quiz";
  return null;
}

function Header({ section }) {
  const chips = [...W.map((_, i) => [`w${i}`, String(i + 1)]), ["verbs", "Verbs"], ["quiz", "Quiz"]];
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 50, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 32, fontWeight: 800 }}>
        <LogoMark size={56} delay={-60} />
        Taal Studio <span style={{ color: L.dim, fontWeight: 600 }}>· Sinterklaas in 7 words</span>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {chips.map(([id, label]) => {
          const on = id === section;
          return (
            <span key={id} style={{ fontSize: 24, fontWeight: 800, minWidth: 44, textAlign: "center", padding: "8px 16px", borderRadius: 999, color: on ? "#fff" : L.dim, background: on ? RED : "#e9ebf0" }}>
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Little sound bars while the voice plays. */
function Speaking({ from, to }) {
  const f = useCurrentFrame();
  const on = f >= from && f < to;
  return (
    <div style={{ position: "absolute", right: 80, bottom: 60, display: "flex", alignItems: "flex-end", gap: 6, height: 44, opacity: on ? 1 : 0.25 }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ width: 10, borderRadius: 5, background: RED, height: on ? 14 + 26 * Math.abs(Math.sin((f + i * 7) / 4)) : 12 }} />
      ))}
    </div>
  );
}

function Body({ children }) {
  return <div style={{ position: "absolute", left: 120, right: 120, top: 170, bottom: 120, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>;
}

const kicker = { fontSize: 32, fontWeight: 800, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20 };

function WordTitle({ w, size = 150 }) {
  return (
    <div style={{ fontSize: size, fontWeight: 800, letterSpacing: -4, lineHeight: 1.05 }}>
      {w.art && <span style={{ color: L.dim, fontWeight: 700 }}>{w.art} </span>}
      <span style={{ color: RED }}>{w.nl}</span>
    </div>
  );
}

function Syllables({ w, big }) {
  return (
    <div style={{ display: "flex", gap: big ? 22 : 14, flexWrap: "wrap", alignItems: "center" }}>
      {w.syl.map((s, i) => (
        <span key={i} style={{ fontSize: big ? 96 : 56, fontWeight: i === w.stress ? 800 : 600, padding: big ? "14px 34px" : "8px 24px", borderRadius: 22, color: i === w.stress ? "#fff" : L.text, background: i === w.stress ? RED : "#e9ebf0" }}>
          {s}
        </span>
      ))}
      <span style={{ fontSize: 30, color: L.dim, marginLeft: 10 }}>stress on the red part</span>
    </div>
  );
}

function Word({ s }) {
  const w = W[s.w];
  const a = useIn(0);
  const b = useIn(12);
  const c = useIn(28);
  return (
    <Body>
      <div style={{ ...kicker, ...a }}>
        Word {s.w + 1} of {W.length}
      </div>
      <div style={a}>
        <WordTitle w={w} />
      </div>
      <div style={{ ...b, fontSize: 50, fontWeight: 600, color: L.dim, margin: "16px 0 44px" }}>
        <Rich text={w.en} />
      </div>
      <div style={c}>
        <Syllables w={w} />
      </div>
      <div style={{ ...c, ...card, marginTop: 44, padding: "26px 36px", fontSize: 40, lineHeight: 1.35, alignSelf: "flex-start", maxWidth: 1400 }}>
        💡 <Rich text={w.tip} />
      </div>
    </Body>
  );
}

function Slow({ s }) {
  const w = W[s.w];
  const a = useIn(0);
  const b = useIn(10);
  return (
    <Body>
      <div style={{ ...kicker, ...a }}>Slowly 🐢</div>
      <div style={{ ...a, marginBottom: 50 }}>
        <WordTitle w={w} size={110} />
      </div>
      <div style={b}>
        <Syllables w={w} big />
      </div>
    </Body>
  );
}

/** A Dutch sentence with one word or phrase in red. */
function Highlight({ text, hl, color = RED }) {
  if (!hl || !text.includes(hl)) return text;
  const i = text.indexOf(hl);
  return (
    <>
      {text.slice(0, i)}
      <span style={{ color }}>{hl}</span>
      {text.slice(i + hl.length)}
    </>
  );
}

function Line({ s }) {
  const w = W[s.w];
  const a = useIn(0);
  const b = useIn(10);
  return (
    <Body>
      <div style={{ ...kicker, ...a, display: "flex", gap: 18, alignItems: "center" }}>
        Word {s.w + 1} · {w.art ? `${w.art} ` : ""}
        {w.nl}
        <span style={{ fontSize: 26, color: "#fff", background: GOLD, borderRadius: 999, padding: "6px 18px", letterSpacing: 0.5 }}>🔁 Repeat after me</span>
      </div>
      <div style={{ ...a, ...card, padding: "56px 64px", borderLeft: `16px solid ${RED}` }}>
        <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 1.15, letterSpacing: -1.5 }}>
          <Highlight text={s.nl} hl={s.hl} />
        </div>
        <div style={{ ...b, fontSize: 48, color: L.dim, marginTop: 24, fontStyle: "italic" }}>{s.en}</div>
      </div>
      {s.fix && <Fix fix={s.fix} at={sec(s.voice + s.fix.at)} />}
    </Body>
  );
}

/** A teacher's sticky note that pops in when the learner says it wrong: "witte" crossed out, "wit" ✓. */
function Fix({ fix, at }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const pop = spring({ frame: f - at, fps, config: { damping: 9, stiffness: 140 } });
  const strike = interpolate(f - at, [8, 20], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ok = spring({ frame: f - at - 22, fps, config: { damping: 12 } });
  return (
    <div
      style={{
        position: "absolute",
        right: -20,
        bottom: 10,
        width: 620,
        padding: "30px 36px",
        background: "#fff4b8",
        borderRadius: 10,
        boxShadow: "0 18px 40px rgba(11,13,17,0.18)",
        transform: `rotate(${interpolate(pop, [0, 1], [-14, -4])}deg) scale(${interpolate(pop, [0, 1], [0.4, 1])})`,
        transformOrigin: "80% 80%",
        opacity: Math.min(1, pop * 1.5),
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 800, color: RED, letterSpacing: 1, textTransform: "uppercase" }}>Oops!</div>
      <div style={{ fontSize: 64, fontWeight: 800, marginTop: 10, display: "flex", alignItems: "baseline", gap: 22 }}>
        <span style={{ position: "relative", color: L.dim }}>
          {fix.wrong}
          <span style={{ position: "absolute", left: 0, top: "52%", height: 7, width: `${strike}%`, background: RED, borderRadius: 4, transform: "rotate(-6deg)" }} />
        </span>
        <span style={{ color: L.past, opacity: ok, transform: `scale(${interpolate(ok, [0, 1], [0.5, 1])})`, display: "inline-block" }}>{fix.right} ✓</span>
      </div>
      <div style={{ fontSize: 32, lineHeight: 1.35, marginTop: 12, opacity: ok }}>
        <Rich text={fix.note} />
      </div>
    </div>
  );
}

function Title() {
  const a = useIn(0);
  const b = useIn(14);
  const c = useIn(30);
  return (
    <Body>
      <div style={{ ...a, display: "flex", gap: 16, marginBottom: 40 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: "#fff", background: RED, borderRadius: 999, padding: "10px 28px", letterSpacing: 1, textTransform: "uppercase" }}>Dutch culture</span>
        <span style={{ fontSize: 32, fontWeight: 800, color: L.dim, background: "#e9ebf0", borderRadius: 999, padding: "10px 28px" }}>A1 – A2</span>
      </div>
      <div style={{ ...b, fontSize: 190, fontWeight: 800, letterSpacing: -6, lineHeight: 0.95 }}>
        <div style={{ color: RED }}>Sinterklaas</div>
        <div>in 7 words</div>
      </div>
      <div style={{ ...c, fontSize: 56, fontWeight: 600, color: L.dim, marginTop: 50 }}>🔊 Listen and repeat, with Lamak</div>
    </Body>
  );
}

function Repeat() {
  const a = useIn(0);
  const b = useIn(12);
  return (
    <Body>
      <div style={{ ...a, fontSize: 150, fontWeight: 800, letterSpacing: -4 }}>Repeat after me! 🔁</div>
      <div style={{ ...b, fontSize: 52, color: L.dim, marginTop: 36, lineHeight: 1.35, maxWidth: 1500 }}>
        Emma says it first, then Lamak repeats. Say it out loud with him!
      </div>
    </Body>
  );
}

function VerbsIntro() {
  const a = useIn(0);
  const b = useIn(15);
  const c = useIn(40);
  return (
    <Body>
      <div style={{ ...kicker, ...a }}>Bonus · verbs</div>
      <div style={{ ...a, fontSize: 130, fontWeight: 800, letterSpacing: -4, lineHeight: 1.05 }}>Some verbs split in two ✂️</div>
      <div style={{ ...b, fontSize: 80, fontWeight: 800, marginTop: 50 }}>
        <span style={{ color: RED }}>aan</span>
        <span style={{ color: BLUE }}>komen</span>
        <span style={{ color: L.dim, fontWeight: 600 }}> = </span>
        <span style={{ color: RED }}>aan</span>
        <span style={{ color: L.dim, fontWeight: 600 }}> + </span>
        <span style={{ color: BLUE }}>komen</span>
      </div>
      <div style={{ ...c, fontSize: 50, color: L.dim, marginTop: 40 }}>Watch where the little word goes in a sentence.</div>
    </Body>
  );
}

function Verb({ s }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = useIn(0);
  const b = useIn(14);
  // The little word slides from the verb to the end of the sentence.
  const move = spring({ frame: f - 40, fps, config: { damping: 200 } });
  const i = s.nl.lastIndexOf(` ${s.part}`);
  const body = s.nl.slice(0, i);
  const end = s.nl.slice(i + s.part.length + 1);
  const vi = body.indexOf(` ${s.verb} `) >= 0 ? body.indexOf(` ${s.verb} `) + 1 : body.indexOf(s.verb);
  return (
    <Body>
      <div style={{ ...a, fontSize: 100, fontWeight: 800, letterSpacing: -2, marginBottom: 50 }}>
        <span style={{ color: RED }}>{s.inf[0]}</span>
        <span style={{ color: BLUE }}>{s.inf[1]}</span>
      </div>
      <div style={{ ...a, ...card, padding: "52px 64px" }}>
        <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.15, letterSpacing: -1.5 }}>
          {body.slice(0, vi)}
          <span style={{ color: BLUE }}>{s.verb}</span>
          {body.slice(vi + s.verb.length)}{" "}
          <span style={{ color: RED, display: "inline-block", opacity: move, transform: `translateY(${interpolate(move, [0, 1], [-50, 0])}px)` }}>{s.part}</span>
          {end}
        </div>
        <div style={{ ...b, fontSize: 48, color: L.dim, marginTop: 24, fontStyle: "italic" }}>{s.en}</div>
      </div>
      <div style={{ ...b, fontSize: 40, fontWeight: 700, color: RED, marginTop: 34 }}>
        ↳ <Rich text={`*${s.part}* goes to the end`} />
      </div>
    </Body>
  );
}

function VerbsTip() {
  const a = useIn(0);
  return (
    <Body>
      <div style={{ ...a, ...card, padding: "60px 70px", fontSize: 72, fontWeight: 700, lineHeight: 1.3 }}>
        💡 <Rich text="See a little word like *aan*, *in*, *uit* or *op* at the end of a sentence? It often belongs to the verb." />
      </div>
    </Body>
  );
}

function QuizIntro() {
  const a = useIn(0);
  const b = useIn(14);
  return (
    <Body>
      <div style={{ ...a, fontSize: 170, fontWeight: 800, letterSpacing: -5 }}>
        Quiz time! <span style={{ color: RED }}>🎁</span>
      </div>
      <div style={{ ...b, fontSize: 56, color: L.dim, marginTop: 36, lineHeight: 1.35 }}>
        8 questions. Say the missing word out loud before it appears.
      </div>
    </Body>
  );
}

function Quiz({ s }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = useIn(0);
  const reveal = sec(s.reveal);
  const shown = f >= reveal;
  const pop = spring({ frame: f - reveal, fps, config: { damping: 14 } });
  const left = Math.max(0, Math.ceil((reveal - f) / fps));
  const thinkStart = sec(0.35);
  const progress = interpolate(f, [thinkStart, reveal], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const [before, after] = s.q.split("___");
  return (
    <Body>
      <div style={{ ...kicker, ...a, display: "flex", justifyContent: "space-between" }}>
        <span>
          Question {s.n} of {s.total}
        </span>
        {!shown && <span style={{ color: RED, fontSize: 44 }}>{left}</span>}
      </div>
      <div style={{ ...a, ...card, padding: "60px 64px" }}>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.2, letterSpacing: -1.5 }}>
          {before}
          {shown ? (
            <span style={{ color: RED, display: "inline-block", transform: `scale(${interpolate(pop, [0, 1], [0.6, 1])})` }}>{s.ans}</span>
          ) : (
            <span style={{ display: "inline-block", width: 260, borderBottom: `10px solid ${RED}`, margin: "0 10px" }} />
          )}
          {after}
        </div>
        <div style={{ fontSize: 46, color: L.dim, marginTop: 26, fontStyle: "italic" }}>{s.en}</div>
      </div>
      <div style={{ height: 14, borderRadius: 7, background: "#e9ebf0", marginTop: 40, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, background: shown ? L.past : RED }} />
      </div>
      {shown && <div style={{ fontSize: 48, fontWeight: 800, color: L.past, marginTop: 26, opacity: pop }}>✓ {s.ans}</div>}
    </Body>
  );
}

function Outro() {
  const a = useIn(0);
  return (
    <Body>
      <div style={{ ...a, fontSize: 190, fontWeight: 800, letterSpacing: -6, textAlign: "center" }}>
        Fijne <span style={{ color: RED }}>Sinterklaas!</span> 🎁
      </div>
    </Body>
  );
}

function Cta() {
  const a = useIn(0);
  const b = useIn(14);
  const rows = [
    ["Practise these words in the app", "mijntaalstudio.nl", L.past],
    ["Subscribe for more Dutch lessons", "youtube.com/@mijntaalstudio", BLUE],
    ["Daily Dutch on Instagram", "@mijntaalstudio", RED],
  ];
  return (
    <Body>
      <div style={{ display: "flex", alignItems: "center", gap: 80 }}>
        <div style={a}>
          <LogoMark size={260} delay={-60} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...a, fontSize: 96, fontWeight: 800, letterSpacing: -3, marginBottom: 36 }}>Keep learning Dutch!</div>
          {rows.map(([label, link, color], i) => (
            <div key={i} style={{ ...b, ...card, padding: "24px 36px", marginTop: i ? 20 : 0 }}>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{label}</div>
              <div style={{ fontSize: 46, fontWeight: 800, color, marginTop: 4 }}>{link}</div>
            </div>
          ))}
        </div>
      </div>
    </Body>
  );
}

/** YouTube thumbnail (1280×720), same layout as the lesson thumbnails, in the video's light Sinterklaas style. */
export function SinterklaasThumb() {
  const words = [["de", "pakjesavond"], ["de", "pepernoten"], ["de", "surprise"]];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 85% 15%, #fde4e8 0%, ${L.bg} 55%)`, fontFamily, color: L.text }}>
      <div style={{ position: "absolute", left: 70, top: 160, display: "flex", alignItems: "center", gap: 22 }}>
        <LogoMark size={84} delay={-60} />
        <span style={{ fontSize: 34, fontWeight: 800, color: "#fff", background: RED, borderRadius: 999, padding: "10px 26px" }}>A1–A2</span>
      </div>
      <div style={{ position: "absolute", left: 70, top: 280, fontSize: 118, fontWeight: 800, letterSpacing: -4, lineHeight: 0.98 }}>
        <div style={{ color: RED }}>Sinterklaas</div>
        <div>in 7 words</div>
      </div>
      <div style={{ position: "absolute", left: 74, top: 540, fontSize: 40, fontWeight: 800, color: GOLD }}>🔁 Repeat after me</div>
      <div style={{ position: "absolute", right: 60, top: 190, width: 500, ...card, padding: "30px 40px", transform: "rotate(2deg)" }}>
        {words.map(([art, w], i) => (
          <div key={w} style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.5, whiteSpace: "nowrap", borderTop: i ? `2px solid ${L.line}` : "none" }}>
            <span style={{ color: L.dim, fontWeight: 700 }}>{art} </span>
            <span style={{ color: RED }}>{w}</span>
          </div>
        ))}
        <div style={{ fontSize: 34, fontWeight: 700, color: L.dim, marginTop: 10 }}>+ 4 more 🎁</div>
      </div>
    </AbsoluteFill>
  );
}

/** Cold open: a funny moment from the recording, captions popping in as they are said. */
function Funny({ s }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = useIn(0);
  const v = s.voice;
  return (
    <Body>
      <div style={{ ...kicker, ...a }}>😅 Before we start… take {s.n}</div>
      {s.caps.map(([at, nl, emoji], i) => {
        const t = sec(v + at);
        if (f < t) return null;
        const next = s.caps[i + 1] ? sec(v + s.caps[i + 1][0]) : null;
        const old = next != null && f >= next;
        const pop = spring({ frame: f - t, fps, config: { damping: 13 } });
        return (
          <div key={i} style={{ ...card, alignSelf: "flex-start", padding: "26px 44px", marginTop: 22, fontSize: 80, fontWeight: 800, letterSpacing: -1.5, opacity: old ? 0.38 : pop, transform: `scale(${old ? 0.94 : interpolate(pop, [0, 1], [0.8, 1])})`, transformOrigin: "left center" }}>
            {nl} {emoji && <span style={{ color: emoji === "✓" ? L.past : undefined }}>{emoji}</span>}
          </div>
        );
      })}
      {s.fix && <Fix fix={s.fix} at={sec(v + s.fix.at)} />}
    </Body>
  );
}

const SCENES = { funny: Funny, title: Title, repeat: Repeat, word: Word, slow: Slow, line: Line, verbsIntro: VerbsIntro, verb: Verb, verbsTip: VerbsTip, quizIntro: QuizIntro, quiz: Quiz, outro: Outro, cta: Cta };

export function SinterklaasVideo({ voice = "sinterklaas_voice.wav" }) {
  return (
    <AbsoluteFill style={{ background: L.bg, fontFamily, color: L.text }}>
      <Audio src={staticFile(voice)} />
      {TIMELINE.scenes.map((s, i) => {
        const Scene = SCENES[s.kind];
        const from = sec(s.start);
        const dur = Math.max(1, sec(s.start + s.dur) - from);
        const voiceFrom = s.voice != null ? sec(s.voice) : s.reveal != null ? sec(s.reveal) : -1;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <Header section={sectionOf(s)} />
            <Scene s={s} />
            {voiceFrom >= 0 && <Speaking from={voiceFrom} to={dur - sec(s.reveal != null ? 1.2 : 0.6)} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
