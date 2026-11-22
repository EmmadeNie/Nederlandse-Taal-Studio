// Instagram story (9:16): Sinterklaas in 7 words, with the teacher's own voice.
// Same words as the carousel (Sinterklaas.jsx). `timing` says in seconds where
// each part starts in the recording; without a recording it uses even placeholders.
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoMark, fontFamily } from "./Demo";
import { Rich } from "./LessonReel";
import { L, card, chip } from "./Carousel";
import { WORDS, RED, GOLD } from "./Sinterklaas";

export const STORY_SIZE = { width: 1080, height: 1920 };
export const STORY_FPS = 30;

// Placeholder timing (seconds): intro, then per word [word, sentence], then the end.
const PLACEHOLDER = {
  intro: 0,
  words: WORDS.map((_, i) => [2.5 + i * 5, 4 + i * 5]),
  end: 2.5 + WORDS.length * 5,
  total: 2.5 + WORDS.length * 5 + 3,
};

export const storyDuration = (timing = PLACEHOLDER) => Math.round(timing.total * STORY_FPS);

/** Fade and slide in from `at` frames. */
function useIn(at) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 200 } });
  return { opacity: s, transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)` };
}

function Shell({ children }) {
  return (
    <AbsoluteFill style={{ background: L.bg, fontFamily, color: L.text }}>
      {/* Instagram covers the top ~250px and bottom ~250px with its own UI. */}
      <div style={{ position: "absolute", left: 80, right: 80, top: 260, bottom: 300, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 300, textAlign: "center", fontSize: 32, fontWeight: 700, color: L.dim }}>@mijntaalstudio</div>
    </AbsoluteFill>
  );
}

function Intro() {
  const a = useIn(0);
  const b = useIn(10);
  const c = useIn(24);
  return (
    <Shell>
      <div style={{ ...a, display: "flex", alignItems: "center", gap: 20, marginBottom: 50 }}>
        <LogoMark size={80} delay={-60} />
        <span style={chip(RED)}>Dutch culture</span>
      </div>
      <div style={{ ...b, fontSize: 150, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>
        <div style={{ color: RED }}>Sinterklaas</div>
        <div>in 7 words</div>
      </div>
      <div style={{ ...c, fontSize: 48, fontWeight: 700, color: L.dim, marginTop: 60 }}>🔊 Sound on</div>
    </Shell>
  );
}

function Word({ i, sentenceAt }) {
  const w = WORDS[i];
  const a = useIn(0);
  const b = useIn(8);
  const c = useIn(sentenceAt);
  return (
    <Shell>
      <div style={{ ...a, fontSize: 36, fontWeight: 800, color: GOLD, letterSpacing: 1, textTransform: "uppercase", marginBottom: 24 }}>
        Word {i + 1} of {WORDS.length}
      </div>
      <div style={{ ...a, fontSize: 120, fontWeight: 800, letterSpacing: -3, lineHeight: 1.05 }}>
        {w.art && <span style={{ color: L.dim, fontWeight: 700 }}>{w.art} </span>}
        <span style={{ color: RED }}>{w.nl}</span>
      </div>
      <div style={{ ...b, fontSize: 54, fontWeight: 600, color: L.dim, marginTop: 28, lineHeight: 1.25 }}>
        <Rich text={w.en} />
      </div>
      <div style={{ ...c, ...card, marginTop: 90, padding: "44px 50px", borderLeft: `12px solid ${RED}` }}>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.25 }}>{w.ex[0]}</div>
        <div style={{ fontSize: 42, color: L.dim, marginTop: 16, fontStyle: "italic" }}>{w.ex[1]}</div>
      </div>
    </Shell>
  );
}

function End() {
  const a = useIn(0);
  const b = useIn(10);
  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={a}>
          <LogoMark size={170} delay={-60} />
        </div>
        <div style={{ ...a, fontSize: 92, fontWeight: 800, letterSpacing: -2, marginTop: 50, lineHeight: 1.1 }}>Fijne Sinterklaas! 🎁</div>
        <div style={{ ...b, fontSize: 50, fontWeight: 600, color: L.dim, marginTop: 40, lineHeight: 1.35 }}>All 7 words + a quiz in my latest post</div>
        <div style={{ ...b, fontSize: 46, fontWeight: 800, color: RED, marginTop: 50 }}>Follow @mijntaalstudio</div>
      </div>
    </Shell>
  );
}

export function SinterklaasStory({ timing = PLACEHOLDER, audio = null }) {
  const s = (sec) => Math.round(sec * STORY_FPS);
  const starts = [timing.intro, ...timing.words.map(([w]) => w), timing.end, timing.total];
  return (
    <AbsoluteFill>
      {audio && <Audio src={staticFile(audio)} />}
      <Sequence from={s(starts[0])} durationInFrames={s(starts[1]) - s(starts[0])}>
        <Intro />
      </Sequence>
      {timing.words.map(([w, sentence], i) => (
        <Sequence key={i} from={s(w)} durationInFrames={s(starts[i + 2]) - s(w)}>
          <Word i={i} sentenceAt={s(sentence) - s(w)} />
        </Sequence>
      ))}
      <Sequence from={s(timing.end)} durationInFrames={s(timing.total) - s(timing.end)}>
        <End />
      </Sequence>
    </AbsoluteFill>
  );
}
