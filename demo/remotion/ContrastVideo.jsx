// "Which word?" lessons, in English: niet or geen, huis or thuis. Same build as the
// inversion short (white, "spot the mistake" from frame 0), music only for now.
// One lesson per topic: a short lesson (9:16 for Shorts/Reels, 16:9 for YouTube), a ~25 s
// teaser (9:16) that sends viewers to the full lesson, and the same teaser as an Instagram
// story with room for a link sticker. Text: nietGeen.json, huisThuis.json.
// {word} = one of the topic's words in its own colour; *x* = Dutch inside English, italic.
import { createContext, useContext } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoMark, fontFamily } from "./Demo";
import { L } from "./Carousel";
import { RED, GOLD } from "./Sinterklaas";
import NIET_GEEN from "./nietGeen.json";
import HUIS_THUIS from "./huisThuis.json";

export const CONTRAST_TOPICS = { "niet-geen": NIET_GEEN, "huis-thuis": HUIS_THUIS };
export const CON_FPS = 30;
export const CON_SIZE = { width: 1080, height: 1920 };
export const CON_WIDE = { width: 1920, height: 1080 };

const GREEN = L.past;
const COLOURS = { blue: L.perfect, green: L.past, orange: L.accent, red: RED };
const sec = (s) => Math.round(s * CON_FPS);
const FADE = 6;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
const card = { background: L.card, border: `2px solid ${L.line}`, borderRadius: 32, boxShadow: "0 10px 30px rgba(11,13,17,0.06)" };

const Topic = createContext(NIET_GEEN);
const useTopic = () => useContext(Topic);
const colourOf = (C, w) => COLOURS[C.words[w.toLowerCase()]] ?? L.accent;

// Layout per format, as in the inversion short: the Short (Reels/Shorts UI at the bottom),
// the story (Instagram covers ~260px at the top and ~300px at the bottom) and 16:9.
const FORMATS = {
  short: { v: true, body: { left: 70, right: 90, top: 330, bottom: 380 }, header: 110, chips: true },
  story: { v: true, body: { left: 80, right: 80, top: 400, bottom: 300 }, header: 270, chips: false, scale: 0.84 },
  wide: { v: false, body: { left: 120, right: 120, top: 170, bottom: 90 }, header: 50, chips: true },
};
const Fmt = createContext(FORMATS.short);
const useFmt = () => useContext(Fmt);

/** A scene's length in seconds: dur, or for a story the sum of its beats. */
const sceneDur = (s) => s.dur ?? s.beats.reduce((n, b) => n + b.dur, 0);

/** The scenes of a cut, each with its start and length in frames. */
const plans = {};
function planOf(topic, cut) {
  return (plans[`${topic}-${cut}`] ??= (() => {
    const C = CONTRAST_TOPICS[topic];
    const ids = cut === "full" ? C.scenes.filter((s) => !s.cut).map((s) => s.id) : C.cuts[cut];
    let at = 0;
    return ids.map((id) => {
      const s = C.scenes.find((x) => x.id === id);
      const t = { s, from: at, len: sec(sceneDur(s)) };
      at += t.len;
      return t;
    });
  })());
}
export const contrastDuration = (topic, cut = "full") => planOf(topic, cut).reduce((n, t) => n + t.len, 0);

