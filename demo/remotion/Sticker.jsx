// Stickers with a QR code to the site (print: 8×8 cm, rendered at 3000 px).
// Variant "vraag": "Nederlands leren?" with an arrow to the QR code, dark.
// Variant "logo": logo and name above the QR code, light.
// The QR code points to /links, so what it leads to can change without reprinting.
import { AbsoluteFill } from "remotion";
import QRCode from "qrcode";
import { C, fontFamily } from "./Demo";

export const STICKER_URL = "https://mijntaalstudio.nl/links";

// Logo blocks (public/logo-icon.svg, viewBox 5 5 30 30).
const BLOCKS = [
  { x: 6, y: 26, fill: C.blue, o: 0.5 },
  { x: 16, y: 26, fill: C.blue, o: 0.75 },
  { x: 16, y: 16, fill: C.blue, o: 0.75 },
  { x: 26, y: 26, fill: C.green, o: 1 },
  { x: 26, y: 16, fill: C.green, o: 1 },
  { x: 26, y: 6, fill: C.orange, o: 1 },
];

function Logo({ size }) {
  return (
    <svg width={size} height={size} viewBox="5 5 30 30" style={{ display: "block" }}>
      {BLOCKS.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={8} height={8} rx={2} fill={b.fill} opacity={b.o} />
      ))}
    </svg>
  );
}

/**
 * The QR code on a white tile (with the quiet zone), the logo in the middle.
 * Error correction H, so the logo over the centre doesn't stop it scanning.
 */
function Qr({ size, url = STICKER_URL }) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const n = qr.modules.size;
  const quiet = 3;
  const total = n + quiet * 2;
  const cells = [];
  // The logo covers the middle 7×7 modules.
  const hole = 7;
  const from = (n - hole) / 2;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!qr.modules.get(x, y)) continue;
      if (x >= Math.floor(from) && x < Math.floor(from) + hole && y >= Math.floor(from) && y < Math.floor(from) + hole) continue;
      cells.push(<rect key={`${x}-${y}`} x={x + quiet} y={y + quiet} width={1.02} height={1.02} fill="#0b0d11" />);
    }
  }
  const mid = quiet + Math.floor(from);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${total} ${total}`} style={{ display: "block", borderRadius: size * 0.08, background: "#fff" }} shapeRendering="crispEdges">
      <rect width={total} height={total} fill="#fff" />
      {cells}
      <rect x={mid + 0.4} y={mid + 0.4} width={hole - 0.8} height={hole - 0.8} rx={1.2} fill={C.tile} />
      <svg x={mid + 1.1} y={mid + 1.1} width={hole - 2.2} height={hole - 2.2} viewBox="5 5 30 30" shapeRendering="geometricPrecision">
        {BLOCKS.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={8} height={8} rx={2} fill={b.fill} opacity={b.o} />
        ))}
      </svg>
    </svg>
  );
}

const gradient = (stops) => ({
  color: "transparent",
  backgroundImage: `linear-gradient(90deg, ${stops.join(", ")})`,
  WebkitBackgroundClip: "text",
});

/** The sticker shape: a rounded square on a transparent background (cut line = its edge). */
function Shape({ bg, children }) {
  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 130, background: bg, overflow: "hidden", fontFamily }}>{children}</div>
    </AbsoluteFill>
  );
}

export function StickerQuestion() {
  return (
    <Shape bg={`radial-gradient(circle at 25% 15%, #22304a 0%, ${C.bg} 70%)`}>
      <div style={{ position: "absolute", left: 80, top: 82, fontSize: 118, fontWeight: 800, letterSpacing: -4, lineHeight: 0.98, color: C.text }}>
        Nederlands
        <br />
        <span style={gradient([C.blue, C.green])}>leren?</span>
      </div>
      {/* A hand-drawn arrow from the question down to the code */}
      <svg width={300} height={300} viewBox="0 0 300 300" style={{ position: "absolute", left: 120, top: 330 }}>
        <defs>
          <linearGradient id="arrow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.green} />
            <stop offset="1" stopColor={C.orange} />
          </linearGradient>
        </defs>
        <path d="M30 20 C 20 150, 110 230, 250 235" fill="none" stroke="url(#arrow)" strokeWidth={18} strokeLinecap="round" />
        <path d="M205 190 L 255 236 L 200 275" fill="none" stroke={C.orange} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", right: 80, bottom: 150, boxShadow: "0 30px 80px rgba(0,0,0,0.5)", borderRadius: 40 }}>
        <Qr size={470} />
      </div>
      <div style={{ position: "absolute", left: 80, bottom: 70, display: "flex", alignItems: "center", gap: 18 }}>
        <Logo size={64} />
        <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1, ...gradient([C.blue, C.green, C.orange]) }}>mijntaalstudio.nl</span>
      </div>
    </Shape>
  );
}

export function StickerLogo() {
  return (
    <Shape bg="#ffffff">
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 46 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ background: C.tile, borderRadius: 30, padding: 14 }}>
            <Logo size={96} />
          </div>
          <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -3, color: "#0b0d11", lineHeight: 1 }}>
            <span style={{ fontSize: 46, fontWeight: 700, color: "#5b6472", letterSpacing: -1 }}>Mijn</span>
            <br />
            Taal Studio
          </div>
        </div>
        <div style={{ border: "6px solid #e6e8ec", borderRadius: 46 }}>
          <Qr size={500} />
        </div>
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1, ...gradient(["#2f7fe0", "#1fae62"]) }}>Scan · mijntaalstudio.nl</div>
      </div>
    </Shape>
  );
}
