// Instagram story (9:16): "Teaching my friend Dutch" — the funny moments from the
// Sinterklaas recording, pointing to the full YouTube video. Voice and timing come
// from sinterklaasBloopers.json (demo/sinterklaas/build_bloopers.py).
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoMark, fontFamily } from "./Demo";
import { L, card } from "./Carousel";
import { RED, GOLD } from "./Sinterklaas";
import TL from "./sinterklaasBloopers.json";

export const BLOOPERS_FPS = 30;
export const bloopersDuration = () => Math.ceil(TL.total * BLOOPERS_FPS);
const sec = (s) => Math.round(s * BLOOPERS_FPS);

function useIn(at = 0, damping = 200) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping } });
  return { s, style: { opacity: s, transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)` } };
}

// Instagram covers ~250 px at the top and ~300 px at the bottom.
function Safe({ children }) {
  return <div style={{ position: "absolute", left: 80, right: 80, top: 270, bottom: 330, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>;
}

function Intro() {
  const a = useIn(0);
  return (
    <Safe>
      <div style={{ ...a.style, display: "flex", alignItems: "center", gap: 20, marginBottom: 50 }}>
        <LogoMark size={80} delay={-60} />
        <span style={{ fontSize: 40, fontWeight: 800 }}>Taal Studio</span>
      </div>
      <div style={{ ...a.style, fontSize: 130, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>
        Teaching my <span style={{ color: RED }}>friend</span> Dutch
      </div>
      <div style={{ ...a.style, fontSize: 48, color: L.dim, fontWeight: 700, marginTop: 60 }}>🔊 Sound on · Sinterklaas edition</div>
    </Safe>
  );
}

function Caption({ c, next }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = sec(c.at);
  const s = spring({ frame: f - at, fps, config: { damping: 13 } });
  const out = next != null && f >= sec(next);
  if (f < at) return null;
  return (
    <div
      style={{
        ...card,
        padding: "34px 40px",
        marginTop: 26,
        opacity: out ? 0.38 : s,
        transform: `scale(${out ? 0.94 : interpolate(s, [0, 1], [0.8, 1])})`,
        transformOrigin: "left center",
        fontSize: 68,
        fontWeight: 800,
        lineHeight: 1.15,
        letterSpacing: -1,
      }}
    >
      {c.nl} {c.emoji && <span style={{ color: c.emoji === "✓" ? L.past : undefined }}>{c.emoji}</span>}
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
    <div style={{ alignSelf: "flex-end", marginTop: 40, width: 780, padding: "34px 40px", background: "#fff4b8", borderRadius: 10, boxShadow: "0 18px 40px rgba(11,13,17,0.18)", transform: `rotate(${interpolate(pop, [0, 1], [-14, -4])}deg) scale(${interpolate(pop, [0, 1], [0.4, 1])})`, opacity: Math.min(1, pop * 1.5) }}>
      <div style={{ fontSize: 40, fontWeight: 800, color: RED, letterSpacing: 1, textTransform: "uppercase" }}>Oops!</div>
      <div style={{ fontSize: 76, fontWeight: 800, marginTop: 8, display: "flex", alignItems: "baseline", gap: 24, whiteSpace: "nowrap" }}>
        <span style={{ position: "relative", color: L.dim }}>
          {fix.wrong}
          <span style={{ position: "absolute", left: 0, top: "52%", height: 9, width: `${strike}%`, background: RED, borderRadius: 5, transform: "rotate(-6deg)" }} />
        </span>
        <span style={{ color: L.past, opacity: ok, display: "inline-block", transform: `scale(${interpolate(ok, [0, 1], [0.5, 1])})` }}>{fix.right} paard ✓</span>
      </div>
    </div>
  );
}

function Moment({ s, n }) {
  const a = useIn(0);
  const v = s.voice;
  return (
    <Safe>
      <div style={{ ...a.style, fontSize: 38, fontWeight: 800, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase" }}>
        Take {n} · {s.title}
      </div>
      {s.caps.map((c, i) => (
        <Caption key={i} c={{ ...c, at: v + c.at }} next={s.caps[i + 1] ? v + s.caps[i + 1].at : null} />
      ))}
      {s.fix && <Oops fix={s.fix} at={sec(v + s.fix.at)} />}
    </Safe>
  );
}

function Outro() {
  const a = useIn(0);
  const b = useIn(12, 12);
  return (
    <Safe>
      <div style={{ ...a.style, fontSize: 110, fontWeight: 800, letterSpacing: -3, lineHeight: 1.05 }}>
        He got there in the end! <span style={{ display: "inline-block", transform: `scale(${b.s})` }}>🎉</span>
      </div>
      <div style={{ ...b.style, ...card, marginTop: 60, padding: "40px 44px" }}>
        <div style={{ fontSize: 46, fontWeight: 700 }}>Learn all 7 Sinterklaas words with us</div>
        <div style={{ fontSize: 56, fontWeight: 800, color: RED, marginTop: 10 }}>Full video on YouTube 👆</div>
      </div>
    </Safe>
  );
}

export function SinterklaasBloopers() {
  let n = 0;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 80% 10%, #fde4e8 0%, ${L.bg} 50%)`, fontFamily, color: L.text }}>
      <Audio src={staticFile("sinterklaas_bloopers_voice.wav")} />
      {TL.scenes.map((s, i) => {
        const from = sec(s.start);
        const dur = Math.max(1, sec(s.start + s.dur) - from);
        if (s.kind === "moment") n += 1;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            {s.kind === "intro" ? <Intro /> : s.kind === "outro" ? <Outro /> : <Moment s={s} n={n} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
