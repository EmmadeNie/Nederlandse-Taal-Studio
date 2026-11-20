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

/** Background of the light stickers: almost white, so it still reads as white but is not cut away as "empty". */
const LIGHT = "#f3f4f7";

const gradient = (stops) => ({
  color: "transparent",
  backgroundImage: `linear-gradient(90deg, ${stops.join(", ")})`,
  WebkitBackgroundClip: "text",
});

/** The sticker shape: a rounded square on a transparent background (cut line = its edge). */
function Shape({ bg, children }) {
  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      {/* Light stickers get a thin grey edge: it shows where the sticker ends on white, and lets cutters trace the outline. */}
      <div style={{ position: "absolute", inset: 0, borderRadius: 130, background: bg, overflow: "hidden", fontFamily, boxShadow: bg === LIGHT ? "inset 0 0 0 14px #c4cad3" : undefined }}>{children}</div>
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
    <Shape bg={LIGHT}>
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

/* ---------- More "Nederlands leren?" variants: smaller text, bigger code (good down to 6×6 cm) ---------- */

/** The question, in two parts: the second part gets the gradient. */
const ASK = { nl: ["Nederlands", "leren?"], en: ["Learning", "Dutch?"] };

const DARK_BG = `radial-gradient(circle at 25% 15%, #22304a 0%, ${C.bg} 70%)`;

function Url({ size = 40, dark = true }) {
  return (
    <span style={{ fontSize: size, fontWeight: 800, letterSpacing: -1, ...gradient(dark ? [C.blue, C.green, C.orange] : ["#2f7fe0", "#1fae62"]) }}>mijntaalstudio.nl</span>
  );
}

/** A: the original layout, text smaller and the code bigger. */
export function StickerQuestionSmall({ lang = "nl" }) {
  return (
    <Shape bg={DARK_BG}>
      <div style={{ position: "absolute", left: 80, top: 86, fontSize: 82, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1, color: C.text }}>
        {ASK[lang][0]}
        <br />
        <span style={gradient([C.blue, C.green])}>{ASK[lang][1]}</span>
      </div>
      <svg width={220} height={220} viewBox="0 0 300 300" style={{ position: "absolute", left: 100, top: 290 }}>
        <defs>
          <linearGradient id="arrowA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.green} />
            <stop offset="1" stopColor={C.orange} />
          </linearGradient>
        </defs>
        <path d="M30 20 C 20 150, 110 230, 250 235" fill="none" stroke="url(#arrowA)" strokeWidth={20} strokeLinecap="round" />
        <path d="M205 190 L 255 236 L 200 275" fill="none" stroke={C.orange} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", right: 70, bottom: 120, borderRadius: 40, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
        <Qr size={560} />
      </div>
      <div style={{ position: "absolute", left: 80, bottom: 60, display: "flex", alignItems: "center", gap: 14 }}>
        <Logo size={52} />
        <Url size={38} />
      </div>
    </Shape>
  );
}

/** B: centred: a small question with an arrow down, a big code, the address below. */
export function StickerQuestionCentre({ light = false, lang = "nl" }) {
  const text = light ? "#0b0d11" : C.text;
  return (
    <Shape bg={light ? LIGHT : DARK_BG}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 66, fontWeight: 800, letterSpacing: -2, color: text }}>
          <span>
            {ASK[lang][0]} <span style={gradient(light ? ["#2f7fe0", "#1fae62"] : [C.blue, C.green])}>{ASK[lang][1]}</span>
          </span>
          <svg width={54} height={62} viewBox="0 0 54 62">
            <path d="M27 6 L27 52 M10 36 L27 54 L44 36" fill="none" stroke={C.orange} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ borderRadius: 44, border: light ? "6px solid #e6e8ec" : "none", boxShadow: light ? "none" : "0 30px 80px rgba(0,0,0,0.5)" }}>
          <Qr size={620} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ background: C.tile, borderRadius: 14, padding: 6 }}>
            <Logo size={40} />
          </div>
          <Url size={40} dark={!light} />
        </div>
      </div>
    </Shape>
  );
}

export const StickerQuestionLight = ({ lang = "nl" }) => <StickerQuestionCentre light lang={lang} />;