function useIn(at = 0) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 200 } });
  return { opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)` };
}

/** Text with {topic words} in their colour, *Dutch words* in italics and **English words** in
 *  bold (the "a" in "I have a car"). In English lines (italic = true) the topic words are
 *  italic too, as they are Dutch. */
function Text({ text, italic = false }) {
  const C = useTopic();
  return text
    .split(/(\{[^}]+\}|\*\*[^*]+\*\*|\*[^*]+\*)/)
    .filter(Boolean)
    .map((p, i) => {
      if (p.length > 4 && p.startsWith("**") && p.endsWith("**"))
        return (
          <strong key={i} style={{ fontWeight: 800, color: L.text }}>
            {p.slice(2, -2)}
          </strong>
        );
      if (p.startsWith("{") && p.endsWith("}")) {
        const w = p.slice(1, -1);
        return (
          <span key={i} style={{ color: colourOf(C, w), fontWeight: 800, fontStyle: italic ? "italic" : "normal" }}>
            {w}
          </span>
        );
      }
      if (p.length > 2 && p.startsWith("*") && p.endsWith("*")) return <em key={i}>{p.slice(1, -1)}</em>;
      return p;
    });
}

/** A topic word as a filled pill. */
function Word({ w, size, style }) {
  const C = useTopic();
  return <span style={{ display: "inline-block", fontSize: size, fontWeight: 800, fontStyle: "italic", color: "#fff", background: colourOf(C, w), borderRadius: 999, padding: `${size * 0.12}px ${size * 0.45}px`, whiteSpace: "nowrap", ...style }}>{w}</span>;
}

function Header({ section, present }) {
  const C = useTopic();
  const z = useFmt();
  return (
    <div style={{ position: "absolute", left: z.body.left, right: z.v ? 70 : z.body.right, top: z.header, display: "flex", flexDirection: z.v ? "column" : "row", justifyContent: "space-between", alignItems: z.v ? "stretch" : "center", gap: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: z.v ? 36 : 32, fontWeight: 800 }}>
        <LogoMark size={z.v ? 64 : 56} delay={-60} />
        Taal Studio <span style={{ color: L.dim, fontWeight: 600 }}>· {C.series}</span>
      </div>
      <div style={{ display: z.chips ? "flex" : "none", gap: 10 }}>
        {Object.entries(C.chips)
          .filter(([id]) => present.has(id))
          .map(([id, label]) => {
          const on = id === section;
          return (
            <span key={id} style={{ fontSize: 24, fontWeight: 800, padding: "8px 18px", borderRadius: 999, color: on ? "#fff" : L.dim, background: on ? RED : "#e9ebf0" }}>
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Body({ children, center }) {
  const { body } = useFmt();
  return <div style={{ position: "absolute", ...body, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: center ? "center" : "stretch", textAlign: center ? "center" : "left" }}>{children}</div>;
}

function Kicker({ children, style }) {
  return <div style={{ fontSize: 36, fontWeight: 800, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 22, ...style }}>{children}</div>;
}

function Gloss({ children, style }) {
  return <div style={{ fontSize: 38, color: L.dim, marginTop: 12, fontStyle: "italic", ...style }}>{children}</div>;
}

function Bar({ progress, colour }) {
  return (
    <div style={{ height: 14, borderRadius: 7, background: "#e9ebf0", marginTop: 34, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${progress * 100}%`, background: colour }} />
    </div>
  );
}

/** The hook: a wrong sentence, complete on its first frame; a countdown; then the right one and why. */
function Spot({ s, pos }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const z = useFmt();
  const reveal = sec(s.reveal);
  const shown = f >= reveal;
  const c = useIn(reveal);
  const d = useIn(reveal + 12);
  const left = Math.max(0, Math.ceil((reveal - f) / fps));
  const dim = interpolate(f, [reveal, reveal + 8], [1, 0.45], clamp);
  const size = z.v ? 84 : 74;
  const sentence = { fontSize: size, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.2 };
  return (
    <Body>
      <Kicker style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Spot the mistake 🔍</span>
        <span style={{ color: shown ? L.dim : RED }}>{shown ? `${pos.n}/${pos.total}` : left}</span>
      </Kicker>
      <div style={{ ...card, padding: "40px 44px", display: "flex", alignItems: "flex-start", gap: 26, opacity: dim }}>
        <span style={{ fontSize: 64, lineHeight: 1.25, opacity: shown ? 1 : 0.35 }}>{shown ? "❌" : "🤔"}</span>
        <span style={{ ...sentence, textDecoration: shown ? "line-through" : "none", textDecorationColor: RED, textDecorationThickness: 6 }}>{s.wrong}</span>
      </div>
      {!shown && (
        <>
          <div style={{ fontSize: 52, fontWeight: 800, marginTop: 34 }}>What's wrong?</div>
          <Bar progress={interpolate(f, [0, reveal], [1, 0], clamp)} colour={RED} />
        </>
      )}
      {shown && (
        <>
          <div style={{ ...c, ...card, padding: "40px 44px 34px", display: "flex", alignItems: "flex-start", gap: 26, marginTop: 26, border: `3px solid ${GREEN}` }}>
            <span style={{ fontSize: 64, lineHeight: 1.25 }}>✅</span>
            <div>
              <div style={sentence}>
                <Text text={s.right} />
              </div>
              <Gloss>
                <Text text={s.en} />
              </Gloss>
            </div>
          </div>
          <div style={{ ...d, fontSize: 46, fontWeight: 800, marginTop: 30, lineHeight: 1.3 }}>
            ↳ <Text text={s.why} italic />
          </div>
        </>
      )}
    </Body>
  );
}

