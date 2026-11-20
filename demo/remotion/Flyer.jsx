// A6 flyers (105 × 148 mm, double-sided) in the style of the QR stickers.
// The canvas includes 3 mm bleed on every side: 111 × 154 mm at 10 px per mm.
// Render with --scale=1.5 for print (15 px/mm, 381 dpi).
// Three variants: A dark with the question and an arrow, B light and centred,
// C dark with the levels A0-B2 as steps. The back lists the free content.
import { AbsoluteFill } from "remotion";
import { C, fontFamily } from "./Demo";
import { ASK, DARK_BG, Logo, Qr, Url, Wordmark, gradient } from "./Sticker";

export const FLYER = { mm: 10, width: 105, height: 148, bleed: 3 };
export const flyerSize = () => ({ width: (FLYER.width + 2 * FLYER.bleed) * FLYER.mm, height: (FLYER.height + 2 * FLYER.bleed) * FLYER.mm });

const BLEED = FLYER.bleed * FLYER.mm;
// Text and the code stay 6 mm inside the trim, clear of any cutting slack.
const PAD = BLEED + 60;

const INK = "#0b0d11";
const GREY = "#5b6472";
const LIGHT_GRAD = ["#2f7fe0", "#1fae62"];

const TEXT = {
  nl: {
    sub: "Gratis uitleg, video's en oefeningen",
    free: "Gratis",
    scan: "Scan en begin meteen",
    levels: ["Van A0 tot B2,", "stap voor stap"],
    title: ["Leer Nederlands", "op jouw niveau"],
    items: [
      ["Grammatica, helder uitgelegd", "Van A0 tot B2, met voorbeelden"],
      ["Quizzen & lesvideo's", "Op YouTube: kijk, luister, test jezelf"],
      ["Flashcards & oefeningen", "In de app, met je eigen leerpad"],
      ["@mijntaalstudio", "Tips en nieuwe lessen op Instagram"],
    ],
    all: "Alles op één plek:",
    teacher: "Liever les met een docent? Kan ook, online of in Rotterdam.",
  },
  en: {
    sub: "Free explanations, videos and practice",
    free: "Free",
    scan: "Scan and start right away",
    levels: ["From A0 to B2,", "step by step"],
    title: ["Learn Dutch", "at your level"],
    items: [
      ["Grammar, clearly explained", "From A0 to B2, with examples"],
      ["Quizzes & lesson videos", "On YouTube: watch, listen, test yourself"],
      ["Flashcards & exercises", "In the app, with your own learning path"],
      ["@mijntaalstudio", "Tips and new lessons on Instagram"],
    ],
    all: "Everything in one place:",
    teacher: "Prefer a teacher? Lessons online or in Rotterdam.",
  },
};

/** The page: the background runs into the bleed; `guides` draws the trim and safe lines (previews only). */
function Page({ bg, guides, children }) {
  return (
    <AbsoluteFill style={{ background: bg, fontFamily, overflow: "hidden" }}>
      {children}
      {guides && (
        <>
          <div style={{ position: "absolute", inset: BLEED, border: "3px dashed #ff2bd6" }} />
          <div style={{ position: "absolute", inset: PAD, border: "2px dotted #00c2ff" }} />
        </>
      )}
    </AbsoluteFill>
  );
}