/** C: the question in an orange label over the corner of a big code. */
export function StickerQuestionLabel({ lang = "nl" }) {
  return (
    <Shape bg={DARK_BG}>
      <div style={{ position: "absolute", left: "50%", top: 175, transform: "translateX(-50%)", borderRadius: 44 }}>
        <Qr size={620} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 52,
          padding: "16px 30px 20px",
          borderRadius: 999,
          background: C.orange,
          color: C.bg,
          fontSize: 54,
          fontWeight: 800,
          letterSpacing: -1.5,
          transform: "rotate(-6deg)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
        }}
      >
        {ASK[lang].join(" ")}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 74, display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
        <Logo size={50} />
        <Url size={44} />
      </div>
    </Shape>
  );
}

/** The variants side by side, to choose from. */
export function StickerOverview({ lang = "nl" }) {
  const items = [
    ["A", StickerQuestionSmall],
    ["B", StickerQuestionCentre],
    ["C", StickerQuestionLabel],
    ["D", StickerQuestionLight],
  ];
  return (
    <AbsoluteFill style={{ background: "#d9dce2", fontFamily, display: "grid", gridTemplateColumns: "1fr 1fr", padding: 60, gap: 60 }}>
      {items.map(([label, Comp]) => (
        <div key={label} style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1000, height: 1000, transform: "scale(0.88)", transformOrigin: "top left" }}>
            <div style={{ position: "relative", width: 1000, height: 1000 }}>
              <Comp lang={lang} />
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, top: 890, fontSize: 48, fontWeight: 800, color: "#0b0d11" }}>{label}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
}

/* ---------- Logo stickers: with a code (E, F) and without (G-J) ---------- */

/** Logo tile and "Mijn / Taal Studio", side by side. */
function Wordmark({ scale = 1, light = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 26 * scale }}>
      <div style={{ background: C.tile, borderRadius: 30 * scale, padding: 14 * scale, boxShadow: light ? "none" : "0 12px 30px rgba(0,0,0,0.4)" }}>
        <Logo size={96 * scale} />
      </div>
      <div style={{ fontSize: 84 * scale, fontWeight: 800, letterSpacing: -3 * scale, color: light ? "#0b0d11" : C.text, lineHeight: 1 }}>
        <span style={{ fontSize: 46 * scale, fontWeight: 700, color: light ? "#5b6472" : C.dim, letterSpacing: -1 * scale }}>Mijn</span>
        <br />
        Taal Studio
      </div>
    </div>
  );
}

const ASK_LINE = (lang) => ASK[lang].join(" ");

/** E / F: the wordmark on top, the code, the question below. */
export function StickerLogoQr({ lang = "nl", light = false }) {
  return (
    <Shape bg={light ? LIGHT : DARK_BG}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36 }}>
        <Wordmark scale={0.85} light={light} />
        <div style={{ borderRadius: 44, border: light ? "6px solid #e6e8ec" : "none", boxShadow: light ? "none" : "0 30px 80px rgba(0,0,0,0.5)" }}>
          <Qr size={560} />
        </div>
        <div style={{ fontSize: 50, fontWeight: 800, letterSpacing: -1.5, ...gradient(light ? ["#2f7fe0", "#1fae62"] : [C.blue, C.green]) }}>{ASK_LINE(lang)}</div>
      </div>
    </Shape>
  );
}
export const StickerLogoQrLight = ({ lang = "nl" }) => <StickerLogoQr lang={lang} light />;

/** G: just the logo, like the app icon. */
export function StickerIcon() {
  return (
    <Shape bg={`radial-gradient(circle at 50% 42%, #262b36 0%, ${C.bg} 75%)`}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={620} height={620} viewBox="5 5 30 30" style={{ transform: "translate(-30px, -30px)" }}>
          {BLOCKS.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={8} height={8} rx={2} fill={b.fill} opacity={b.o} />
          ))}
        </svg>
      </div>
    </Shape>
  );
}

/** H: the wordmark big, the address below. */
export function StickerWordmark({ light = false }) {
  return (
    <Shape bg={light ? LIGHT : DARK_BG}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 70 }}>
        <Wordmark scale={1.25} light={light} />
        <Url size={54} dark={!light} />
      </div>
    </Shape>
  );
}