/** "Both mean not": the topic's words side by side. */
function Title({ s }) {
  const z = useFmt();
  const a = useIn(0);
  const b = useIn(8);
  const c = useIn(sec(1.6));
  const many = s.words.length > 2;
  return (
    <Body>
      <Kicker style={a}>{s.kicker}</Kicker>
      <div style={{ ...a, fontSize: z.v ? 96 : 92, fontWeight: 800, letterSpacing: -3.5, lineHeight: 1.05 }}>
        <Text text={s.big} />
      </div>
      <div style={{ ...b, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 22, marginTop: 50 }}>
        {s.words.map((w, i) => (
          <span key={w} style={{ display: "flex", alignItems: "center", gap: 22 }}>
            {i > 0 && !many && <span style={{ fontSize: 48, fontWeight: 800, color: L.dim }}>or</span>}
            <Word w={w} size={many ? 72 : 96} />
          </span>
        ))}
      </div>
      <div style={{ ...c, fontSize: 52, fontWeight: 700, color: L.dim, marginTop: 50, lineHeight: 1.3 }}>{s.sub}</div>
    </Body>
  );
}

/** een → geen, huis → thuis: the new letter drops into place. */
function Morph({ m, at }) {
  const C = useTopic();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const z = useFmt();
  const a = useIn(at);
  const n = useIn(at + sec(1.6));
  const drop = spring({ frame: f - at - sec(0.9), fps, config: { damping: 9, stiffness: 120 } });
  const colour = colourOf(C, m.add + m.base);
  const big = !m.pre && !m.post;
  return (
    <div style={{ ...a, ...card, padding: "30px 44px", marginTop: 34, alignSelf: big ? "flex-start" : "stretch" }}>
      <div style={{ fontSize: big ? 120 : z.v ? 80 : 76, fontWeight: 800, letterSpacing: -1.5, whiteSpace: "nowrap", lineHeight: 1.25 }}>
        {m.pre}
        <span style={{ display: "inline-block", color: colour, opacity: Math.min(1, drop * 1.5), transform: `translateY(${(1 - drop) * -140}px) rotate(${(1 - drop) * -25}deg)` }}>{m.add}</span>
        <span style={{ color: drop > 0.6 ? colour : L.text }}>{m.base}</span>
        {m.post}
      </div>
      {m.note && (
        <div style={{ ...n, fontSize: 40, fontWeight: 700, color: L.dim, marginTop: 6 }}>
          <Text text={m.note} italic />
        </div>
      )}
    </div>
  );
}

function Row({ r, at }) {
  const a = useIn(at);
  const z = useFmt();
  return (
    <div style={{ ...a, ...card, padding: "24px 36px 22px" }}>
      <div style={{ fontSize: z.v ? 60 : 56, fontWeight: 800, letterSpacing: -1, lineHeight: 1.2 }}>
        <Text text={r.nl} />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 10 }}>
        <span style={{ flex: "none", fontSize: 28, fontWeight: 800, color: L.dim, background: "#e9ebf0", borderRadius: 999, padding: "4px 16px" }}>
          <Text text={r.label} italic />
        </span>
        <span style={{ fontSize: 34, color: L.dim, fontStyle: "italic" }}>
          <Text text={r.en} />
        </span>
      </div>
    </div>
  );
}

/** A rule: kicker, a title line, maybe a morph, then example sentences one by one. */
function Rule({ s }) {
  const z = useFmt();
  const a = useIn(0);
  const b = useIn(6);
  const rowsAt = s.morph ? sec(3.2) : sec(1.2);
  const cols = !z.v && s.rows.length > 2 ? "1fr 1fr" : "1fr";
  return (
    <Body>
      <Kicker style={{ ...a, color: s.warn ? RED : GOLD }}>
        <Text text={s.kicker} italic />
      </Kicker>
      <div style={{ ...b, fontSize: z.v ? 76 : 70, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.1 }}>
        <Text text={s.title} italic />
      </div>
      {s.morph && <Morph m={s.morph} at={sec(0.6)} />}
      <div style={{ display: "grid", gridTemplateColumns: cols, gap: 18, marginTop: 34 }}>
        {s.rows.map((r, i) => (
          <Row key={i} r={r} at={rowsAt + i * sec(s.step ?? 1.5)} />
        ))}
      </div>
    </Body>
  );
}