const Arrow = ({ id, size }) => (
  <svg width={size} height={size} viewBox="0 0 300 300" style={{ display: "block" }}>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={C.green} />
        <stop offset="1" stopColor={C.orange} />
      </linearGradient>
    </defs>
    <path d="M30 20 C 20 150, 110 230, 250 235" fill="none" stroke={`url(#${id})`} strokeWidth={20} strokeLinecap="round" />
    <path d="M205 190 L 255 236 L 200 275" fill="none" stroke={C.orange} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Pill = ({ children, size = 54, rotate = -6 }) => (
  <div
    style={{
      display: "inline-block",
      padding: `${size * 0.28}px ${size * 0.6}px ${size * 0.36}px`,
      borderRadius: 999,
      background: C.orange,
      color: C.bg,
      fontSize: size,
      fontWeight: 800,
      letterSpacing: -1.5,
      lineHeight: 1,
      transform: `rotate(${rotate}deg)`,
      boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
    }}
  >
    {children}
  </div>
);

/* ---------- Fronts ---------- */

/** A: the sticker layout on paper: question top left, arrow, big code, address. */
function FrontA({ lang, guides }) {
  const t = TEXT[lang];
  return (
    <Page bg={DARK_BG} guides={guides}>
      <div style={{ position: "absolute", left: PAD, top: PAD + 20 }}>
        <div style={{ fontSize: 138, fontWeight: 800, letterSpacing: -5, lineHeight: 0.98, color: C.text }}>
          {ASK[lang][0]}
          <br />
          <span style={gradient([C.blue, C.green])}>{ASK[lang][1]}</span>
        </div>
        <div style={{ marginTop: 34, fontSize: 44, fontWeight: 700, letterSpacing: -1, color: C.dim }}>{t.sub}</div>
      </div>
      <div style={{ position: "absolute", left: PAD + 20, top: 640 }}>
        <Arrow id={`flyer-a-${lang}`} size={290} />
      </div>
      <div style={{ position: "absolute", right: PAD, bottom: PAD + 120, borderRadius: 48, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
        <Qr size={600} />
      </div>
      <div style={{ position: "absolute", left: PAD, right: PAD, bottom: PAD, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Logo size={58} />
          <Url size={44} />
        </div>
        <div style={{ fontSize: 34, fontWeight: 700, color: C.dim }}>@mijntaalstudio</div>
      </div>
    </Page>
  );
}

/** B: light and centred: wordmark, question, code in a frame, address. */
function FrontB({ lang, guides }) {
  const t = TEXT[lang];
  return (
    <Page bg="#ffffff" guides={guides}>
      <div style={{ position: "absolute", inset: PAD, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
        <Wordmark scale={0.9} light />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: -4, lineHeight: 1, color: INK }}>
            {ASK[lang][0]} <span style={gradient(LIGHT_GRAD)}>{ASK[lang][1]}</span>
          </div>
          <div style={{ marginTop: 22, fontSize: 42, fontWeight: 700, letterSpacing: -1, color: GREY }}>{t.sub}</div>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ border: "8px solid #e6e8ec", borderRadius: 56 }}>
            <Qr size={600} />
          </div>
          <div style={{ position: "absolute", right: -46, top: -40 }}>
            <Pill size={44} rotate={8}>{t.free}</Pill>
          </div>
        </div>
        <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: -1, ...gradient(LIGHT_GRAD) }}>Scan · mijntaalstudio.nl</div>
      </div>
    </Page>
  );
}

// The levels as steps, in the colours and shape of the logo blocks.
const STEPS = [
  { label: "A0", fill: C.blue, o: 0.5 },
  { label: "A1", fill: C.blue, o: 0.75 },
  { label: "A2", fill: C.green, o: 0.85 },
  { label: "B1", fill: C.green, o: 1 },
  { label: "B2", fill: C.orange, o: 1 },
];

function Steps({ block = 150, rise = 62, gap = 20 }) {
  const height = block + rise * (STEPS.length - 1);
  return (
    <div style={{ position: "relative", width: STEPS.length * block + (STEPS.length - 1) * gap, height }}>
      {STEPS.map((s, i) => (
        <div
          key={s.label}
          style={{
            position: "absolute",
            left: i * (block + gap),
            top: height - block - i * rise,
            width: block,
            height: block,
            borderRadius: block * 0.25,
            background: s.fill,
            opacity: s.o,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: block * 0.36,
            fontWeight: 800,
            color: C.bg,
          }}
        >
          {s.label}
        </div>
      ))}
    </div>
  );
}

/** C: an orange "Free" label, the question, the levels A0-B2 as steps, code and address. */
function FrontC({ lang, guides }) {
  const t = TEXT[lang];
  return (
    <Page bg={DARK_BG} guides={guides}>
      <div style={{ position: "absolute", inset: PAD, display: "flex", flexDirection: "column" }}>
        <div style={{ alignSelf: "flex-start", marginTop: 10 }}>
          <Pill size={52}>{t.free}</Pill>
        </div>
        <div style={{ marginTop: 44, fontSize: 124, fontWeight: 800, letterSpacing: -4.5, lineHeight: 0.98, color: C.text }}>
          {ASK[lang][0]}
          <br />
          <span style={gradient([C.blue, C.green])}>{ASK[lang][1]}</span>
        </div>
        <div style={{ marginTop: 56 }}>
          <Steps />
        </div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 22, paddingBottom: 6 }}>
            <div style={{ fontSize: 50, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.05, color: C.text }}>
              {t.levels[0]}
              <br />
              <span style={gradient([C.green, C.orange])}>{t.levels[1]}</span>
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, color: C.dim }}>{t.scan}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18 }}>
              <Logo size={50} />
              <Url size={38} />
            </div>
          </div>
          <div style={{ borderRadius: 40, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
            <Qr size={440} />
          </div>
        </div>
      </div>
    </Page>
  );
}

/* ---------- Back: what's free ---------- */

// Simple line icons (24×24), drawn in the tile's ink colour.
const ICONS = [
  (ink) => (
    <text x="12" y="17.5" textAnchor="middle" fontSize="15" fontWeight="800" fill={ink} fontFamily={fontFamily}>
      Aa
    </text>
  ),
  (ink) => (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="4" fill="none" stroke={ink} strokeWidth="2.2" />
      <path d="M10 9 L15.5 12 L10 15 Z" fill={ink} />
    </>
  ),
  (ink) => (
    <>
      <rect x="7" y="3" width="13" height="15" rx="2.5" fill="none" stroke={ink} strokeWidth="2.2" opacity="0.55" />
      <rect x="4" y="6" width="13" height="15" rx="2.5" fill="none" stroke={ink} strokeWidth="2.2" />
    </>
  ),
  (ink) => (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke={ink} strokeWidth="2.2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke={ink} strokeWidth="2.2" />
      <circle cx="17" cy="7" r="1.3" fill={ink} />
    </>
  ),
];
const ICON_FILLS = [C.blue, C.orange, C.green, `linear-gradient(135deg, ${C.blue}, ${C.green}, ${C.orange})`];

