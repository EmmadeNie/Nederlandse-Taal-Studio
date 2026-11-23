// YouTube Short / Reel (9:16, ~2 min): "Teaching my friend Dutch · Sinterklaas in 7 words".
// The funniest moment of the recording for each word. Voice and timing come from
// sinterklaasShort.json (demo/sinterklaas/build_short.py).
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoMark, fontFamily } from "./Demo";
import { L, card } from "./Carousel";
import { Rich } from "./LessonReel";
import { RED, GOLD } from "./Sinterklaas";
import TL1 from "./sinterklaasShort.json";
import TL2 from "./sinterklaasShort2.json";

// Part 1 and part 2 (the funny bits part 1 left out); both built by build_short.py.
const SHORTS = { 1: { tl: TL1, audio: "sinterklaas_short_voice.wav" }, 2: { tl: TL2, audio: "sinterklaas_short2_voice.wav" } };

export const SHORT_FPS = 30;
export const shortDuration = (part = 1) => Math.ceil(SHORTS[part].tl.total * SHORT_FPS);
const sec = (s) => Math.round(s * SHORT_FPS);

function useIn(at = 0, damping = 200) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping } });
  return { s, style: { opacity: s, transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)` } };
}

// Shorts/Reels cover the top ~200 px, the bottom ~420 px and the buttons on the right.
const SAFE = { left: 70, right: 150, top: 210, bottom: 430 };

function Header({ tl }) {
  const f = useCurrentFrame();
  const h = tl.scenes[0];
  if (h.hook && f < sec(h.start + h.dur)) {
    return (
      <div style={{ position: "absolute", left: SAFE.left, right: SAFE.right, top: SAFE.top, display: "flex", alignItems: "center", gap: 18 }}>
        <LogoMark size={70} delay={-60} />
        <span style={{ fontSize: 40, fontWeight: 800 }}>Taal Studio</span>
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: SAFE.left, right: SAFE.right, top: SAFE.top, display: "flex", alignItems: "center", gap: 18 }}>
      <LogoMark size={70} delay={-60} />
      <span style={{ fontSize: 46, fontWeight: 800, letterSpacing: -1 }}>
        <span style={{ color: RED }}>Sinterklaas</span> in 7 Dutch words 🎁
      </span>
    </div>
  );
}

function Label({ s }) {
  const a = useIn(0);
  if (s.hook) {
    // First frames: the topic, big, so it's clear right away what this is about.
    return (
      <div style={{ opacity: 1 }}>
        <div style={{ fontSize: 108, fontWeight: 800, letterSpacing: -3.5, lineHeight: 1.02 }}>
          <span style={{ color: RED }}>Sinterklaas</span> in 7 Dutch words 🎁
        </div>
        <div style={{ fontSize: 50, fontWeight: 700, color: L.dim, marginTop: 22 }}>{s.label}</div>
      </div>
    );
  }
  if (s.label) {
    return <div style={{ ...a.style, fontSize: 64, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1 }}>{s.label}</div>;
  }
  return (
    <div style={a.style}>
      <div style={{ fontSize: 34, fontWeight: 800, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase" }}>Word {s.n} of 7</div>
      <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.05, color: RED, marginTop: 6 }}>{s.word}</div>
      <div style={{ fontSize: 40, fontWeight: 600, color: L.dim, marginTop: 6 }}>{s.en}</div>
      {s.desc && (
        <div style={{ fontSize: 36, fontWeight: 500, lineHeight: 1.35, marginTop: 18, paddingLeft: 22, borderLeft: `6px solid ${GOLD}` }}>
          <Rich text={s.desc} />
        </div>
      )}
    </div>
  );
}

function Caption({ c, next }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = sec(c.at);
  const s = spring({ frame: f - at, fps, config: { damping: 13 } });
  const out = next != null && f >= sec(next);
  return (
    <div
      style={{
        ...card,
        padding: "32px 38px",
        marginTop: 26,
        opacity: out ? 0.38 : s,
        transform: `scale(${out ? 0.94 : interpolate(s, [0, 1], [0.8, 1])})`,
        transformOrigin: "left center",
      }}
    >
      <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.15, letterSpacing: -1 }}>
        {c.nl} {c.emoji && <span style={{ color: c.emoji === "✓" ? L.past : undefined }}>{c.emoji}</span>}
      </div>
      {c.en && !out && (
        <div style={{ fontSize: 40, fontWeight: 600, color: L.dim, marginTop: 10, lineHeight: 1.25 }}>
          <Rich text={c.en} />
        </div>
      )}
    </div>
  );
}

function Oops({ fix, at }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const pop = spring({ frame: f - at, fps, config: { damping: 9, stiffness: 140 } });
  const strike = interpolate(f - at, [8, 20], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ok = spring({ frame: f - at - 22, fps, config: { damping: 12 } });
  return (
    <div style={{ alignSelf: "flex-end", marginTop: 36, padding: "30px 36px", background: "#fff4b8", borderRadius: 10, boxShadow: "0 18px 40px rgba(11,13,17,0.18)", transform: `rotate(${interpolate(pop, [0, 1], [-14, -4])}deg) scale(${interpolate(pop, [0, 1], [0.4, 1])})`, opacity: Math.min(1, pop * 1.5) }}>
      <div style={{ fontSize: 36, fontWeight: 800, color: RED, letterSpacing: 1, textTransform: "uppercase" }}>Oops!</div>
      <div style={{ fontSize: 66, fontWeight: 800, marginTop: 6, display: "flex", alignItems: "baseline", gap: 22, whiteSpace: "nowrap" }}>
        <span style={{ position: "relative", color: L.dim }}>
          {fix.wrong}
          <span style={{ position: "absolute", left: 0, top: "52%", height: 8, width: `${strike}%`, background: RED, borderRadius: 5, transform: "rotate(-6deg)" }} />
        </span>
        <span style={{ color: L.past, opacity: ok, display: "inline-block", transform: `scale(${interpolate(ok, [0, 1], [0.5, 1])})` }}>{fix.right} ✓</span>
      </div>
    </div>
  );
}

function Moment({ s }) {
  const f = useCurrentFrame();
  const v = s.voice;
  // Show at most the last three captions, so long scenes never overflow.
  const shown = s.caps.map((c, i) => ({ c, i })).filter(({ c }) => f >= sec(v + c.at)).slice(-3);
  return (
    <div style={{ position: "absolute", left: SAFE.left, right: SAFE.right, top: SAFE.top + 110, bottom: SAFE.bottom, display: "flex", flexDirection: "column" }}>
      <Label s={s} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 60 }}>
        {shown.map(({ c, i }) => (
          <Caption key={i} c={{ ...c, at: v + c.at }} next={s.caps[i + 1] ? v + s.caps[i + 1].at : null} />
        ))}
        {s.fix && <Oops fix={s.fix} at={sec(v + s.fix.at)} />}
      </div>
    </div>
  );
}

function End({ part }) {
  const a = useIn(0);
  const b = useIn(10, 12);
  return (
    <div style={{ position: "absolute", left: SAFE.left, right: SAFE.right, top: SAFE.top + 110, bottom: SAFE.bottom, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {part === 2 ? (
        <div style={{ ...a.style, ...card, padding: "40px 44px" }}>
          <div style={{ fontSize: 46, fontWeight: 700 }}>Stay tuned for the full</div>
          <div style={{ fontSize: 64, fontWeight: 800, color: RED, marginTop: 8, lineHeight: 1.1 }}>Sinterklaas edition 🎁</div>
        </div>
      ) : (
        <div style={{ ...a.style, ...card, padding: "40px 44px" }}>
          <div style={{ fontSize: 46, fontWeight: 700 }}>Full lesson: 7 words, 27 sentences and a quiz</div>
          <div style={{ fontSize: 56, fontWeight: 800, color: RED, marginTop: 12 }}>On YouTube: @mijntaalstudio</div>
        </div>
      )}
      <div style={{ ...b.style, fontSize: 54, fontWeight: 800, marginTop: 44 }}>{part === 2 ? "Follow @mijntaalstudio 👋" : "Follow for more Dutch 👋"}</div>
    </div>
  );
}

export function SinterklaasShort({ part = 1 }) {
  const { tl: TL, audio } = SHORTS[part];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 80% 10%, #fde4e8 0%, ${L.bg} 50%)`, fontFamily, color: L.text }}>
      <Audio src={staticFile(audio)} />
      <Header tl={TL} />
      {TL.scenes.map((s, i) => {
        const from = sec(s.start);
        const dur = Math.max(1, sec(s.start + s.dur) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            {s.kind === "end" ? <End part={part} /> : <Moment s={s} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