/** The trick: one question, and which word each answer gives. */
function Trick({ s }) {
  const z = useFmt();
  const a = useIn(0);
  return (
    <Body>
      <Kicker style={a}>{s.kicker}</Kicker>
      <div style={{ ...a, fontSize: z.v ? 80 : 76, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.1, marginBottom: 44 }}>
        <Text text={s.q} italic />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {s.rows.map(([q, w], i) => (
          <TrickRow key={w} q={q} w={w} at={sec(1.4 + i * 1.5)} />
        ))}
      </div>
    </Body>
  );
}

function TrickRow({ q, w, at }) {
  const a = useIn(at);
  const z = useFmt();
  return (
    <div style={{ ...a, ...card, padding: "26px 36px", display: "flex", alignItems: "center", gap: 28 }}>
      <span style={{ flex: 1, fontSize: z.v ? 54 : 56, fontWeight: 800 }}>{q}</span>
      <span style={{ fontSize: 56, color: L.dim, fontWeight: 800 }}>→</span>
      <Word w={w} size={z.v ? 56 : 60} />
    </div>
  );
}

/** Quiz: a sentence with a gap; the right word drops into it. */
function Pick({ s, quiz }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const z = useFmt();
  const C = useTopic();
  const a = useIn(0);
  const b = useIn(8);
  const reveal = sec(s.reveal);
  const shown = f >= reveal;
  const pop = spring({ frame: f - reveal, fps, config: { damping: 12 } });
  const after = useIn(reveal + 10);
  const left = Math.max(0, Math.ceil((reveal - f) / fps));
  const [before, rest] = s.nl.split("___");
  const size = 78;
  const gap = Math.max(...s.options.map((o) => o.length)) * size * 0.55;
  return (
    <Body>
      <Kicker style={{ ...a, display: "flex", justifyContent: "space-between" }}>
        <span>
          Quiz {quiz.n}/{quiz.total} · Fill the gap
        </span>
        {!shown && <span style={{ color: RED, fontSize: 48 }}>{left}</span>}
      </Kicker>
      <div style={{ ...a, ...card, padding: "44px 48px", fontSize: size, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.3, border: `3px solid ${shown ? GREEN : L.line}` }}>
        {before}
        {shown ? (
          <span style={{ display: "inline-block", color: colourOf(C, s.answer), transform: `scale(${interpolate(pop, [0, 1], [0.4, 1])})` }}>{s.answer}</span>
        ) : (
          <span style={{ display: "inline-block", width: gap, borderBottom: `8px dashed ${L.dim}`, transform: "translateY(-8px)" }}>&nbsp;</span>
        )}
        {rest}
      </div>
      <div style={{ ...b, display: "flex", flexDirection: z.v && s.options.length > 2 ? "column" : "row", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginTop: 34 }}>
        {s.options.map((o, i) => {
          const right = o === s.answer;
          return (
            <div key={o} style={{ ...card, padding: "18px 30px", display: "flex", alignItems: "center", gap: 18, opacity: shown && !right ? interpolate(pop, [0, 1], [1, 0.35]) : 1, border: `3px solid ${shown && right ? GREEN : L.line}` }}>
              <span style={{ width: 56, height: 56, borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: "#fff", background: shown ? (right ? GREEN : RED) : L.dim }}>{shown ? (right ? "✓" : "✗") : "ABC"[i]}</span>
              <span style={{ fontSize: 56, fontWeight: 800, color: shown && right ? colourOf(C, o) : L.text }}>{o}</span>
            </div>
          );
        })}
      </div>
      <Bar progress={interpolate(f, [sec(0.3), reveal], [1, 0], clamp)} colour={shown ? GREEN : RED} />
      {shown && (
        <div style={after}>
          <Gloss style={{ marginTop: 28 }}>
            <Text text={s.en} />
          </Gloss>
          {s.why && (
            <div style={{ fontSize: 42, fontWeight: 800, marginTop: 14 }}>
              ↳ <Text text={s.why} italic />
            </div>
          )}
        </div>
      )}
    </Body>
  );
}

