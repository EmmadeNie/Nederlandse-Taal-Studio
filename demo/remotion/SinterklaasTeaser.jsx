// Instagram story (9:16, 10 s): "New post!" teaser for the Sinterklaas carousel.
// Needs in the public dir: carousel/s1…s9.jpg (the carousel slides) and teaser_music.wav.
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoMark, fontFamily } from "./Demo";
import { L } from "./Carousel";
import { RED, GOLD } from "./Sinterklaas";

export const TEASER_FPS = 30;
export const TEASER_FRAMES = 10 * TEASER_FPS;
const SLIDES = ["s1", "s3", "s5", "s6", "s7", "s9"];
const FLIP = 26; // frames per slide

function Safe({ children, style }) {
  return <div style={{ position: "absolute", left: 80, right: 80, top: 260, bottom: 320, display: "flex", flexDirection: "column", alignItems: "center", ...style }}>{children}</div>;
}

export function SinterklaasTeaser() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f, fps, config: { damping: 11 } });
  const cardIn = spring({ frame: f - 20, fps, config: { damping: 16 } });
  const flipStart = 40;
  const end = flipStart + SLIDES.length * FLIP; // ~196
  const outro = spring({ frame: f - end, fps, config: { damping: 12 } });
  const idx = Math.max(0, Math.min(SLIDES.length - 1, Math.floor((f - flipStart) / FLIP)));
  const local = (f - flipStart) % FLIP;
  const swipe = f < flipStart ? 0 : interpolate(local, [FLIP - 7, FLIP], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lastShown = f >= end;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 80% 10%, #fde4e8 0%, ${L.bg} 55%)`, fontFamily, color: L.text }}>
      <Audio src={staticFile("teaser_music.wav")} />
      <Safe>
        <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: pop }}>
          <LogoMark size={64} delay={-60} />
          <span style={{ fontSize: 36, fontWeight: 800 }}>@mijntaalstudio</span>
        </div>
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -4, marginTop: 24, transform: `scale(${interpolate(pop, [0, 1], [0.6, 1])})` }}>
          New <span style={{ color: RED }}>post!</span> 🎁
        </div>
        {/* The carousel, one slide after the other as if swiped. */}
        <div style={{ position: "relative", width: 640, height: 800, marginTop: 40, opacity: cardIn, transform: `translateY(${interpolate(cardIn, [0, 1], [120, 0])}px) rotate(-3deg)` }}>
          {[idx, Math.min(idx + 1, SLIDES.length - 1)].map((k, j) => (
            <Img
              key={`${k}-${j}`}
              src={staticFile(`carousel/${SLIDES[k]}.jpg`)}
              style={{
                position: "absolute",
                inset: 0,
                width: 640,
                height: 800,
                borderRadius: 28,
                boxShadow: "0 24px 60px rgba(11,13,17,0.22)",
                transform: j === 0 ? `translateX(${lastShown ? 0 : -swipe * 700}px) rotate(${-swipe * 8}deg)` : "none",
                opacity: j === 0 ? 1 : lastShown ? 0 : swipe,
                zIndex: j === 0 ? 2 : 1,
              }}
            />
          ))}
        </div>
        <div style={{ position: "absolute", bottom: -10, left: 0, right: 0, textAlign: "center", opacity: outro, transform: `translateY(${interpolate(outro, [0, 1], [40, 0])}px)` }}>
          <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.15 }}>Sinterklaas in 7 words</div>
          <div style={{ fontSize: 46, fontWeight: 800, color: GOLD, marginTop: 10 }}>Tap to see the post ☝️</div>
        </div>
      </Safe>
    </AbsoluteFill>
  );
}