function Back({ lang, light = false, guides }) {
  const t = TEXT[lang];
  const text = light ? INK : C.text;
  const dim = light ? GREY : C.dim;
  const grad = light ? LIGHT_GRAD : [C.blue, C.green];
  return (
    <Page bg={light ? "#ffffff" : DARK_BG} guides={guides}>
      <div style={{ position: "absolute", inset: PAD, display: "flex", flexDirection: "column" }}>
        <div style={{ alignSelf: "flex-start", marginTop: 6 }}>
          <Pill size={44} rotate={-4}>{t.free}</Pill>
        </div>
        <div style={{ marginTop: 34, fontSize: 92, fontWeight: 800, letterSpacing: -3.5, lineHeight: 1, color: text }}>
          {t.title[0]}
          <br />
          <span style={gradient(grad)}>{t.title[1]}</span>
        </div>
        <div style={{ marginTop: 64, display: "flex", flexDirection: "column", gap: 40 }}>
          {t.items.map(([title, sub], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 34 }}>
              <div style={{ flex: "none", width: 108, height: 108, borderRadius: 28, background: ICON_FILLS[i], display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={66} height={66} viewBox="0 0 24 24">
                  {ICONS[i](C.bg)}
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.1, color: text }}>{title}</div>
                <div style={{ marginTop: 6, fontSize: 33, fontWeight: 500, lineHeight: 1.2, color: dim }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 44 }}>
          <div style={{ flex: "none", borderRadius: 30, border: light ? "6px solid #e6e8ec" : "none", boxShadow: light ? "none" : "0 20px 50px rgba(0,0,0,0.45)" }}>
            <Qr size={300} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Wordmark scale={0.62} light={light} />
            <div style={{ marginTop: 14, fontSize: 32, fontWeight: 700, color: dim }}>{t.all}</div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1, ...gradient(light ? LIGHT_GRAD : [C.blue, C.green, C.orange]) }}>mijntaalstudio.nl/links</div>
          </div>
        </div>
        <div style={{ marginTop: 40, paddingTop: 26, borderTop: `3px solid ${light ? "#e6e8ec" : "rgba(230,232,236,0.14)"}`, fontSize: 30, fontWeight: 500, color: dim }}>{t.teacher}</div>
      </div>
    </Page>
  );
}

export const FLYER_VARIANTS = {
  a: { front: FrontA, back: (p) => <Back {...p} /> },
  b: { front: FrontB, back: (p) => <Back {...p} light /> },
  c: { front: FrontC, back: (p) => <Back {...p} /> },
};

/** One side of one variant, at full size with bleed. */
export function Flyer({ variant = "a", side = "front", lang = "nl", guides = false }) {
  const Comp = FLYER_VARIANTS[variant][side];
  return <Comp lang={lang} guides={guides} />;
}

/** All variants, front above back, cut to the trim size (no bleed), to choose from. */
export const OVERVIEW = { scale: 0.5, pad: 60, gap: 50, label: 80 };
export const flyerOverviewSize = () => {
  const { scale, pad, gap, label } = OVERVIEW;
  const w = FLYER.width * FLYER.mm * scale;
  const h = FLYER.height * FLYER.mm * scale;
  const n = Object.keys(FLYER_VARIANTS).length;
  return { width: Math.round(pad * 2 + n * w + (n - 1) * gap), height: Math.round(pad * 2 + label + 2 * h + gap) };
};

export function FlyerOverview({ lang = "nl" }) {
  const { scale, pad, gap, label } = OVERVIEW;
  const { width, height } = flyerSize();
  const w = FLYER.width * FLYER.mm * scale;
  const h = FLYER.height * FLYER.mm * scale;
  return (
    <AbsoluteFill style={{ background: "#d9dce2", fontFamily }}>
      {Object.keys(FLYER_VARIANTS).map((v, col) =>
        ["front", "back"].map((side, row) => (
          <div
            key={`${v}-${side}`}
            style={{
              position: "absolute",
              left: pad + col * (w + gap),
              top: pad + label + row * (h + gap),
              width: w,
              height: h,
              overflow: "hidden",
              borderRadius: 6,
              boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ position: "absolute", left: -BLEED * scale, top: -BLEED * scale, width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <div style={{ position: "relative", width, height }}>
                <Flyer variant={v} side={side} lang={lang} />
              </div>
            </div>
          </div>
        )),
      )}
      {Object.keys(FLYER_VARIANTS).map((v, col) => (
        <div key={v} style={{ position: "absolute", left: pad + col * (w + gap), top: pad, fontSize: 48, fontWeight: 800, color: INK }}>
          {v.toUpperCase()}
        </div>
      ))}
    </AbsoluteFill>
  );
}