/** Teaser: the rule in one go, then on to the full lesson. */
function Punch({ s }) {
  const z = useFmt();
  const a = useIn(0);
  const b = useIn(sec(1.4));
  return (
    <Body>
      <Kicker style={a}>{s.kicker}</Kicker>
      <div style={{ ...a, fontSize: z.v ? 92 : 88, fontWeight: 800, letterSpacing: -3.5, lineHeight: 1.1 }}>
        {s.big.split("\n").map((line, i) => (
          <div key={i}>
            <Text text={line} italic />
          </div>
        ))}
      </div>
      <div style={{ ...b, fontSize: 52, fontWeight: 700, color: L.dim, marginTop: 50, lineHeight: 1.3 }}>{s.sub}</div>
    </Body>
  );
}

function Cta({ s }) {
  const z = useFmt();
  const a = useIn(0);
  const b = useIn(14);
  const colours = s.rows.length === 2 ? [L.perfect, RED] : [GREEN, L.perfect, RED];
  const rows = s.rows.map(([label, link], i) => (
    <div key={i} style={{ ...b, ...card, padding: "24px 36px", marginTop: i ? 20 : 0 }}>
      <div style={{ fontSize: 36, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 44, fontWeight: 800, color: colours[i], marginTop: 4 }}>{link}</div>
    </div>
  ));
  const title = (
    <div style={{ ...a, fontSize: z.v ? 84 : 88, fontWeight: 800, letterSpacing: -3, lineHeight: 1.08, marginBottom: 40, textAlign: z.v ? "center" : "left" }}>
      <Text text={s.title} italic />
    </div>
  );
  if (!z.v)
    return (
      <Body>
        <div style={{ display: "flex", alignItems: "center", gap: 80 }}>
          <div style={a}>
            <LogoMark size={260} delay={-60} />
          </div>
          <div style={{ flex: 1 }}>
            {title}
            {rows}
          </div>
        </div>
      </Body>
    );
  return (
    <Body>
      <div style={{ ...a, alignSelf: "center", marginBottom: 40 }}>
        <LogoMark size={200} delay={-60} />
      </div>
      {title}
      {rows}
    </Body>
  );
}

/** The opening of the full lesson: a little story Emma reads, one beat at a time. Each beat
 *  is a line she says (shown as text) and, from `card` seconds on, the Dutch sentence of it.
 *  The first beat is complete on frame 0. With `voice` set, her recording plays under it. */
function Story({ s, first }) {
  let at = 0;
  const beats = s.beats.map((b) => {
    const t = { b, from: sec(at), len: sec(b.dur) };
    at += b.dur;
    return t;
  });
  return (
    <>
      {beats.map(({ b, from, len }, i) => (
        <Sequence key={i} from={from} durationInFrames={len}>
          <Fade len={len} first={first && i === 0}>
            <Beat s={s} b={b} still={first && i === 0} />
          </Fade>
        </Sequence>
      ))}
      {s.voice && <Audio src={staticFile(s.voice)} />}
    </>
  );
}

function Beat({ s, b, still }) {
  const z = useFmt();
  const a = useIn(still ? -60 : 0);
  const c = useIn(still ? -60 : sec(b.card ?? 1.6));
  return (
    <Body>
      <Kicker style={a}>{s.kicker}</Kicker>
      <div style={{ ...a, fontSize: z.v ? 64 : 62, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.2 }}>
        <Text text={b.say} italic />
      </div>
      {b.nl && (
        <div style={{ ...c, ...card, padding: "36px 44px 30px", marginTop: 44, alignSelf: z.v ? "stretch" : "flex-start", minWidth: z.v ? 0 : 900 }}>
          <div style={{ fontSize: z.v ? 84 : 80, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.2 }}>
            <Text text={b.nl} />
          </div>
          <Gloss style={{ fontSize: 44 }}>
            <Text text={b.en} />
          </Gloss>
        </div>
      )}
    </Body>
  );
}

