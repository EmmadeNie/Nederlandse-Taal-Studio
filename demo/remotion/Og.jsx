// The link preview (Open Graph image, 1200×630) for WhatsApp, LinkedIn & co.
// Kept calm and centred: WhatsApp shows a small, almost square cut from the
// middle, so everything that matters sits in the centre and reads small.
import { AbsoluteFill, Img, staticFile } from "remotion";
import { Backdrop, C, LogoMark, fontFamily, frameAt } from "./Demo";
import { MANIFESTS } from "./manifests";

/** A frame of the board recording, as a faint backdrop. */
function boardFrame(lang) {
  const m = MANIFESTS[lang]?.board;
  return m ? staticFile(`${lang}/board/${frameAt(m.frames, 7.2)}`) : null;
}

const LINE = { nl: "Nederlands op jouw niveau", en: "Dutch at your level" };

export function Og({ lang = "nl" }) {
  const src = boardFrame(lang);
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily, overflow: "hidden" }}>
      {src && (
        <Img
          src={src}
          style={{
            position: "absolute",
            left: -60,
            top: -40,
            width: 1320,
            height: 825,
            objectFit: "cover",
            opacity: 0.22,
            filter: "blur(3px) saturate(0.8)",
          }}
        />
      )}
      <div style={{ position: "absolute", inset: 0, transform: "scale(0.62)", transformOrigin: "0 0", width: 1920, height: 1200, opacity: 0.9 }}>
        <Backdrop />
      </div>
      {/* Darker in the middle, so the name stands out. */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 46% 62% at 50% 50%, ${C.bg}f2 0%, ${C.bg}cc 55%, ${C.bg}55 100%)` }} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 26 }}>
        <LogoMark size={150} delay={-120} />
        <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: -4, color: C.text, lineHeight: 1 }}>Taal Studio</div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: "transparent",
            backgroundImage: `linear-gradient(90deg, ${C.blue}, ${C.green} 60%, ${C.orange})`,
            WebkitBackgroundClip: "text",
          }}
        >
          {LINE[lang]}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