/** I: logo, the question big, the address. */
export function StickerLogoQuestion({ lang = "nl" }) {
  return (
    <Shape bg={DARK_BG}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", padding: "0 100px", gap: 48 }}>
        <div style={{ background: C.tile, borderRadius: 44, padding: 20, boxShadow: "0 16px 40px rgba(0,0,0,0.45)" }}>
          <Logo size={170} />
        </div>
        <div style={{ fontSize: 132, fontWeight: 800, letterSpacing: -5, lineHeight: 0.98, color: C.text }}>
          {ASK[lang][0]}
          <br />
          <span style={gradient([C.blue, C.green])}>{ASK[lang][1]}</span>
        </div>
        <Url size={50} />
      </div>
    </Shape>
  );
}

/** J: light, the wordmark with the question as a small line. */
export function StickerWordmarkQuestion({ lang = "nl" }) {
  return (
    <Shape bg={LIGHT}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 56 }}>
        <div style={{ fontSize: 60, fontWeight: 800, letterSpacing: -2, color: "#0b0d11" }}>
          {ASK[lang][0]} <span style={gradient(["#2f7fe0", "#1fae62"])}>{ASK[lang][1]}</span>
        </div>
        <Wordmark scale={1.15} light />
        <Url size={50} dark={false} />
      </div>
    </Shape>
  );
}

/** The logo variants side by side (E-J). */
export function StickerLogoOverview({ lang = "nl" }) {
  const items = [
    ["E", StickerLogoQr],
    ["F", StickerLogoQrLight],
    ["G", StickerIcon],
    ["H", StickerWordmark],
    ["I", StickerLogoQuestion],
    ["J", StickerWordmarkQuestion],
  ];
  return (
    <AbsoluteFill style={{ background: "#d9dce2", fontFamily, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr", padding: 60, gap: 60 }}>
      {items.map(([label, Comp]) => (
        <div key={label} style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1000, height: 1000, transform: "scale(0.88)", transformOrigin: "top left" }}>
            <div style={{ position: "relative", width: 1000, height: 1000 }}>
              <Comp lang={lang} />
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, top: 890, fontSize: 48, fontWeight: 800, color: "#0b0d11" }}>{label}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
}

/* ---------- The print sheet: every sticker once, 5×5 cm, for StickerApp ---------- */

// 10 px = 1 mm. Stickers 50 mm, 3 mm apart, 4 mm from the edge: 270 × 217 mm.
export const SHEET = { mm: 10, size: 50, gap: 3, margin: 4, cols: 5 };

const SHEET_ITEMS = [
  [StickerQuestion, {}],
  [StickerQuestionSmall, { lang: "en" }],
  [StickerQuestionSmall, { lang: "nl" }],
  [StickerQuestionCentre, { lang: "en" }],
  [StickerQuestionCentre, { lang: "nl" }],
  [StickerLogo, {}],
  [StickerQuestionLabel, { lang: "en" }],
  [StickerQuestionLabel, { lang: "nl" }],
  [StickerQuestionLight, { lang: "en" }],
  [StickerQuestionLight, { lang: "nl" }],
  [StickerLogoQr, { lang: "en" }],
  [StickerLogoQr, { lang: "nl" }],
  [StickerLogoQrLight, { lang: "en" }],
  [StickerLogoQrLight, { lang: "nl" }],
  [StickerIcon, {}],
  [StickerLogoQuestion, { lang: "en" }],
  [StickerLogoQuestion, { lang: "nl" }],
  [StickerWordmarkQuestion, { lang: "en" }],
  [StickerWordmarkQuestion, { lang: "nl" }],
  [StickerWordmark, {}],
];

export const sheetSize = () => {
  const { mm, size, gap, margin, cols } = SHEET;
  const rows = Math.ceil(SHEET_ITEMS.length / cols);
  return { width: (margin * 2 + cols * size + (cols - 1) * gap) * mm, height: (margin * 2 + rows * size + (rows - 1) * gap) * mm };
};

/** All stickers on one transparent sheet; the printer cuts along each sticker's edge. */
export function StickerSheet() {
  const { mm, size, gap, margin, cols } = SHEET;
  const px = size * mm;
  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      {SHEET_ITEMS.map(([Comp, props], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: (margin + (i % cols) * (size + gap)) * mm,
            top: (margin + Math.floor(i / cols) * (size + gap)) * mm,
            width: px,
            height: px,
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative", width: 1000, height: 1000, transform: `scale(${px / 1000})`, transformOrigin: "top left" }}>
            <Comp {...props} />
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
}