/** Both examples in one shot: indefinite (een → geen) next to definite (mijn → niet mijn). */
function Split({ s }) {
  const z = useFmt();
  const a = useIn(0);
  const end = useIn(sec(s.punchAt));
  return (
    <Body>
      <Kicker style={a}>{s.kicker}</Kicker>
      <div style={{ display: "grid", gridTemplateColumns: z.v ? "1fr" : "1fr 1fr", gap: z.v ? 26 : 36 }}>
        {s.cols.map((col, i) => (
          <SplitCol key={i} col={col} at={col.at.map(sec)} />
        ))}
      </div>
      <div style={{ ...end, fontSize: z.v ? 58 : 60, fontWeight: 800, letterSpacing: -1.2, marginTop: 36, textAlign: "center", display: "flex", flexDirection: z.v ? "column" : "row", justifyContent: "center", gap: z.v ? 6 : 28 }}>
        {s.punch.split(" · ").map((p, i) => (
          <span key={i}>
            {i > 0 && !z.v && <span style={{ color: L.dim, marginRight: 28 }}>·</span>}
            <Text text={p} italic />
          </span>
        ))}
      </div>
    </Body>
  );
}

function SplitCol({ col, at }) {
  const z = useFmt();
  const head = useIn(at[0]);
  const neg = useIn(at[1]);
  const colour = COLOURS[col.colour];
  const sentence = { fontSize: z.v ? 66 : 62, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.2 };
  const gloss = { fontSize: 38, marginTop: 6 };
  return (
    <div style={{ ...head, ...card, padding: z.v ? "26px 40px 28px" : "30px 40px 34px", borderTop: `10px solid ${colour}` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginBottom: 14 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: "#fff", background: colour, borderRadius: 999, padding: "6px 22px", textTransform: "uppercase", letterSpacing: 1 }}>{col.head}</span>
        <span style={{ fontSize: 34, fontWeight: 700, color: L.dim }}>
          <Text text={col.sub} italic />
        </span>
      </div>
      <div style={sentence}>
        <Text text={col.rows[0].nl} />
      </div>
      <Gloss style={gloss}>
        <Text text={col.rows[0].en} />
      </Gloss>
      <div style={{ ...neg, marginTop: 18 }}>
        <div style={sentence}>
          <Text text={col.rows[1].nl} />
        </div>
        <Gloss style={gloss}>
          <Text text={col.rows[1].en} />
        </Gloss>
      </div>
    </div>
  );
}

/** Every scene fades in and out quickly; the very first one is complete on frame 0. */
function Fade({ len, first, children }) {
  const f = useCurrentFrame();
  const o = Math.min(first ? 1 : interpolate(f, [0, FADE], [0, 1], { extrapolateRight: "clamp" }), interpolate(f, [len - FADE, len], [1, 0], { extrapolateLeft: "clamp" }));
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
}

const SCENES = { story: Story, split: Split, spot: Spot, title: Title, rule: Rule, trick: Trick, pick: Pick, punch: Punch, cta: Cta };
const SECTION = { story: "story", split: "rule", spot: "spot", title: "rule", rule: "rule", punch: "rule", trick: "trick", pick: "quiz" };

/** n of total among the scenes of the same kind (spot, pick) in this cut. */
const countOf = (times, s) => {
  const same = times.filter((t) => t.s.kind === s.kind);
  return { n: same.findIndex((t) => t.s === s) + 1, total: same.length };
};

export function ContrastVideo({ topic, cut = "full" }) {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const C = CONTRAST_TOPICS[topic];
  const fmt = FORMATS[width > height ? "wide" : cut === "story" ? "story" : "short"];
  const times = planOf(topic, cut);
  const total = contrastDuration(topic, cut);
  const now = times.find((t) => f >= t.from && f < t.from + t.len) ?? times[times.length - 1];
  // Music softer while Emma reads the story (only once her recording is there).
  const voiced = times.filter((t) => t.s.voice);
  const duck = (x) => (voiced.some((t) => x >= t.from && x < t.from + t.len) ? 0.35 : 1);
  const edge = (x) => 0.6 * duck(x) * interpolate(x, [0, 10, total - 45, total], [0.5, 1, 1, 0], clamp);
  const present = new Set(times.map((t) => SECTION[t.s.kind]));
  return (
    <Topic.Provider value={C}>
      <Fmt.Provider value={fmt}>
        <AbsoluteFill style={{ background: L.bg, fontFamily, color: L.text }}>
          <Header section={SECTION[now.s.kind]} present={present} />
          <AbsoluteFill style={fmt.scale ? { transform: `scale(${fmt.scale})`, transformOrigin: `50% ${fmt.body.top}px` } : undefined}>
            {times.map(({ s, from, len }) => {
              const Scene = SCENES[s.kind];
              const n = countOf(times, s);
              return (
                <Sequence key={s.id} from={from} durationInFrames={len}>
                  <Fade len={len} first={from === 0}>
                    <Scene s={s} pos={n} quiz={n} first={from === 0} />
                  </Fade>
                </Sequence>
              );
            })}
          </AbsoluteFill>
          <Audio src={staticFile(C.music ?? "music.mp3")} volume={edge} />
        </AbsoluteFill>
      </Fmt.Provider>
    </Topic.Provider>
  );
}

