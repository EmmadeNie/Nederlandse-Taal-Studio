// The link preview (Open Graph image, 1200×630) for WhatsApp, LinkedIn & co:
// logo, name and promise on the left, the app on a tilted screen on the right.
import { AbsoluteFill, Img, staticFile } from "remotion";
import { Backdrop, C, LogoMark, fontFamily, frameAt } from "./Demo";
import { MANIFESTS } from "./manifests";

/** A frame of the board recording, after the card turned green. */
function boardFrame(lang) {
  const m = MANIFESTS[lang]?.board;
  return m ? staticFile(`${lang}/board/${frameAt(m.frames, 7.2)}`) : null;
}

const PILLS = { nl: ["A0 – B2", "Eigen leerpad", "Oefenen", "Flashcards"], en: ["A0 – B2", "Own learning path", "Practice", "Flashcards"] };
const LINE = { nl: "Nederlands op jouw niveau", en: "Dutch at your level" };

export function Og({ lang = "nl" }) {
  const src = boardFrame(lang);
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: "scale(0.62)", transformOrigin: "0 0", width: 1920, height: 1200 }}>
        <Backdrop />
      </div>

      {src && (
        <div style={{ position: "absolute", left: 590, top: 70, perspective: 1800 }}>
          <div
            style={{
              width: 1440,
              height: 900,
              transform: "scale(0.6) rotateY(-16deg) rotateX(5deg)",
              transformOrigin: "0 0",
              borderRadius: 22,
              overflow: "hidden",
              boxShadow: "0 50px 140px rgba(0,0,0,0.7), 0 0 0 2px rgba(255,255,255,0.08)",
            }}
          >
            <Img src={src} style={{ width: 1440, height: 900, display: "block" }} />
          </div>
        </div>
      )}
      {/* Fade the screen into the background on the left, so the text reads well. */}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${C.bg} 38%, rgba(11,13,17,0.55) 60%, rgba(11,13,17,0) 80%)` }} />

      <div style={{ position: "absolute", left: 72, top: 92, width: 560 }}>
        <LogoMark size={104} delay={-120} />
        <div style={{ marginTop: 30, fontSize: 82, fontWeight: 800, letterSpacing: -3, color: C.text, lineHeight: 1 }}>Taal Studio</div>
        <div style={{ marginTop: 16, fontSize: 36, fontWeight: 500, color: C.dim, lineHeight: 1.2 }}>{LINE[lang]}</div>
        <div style={{ marginTop: 30, display: "flex", flexWrap: "wrap", gap: 12 }}>
          {PILLS[lang].map((p, i) => (
            <span
              key={p}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                fontSize: 22,
                fontWeight: 700,
                color: [C.blue, C.green, C.orange, C.blue][i],
                background: "rgba(255,255,255,0.06)",
                boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.12)",
              }}
            >
              {p}
            </span>
          ))}
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 34,
            fontWeight: 700,
            color: "transparent",
            backgroundImage: `linear-gradient(90deg, ${C.blue}, ${C.green} 60%, ${C.orange})`,
            WebkitBackgroundClip: "text",
          }}
        >
          mijntaalstudio.nl
        </div>
      </div>
    </AbsoluteFill>
  );
}