/** The first mistake, crossed out, with the right sentence under it. */
function MistakeCard({ size, style }) {
  const s = useTopic().scenes[0];
  return (
    <div style={{ ...card, padding: `${size * 0.55}px ${size * 0.7}px`, ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: size * 0.35, marginBottom: size * 0.2 }}>
        <span style={{ fontSize: size * 0.8 }}>❌</span>
        <span style={{ fontSize: size, fontWeight: 800, textDecoration: "line-through", textDecorationColor: RED, textDecorationThickness: size / 12 }}>{s.wrong}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: size * 0.35 }}>
        <span style={{ fontSize: size * 0.8 }}>✅</span>
        <span style={{ fontSize: size, fontWeight: 800 }}>
          <Text text={s.right} />
        </span>
      </div>
    </div>
  );
}

/** Cover for the Short / Reel (1080×1920). */
export function ContrastCover({ topic }) {
  const C = CONTRAST_TOPICS[topic];
  return (
    <Topic.Provider value={C}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 85% 12%, #fde4e8 0%, ${L.bg} 55%)`, fontFamily, color: L.text }}>
        <div style={{ position: "absolute", left: 80, top: 260, display: "flex", alignItems: "center", gap: 22 }}>
          <LogoMark size={96} delay={-60} />
          <span style={{ fontSize: 38, fontWeight: 800, color: "#fff", background: RED, borderRadius: 999, padding: "12px 30px" }}>{C.level}</span>
        </div>
        <div style={{ position: "absolute", left: 80, right: 80, top: 440, fontSize: 132, fontWeight: 800, letterSpacing: -5, lineHeight: 1 }}>
          <div style={{ color: RED }}>{C.cover.lines[0]}</div>
          <div>{C.cover.lines[1]}</div>
        </div>
        <MistakeCard size={72} style={{ position: "absolute", left: 80, right: 80, top: 920, transform: "rotate(-1.5deg)" }} />
        <div style={{ position: "absolute", left: 80, right: 80, top: 1260, fontSize: 60, fontWeight: 700, color: L.dim, lineHeight: 1.3 }}>{C.cover.sub}</div>
      </AbsoluteFill>
    </Topic.Provider>
  );
}

/** YouTube thumbnail for the 16:9 lesson (1280×720). */
export function ContrastThumb({ topic }) {
  const C = CONTRAST_TOPICS[topic];
  return (
    <Topic.Provider value={C}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 85% 15%, #fde4e8 0%, ${L.bg} 55%)`, fontFamily, color: L.text }}>
        <div style={{ position: "absolute", left: 70, top: 110, display: "flex", alignItems: "center", gap: 22 }}>
          <LogoMark size={84} delay={-60} />
          <span style={{ fontSize: 34, fontWeight: 800, color: "#fff", background: RED, borderRadius: 999, padding: "10px 26px" }}>{C.level}</span>
        </div>
        <div style={{ position: "absolute", left: 70, top: 240, width: 640, fontSize: 92, fontWeight: 800, letterSpacing: -3.5, lineHeight: 1.02 }}>
          <div style={{ color: RED }}>{C.cover.lines[0]}</div>
          <div style={{ fontSize: 64, marginTop: 10 }}>{C.cover.lines[1]}</div>
        </div>
        <MistakeCard size={40} style={{ position: "absolute", right: 50, top: 250, whiteSpace: "nowrap", transform: "rotate(2deg)" }} />
      </AbsoluteFill>
    </Topic.Provider>
  );
}
