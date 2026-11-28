// Inversie, in English: a short (9:16, about a minute and a half) for YouTube Shorts and Instagram Reels,
// the same video in 16:9 for YouTube on desktop, and a ~30 s story cut (9:16, Instagram's safe zones).
// Three typical mistakes, then why everyone gets it wrong (you do it almost more often than not, so it isn't really the
// exception), the rule (the finite verb on place 2), when you use it (time, place, another
// part of the sentence, daarom/toen/dan, a question word, a whole subclause), the catch
// (en/maar/want/of), two quiz questions. Music only, no voice.
// Colours: place 1 orange, the finite verb blue, the subject red. Text: inversion.json.
// Dutch words inside English text are *italic*.
import { createContext, useContext } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoMark, fontFamily } from "./Demo";
import { Rich } from "./LessonReel";
import { L } from "./Carousel";
import { RED, GOLD } from "./Sinterklaas";
import CONTENT from "./inversion.json";
import TIMELINE from "./inversionTimeline.json";

export const INV_FPS = 30;
export const INV_SIZE = { width: 1080, height: 1920 };
export const INV_WIDE = { width: 1920, height: 1080 };

const BLUE = L.perfect;
const GREEN = L.past;
const ORANGE = L.accent;
const ROLE = { 1: ORANGE, v: BLUE, s: RED };
const sec = (s) => Math.round(s * INV_FPS);
const FADE = 6;
const card = { background: L.card, border: `2px solid ${L.line}`, borderRadius: 32, boxShadow: "0 10px 30px rgba(11,13,17,0.06)" };
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

// Scene start and length in frames. With the voice, the lengths and the clip times
// ([start, end] in seconds, per scene) come from inversionTimeline.json (inversie/build_voice.py).
const VOICE_AT = Object.fromEntries(TIMELINE.scenes.map((t) => [t.id, t]));
const CUT_IDS = { full: CONTENT.scenes.filter((s) => !s.cut).map((s) => s.id), ...CONTENT.cuts };
function plan(voice, cut) {
  let at = 0;
  return CUT_IDS[cut].map((id) => CONTENT.scenes.find((s) => s.id === id)).map((s) => {
    const t = { s, from: at, len: sec(voice ? VOICE_AT[s.id].dur : s.dur), v: voice ? VOICE_AT[s.id].voice : undefined };
    at += t.len;
    return t;
  });
}
const plans = {};
const planOf = (voice, cut) => (plans[`${voice}-${cut}`] ??= plan(voice, cut));
export const inversionDuration = (voice = false, cut = "full") => planOf(voice, cut).reduce((n, t) => n + t.len, 0);
/** When clip i starts in the scene (seconds), or the fallback without voice. */
const vo = (v, i, fallback) => v?.[i]?.[0] ?? fallback;

// The "Begin je met…" cards; the second bijzin card shares the first one's label and number.
const labelOf = (s) => s.label ?? s.id;
const QUIZ = CONTENT.scenes.filter((s) => s.kind === "pick");
const sectionOf = (kind) => ({ spot: "quiz", punch: "rule", mistake: "why", why: "why", rule: "rule", switch: "rule", case: "when", clause: "when", beware: "when", pick: "quiz" })[kind] ?? null;

// Layout per format: the Short (Reels/Shorts UI at the bottom), the story (Instagram covers
// ~260px at the top and ~300px at the bottom) and 16:9 for desktop.
const FORMATS = {
  short: { v: true, body: { left: 70, right: 90, top: 330, bottom: 380 }, header: 110, chips: true, qTop: 300, underQ: 580, qSize: 92 },
  // story: everything under the header is scaled down a little (from y 400), which keeps a band
  // free above Instagram's reply bar (y ~1425-1620) for the link sticker, all story long.
  story: { v: true, body: { left: 80, right: 80, top: 400, bottom: 300 }, header: 270, chips: false, qTop: 400, underQ: 660, qSize: 88, scale: 0.84 },
  wide: { v: false, body: { left: 120, right: 120, top: 170, bottom: 90 }, header: 50, chips: true, qTop: 170, underQ: 310, qSize: 84 },
};
const Fmt = createContext(FORMATS.short);
const useFmt = () => useContext(Fmt);

function useIn(at = 0) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 200 } });
  return { opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)` };
}

/** "{1:Morgen} {v:werk} {s:ik} thuis." → [{t, r}], plain text has no role. */
function parse(text) {
  return text.split(/(\{\w:[^}]+\})/).filter(Boolean).map((p) => {
    const m = p.match(/^\{(\w):([^}]+)\}$/);
    return m ? { t: m[2], r: m[1] } : { t: p };
  });
}

/**
 * A sentence with place 1 orange, the verb blue and the subject red. With badges,
 * a little "1" and "2" sits above place 1 and the verb. Without colour, all plain.
 */
function Sentence({ text, size, badges = false, colour = true }) {
  const parts = parse(text);
  return (
    <span style={{ fontSize: size, fontWeight: 800, letterSpacing: -1.2, lineHeight: badges ? 1.55 : 1.2 }}>
      {parts.map((p, i) => {
        if (!p.r || !colour) return <span key={i}>{p.t}</span>;
        const n = p.r === "1" ? 1 : p.r === "v" ? 2 : 0;
        const bg = p.r === "1" && p.t.includes(" ") ? "rgba(224,122,34,0.12)" : "transparent";
        return (
          <span key={i} style={{ position: "relative", display: badges ? "inline-block" : "inline", color: ROLE[p.r], background: bg, borderRadius: 14, padding: bg === "transparent" ? 0 : "0 8px" }}>
            {p.t}
            {badges && n > 0 && <Badge n={n} style={{ position: "absolute", left: "50%", top: -size * 0.36, transform: "translateX(-50%)" }} />}
          </span>
        );
      })}
    </span>
  );
}

function Badge({ n, style }) {
  return (
    <span style={{ width: 46, height: 46, borderRadius: 23, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, letterSpacing: 0, color: "#fff", background: n === 2 ? BLUE : ORANGE, ...style }}>
      {n}
    </span>
  );
}

/** Text with the *marked* words in red; italic when they are Dutch words in English text. */
function RedWords({ text, italic }) {
  return text.split(/(\*[^*]+\*)/).map((p, i) =>
    p.length > 2 && p.startsWith("*") && p.endsWith("*") ? (
      <span key={i} style={{ color: RED, fontWeight: 800, fontStyle: italic ? "italic" : "normal" }}>
        {p.slice(1, -1)}
      </span>
    ) : (
      p
    ),
  );
}

function Header({ section, T }) {
  const z = useFmt();
  const chips = Object.entries(T.chips);
  return (
    <div style={{ position: "absolute", left: z.body.left, right: z.v ? 70 : z.body.right, top: z.header, display: "flex", flexDirection: z.v ? "column" : "row", justifyContent: "space-between", alignItems: z.v ? "stretch" : "center", gap: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: z.v ? 36 : 32, fontWeight: 800 }}>
        <LogoMark size={z.v ? 64 : 56} delay={-60} />
        Taal Studio <span style={{ color: L.dim, fontWeight: 600 }}>· {T.series}</span>
      </div>
      <div style={{ display: z.chips ? "flex" : "none", gap: 10 }}>
        {chips.map(([id, label]) => {
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

function Body({ children, center, top }) {
  const { body } = useFmt();
  return <div style={{ position: "absolute", ...body, ...(top ? { top } : {}), display: "flex", flexDirection: "column", justifyContent: top ? "flex-start" : "center", alignItems: center ? "center" : "stretch", textAlign: center ? "center" : "left" }}>{children}</div>;
}

function Kicker({ children, style }) {
  return <div style={{ fontSize: 36, fontWeight: 800, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 22, ...style }}>{children}</div>;
}

function Gloss({ lang, children, style }) {
  if (lang !== "en") return null;
  return <div style={{ fontSize: 40, color: L.dim, marginTop: 16, fontStyle: "italic", ...style }}>{children}</div>;
}

/** The opening: a typical mistake, crossed out, and the right sentence under it. */
function Mistake({ s, v, pos }) {
  const z = useFmt();
  const a = useIn(0);
  const b = useIn(6);
  const c = useIn(sec(vo(v, 1, 1.8)) - 6);
  const size = z.v ? 76 : 66;
  // 9:16: the right sentence under the wrong one; 16:9: next to it.
  const box = { ...card, padding: "40px 44px", display: "flex", alignItems: "flex-start", gap: 26, flex: 1 };
  return (
    <Body top={z.underQ}>
      <Kicker style={{ ...a, color: L.dim, textAlign: "right", visibility: pos.total > 1 ? "visible" : "hidden" }}>
        {pos.n}/{pos.total}
      </Kicker>
      <div style={{ display: "flex", flexDirection: z.v ? "column" : "row", gap: z.v ? 26 : 36, alignItems: "stretch" }}>
        <div style={{ ...b, ...box }}>
          <span style={{ fontSize: 64, lineHeight: 1.25 }}>❌</span>
          <Sentence text={s.wrong} size={size} />
        </div>
        <div style={{ ...c, ...box, border: `3px solid ${GREEN}` }}>
          <span style={{ fontSize: 64, lineHeight: 1.25 }}>✅</span>
          <Sentence text={s.right} size={size} />
        </div>
      </div>
    </Body>
  );
}

function Why({ s, T }) {
  const z = useFmt();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = useIn(sec(0.4));
  const c = useIn(sec(3.8));
  const d = useIn(sec(5.8));
  const pop = spring({ frame: f - sec(6.2), fps, config: { damping: 9, stiffness: 140 } });
  return (
    <Body top={z.underQ}>
      <div style={{ ...b, ...card, padding: "34px 44px", alignSelf: z.v ? "stretch" : "flex-start" }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: L.dim, marginBottom: 6 }}>{T.why.normal}</div>
        <Sentence text={s.normal} size={76} />
      </div>
      <div style={{ ...c, fontSize: 56, fontWeight: 700, lineHeight: 1.3, marginTop: 44 }}>
        {T.why.feels} {T.why.exception}.
      </div>
      <div style={{ ...d, fontSize: 56, fontWeight: 700, lineHeight: 1.3, marginTop: 24 }}>
        <RedWords text={T.why.but} italic={false} />{" "}
        <span style={{ display: "inline-block", color: RED, fontWeight: 800, fontSize: 80, transform: `scale(${interpolate(pop, [0, 1], [0.4, 1])})`, transformOrigin: "left bottom" }}>{T.why.norm}!</span>
      </div>
    </Body>
  );
}

/** Teaser: a wrong sentence, a few seconds to find the mistake, then the right one and why. */
function Spot({ s, T, pos, v }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const z = useFmt();
  const a = useIn(0);
  const b = useIn(6);
  // With the voice: the right sentence appears as Emma starts saying it.
  const reveal = v ? sec(v[1][0]) - 3 : sec(s.reveal);
  const shown = f >= reveal;
  const c = useIn(reveal);
  const d = useIn(reveal + 12);
  const left = Math.max(0, Math.ceil((reveal - f) / fps));
  const progress = interpolate(f, [sec(0.3), reveal], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dim = interpolate(f, [reveal, reveal + 8], [1, 0.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const size = z.v ? 80 : 70;
  return (
    <Body>
      <Kicker style={{ ...a, display: "flex", justifyContent: "space-between" }}>
        <span>{T.spot.kicker}</span>
        <span style={{ color: shown ? L.dim : RED }}>{shown ? `${pos.n}/${pos.total}` : left}</span>
      </Kicker>
      <div style={{ ...b, ...card, padding: "40px 44px", display: "flex", alignItems: "flex-start", gap: 26, opacity: b.opacity * dim }}>
        <span style={{ fontSize: 64, lineHeight: 1.25, opacity: shown ? 1 : 0.25 }}>{shown ? "❌" : "🤔"}</span>
        <Sentence text={s.wrong} size={size} colour={false} />
      </div>
      {!shown && (
        <>
          <div style={{ ...b, fontSize: 52, fontWeight: 800, marginTop: 34 }}>{T.spot.ask}</div>
          <div style={{ height: 14, borderRadius: 7, background: "#e9ebf0", marginTop: 30, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress * 100}%`, background: RED }} />
          </div>
        </>
      )}
      {shown && (
        <>
          <div style={{ ...c, ...card, padding: "40px 44px 34px", display: "flex", alignItems: "flex-start", gap: 26, marginTop: 26, border: `3px solid ${GREEN}` }}>
            <span style={{ fontSize: 64, lineHeight: 1.25 }}>✅</span>
            <div>
              <Sentence text={s.right} size={size} />
              <div style={{ fontSize: 38, color: L.dim, marginTop: 12, fontStyle: "italic" }}>{s.en}</div>
            </div>
          </div>
          <div style={{ ...d, fontSize: 44, fontWeight: 800, color: RED, marginTop: 30, lineHeight: 1.3 }}>
            ↳ <RedWords text={s.why} italic />
          </div>
        </>
      )}
    </Body>
  );
}

/** Teaser: the rule in one line, then on to the full lesson. */
function Punch({ T }) {
  const a = useIn(0);
  const b = useIn(sec(1.2));
  const z = useFmt();
  return (
    <Body>
      <Kicker style={a}>{T.punch.kicker}</Kicker>
      <div style={{ ...a, fontSize: z.v ? 104 : 96, fontWeight: 800, letterSpacing: -4, lineHeight: 1.04 }}>
        {parse(T.punch.big).map((p, i) => (
          <span key={i} style={{ color: ROLE[p.r] }}>
            {p.t}
          </span>
        ))}
      </div>
      <div style={{ ...b, fontSize: 52, fontWeight: 700, color: L.dim, marginTop: 50, lineHeight: 1.3 }}>{T.punch.sub}</div>
    </Body>
  );
}

/** One sentence as blocks, with the place numbers above the first two. */
function Blocks({ row, at }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, rowGap: 30, paddingTop: 30 }}>
      {row.map((w, i) => {
        const s = spring({ frame: f - at - i * 6, fps, config: { damping: 14 } });
        const c = ROLE[w.r] ?? L.dim;
        return (
          <div key={i} style={{ position: "relative", opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.7, 1])})` }}>
            {i < 2 && <Badge n={i + 1} style={{ position: "absolute", left: "50%", top: -26, transform: "translateX(-50%)", zIndex: 1 }} />}
            <div style={{ ...card, padding: "18px 24px", fontSize: 56, fontWeight: 800, color: w.r ? c : L.text, borderBottom: `10px solid ${c}`, whiteSpace: "nowrap" }}>{w.t}</div>
          </div>
        );
      })}
    </div>
  );
}

function Rule({ s, T, v }) {
  const a = useIn(0);
  const second = sec(vo(v, 1, 3.0)) - 6;
  const arrow = useIn(second - 6);
  return (
    <Body>
      <Kicker style={a}>{T.rule.kicker}</Kicker>
      <div style={{ ...a, fontSize: 72, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.1, marginBottom: 30 }}>{T.rule.title}</div>
      <Blocks row={s.rows[0]} at={sec(vo(v, 0, 1.1)) - 6} />
      <div style={{ ...arrow, fontSize: 64, color: L.dim, margin: "14px 0 0 24px" }}>↓</div>
      <Blocks row={s.rows[1]} at={second} />
      <div style={{ ...arrow, display: "flex", gap: 34, marginTop: 30, fontSize: 34, fontWeight: 700, color: L.dim }}>
        {T.rule.legend.map(([r, label]) => (
          <span key={r} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 24, height: 24, borderRadius: 12, background: ROLE[r] }} />
            {label}
          </span>
        ))}
      </div>
    </Body>
  );
}

/** "Just switch them": ik werk → werk ik, the two cards change places. */
function Switch({ T, lang, v }) {
  const z = useFmt();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = useIn(0);
  const items = [useIn(sec(1.0)), useIn(sec(1.6)), useIn(sec(2.2)), useIn(sec(2.8))];
  const b = useIn(sec(4.2));
  const c = useIn(sec(4.8));
  const d = useIn(sec(7.4));
  const swap = spring({ frame: f - sec(vo(v, 1, 6.0)) + 6, fps, config: { damping: 16, stiffness: 90 } });
  const W = 230;
  const GAP = 24;
  const lift = Math.sin(Math.min(1, Math.max(0, swap)) * Math.PI) * 60;
  const chip = (word, colour, dx, dy) => (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, transform: `translate(${dx}px, ${dy}px)`, ...card, padding: "20px 0", textAlign: "center", fontSize: 72, fontWeight: 800, color: colour, borderBottom: `10px solid ${colour}` }}>{word}</div>
  );
  return (
    <Body>
      <Kicker style={a}>{T.switch.kicker}</Kicker>
      <div style={{ ...a, fontSize: z.v ? 66 : 62, fontWeight: 800, letterSpacing: -2, lineHeight: 1.12 }}>{T.switch.q}</div>
      {/* Time, place, manner, something else: one by one, in orange, each with a Dutch start. */}
      <div style={{ display: "grid", gridTemplateColumns: z.v ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 16, marginTop: 30 }}>
        {T.switch.items.map(([label, ex], i) => (
          <div key={label} style={{ ...items[i], background: "rgba(224,122,34,0.12)", border: `2px solid rgba(224,122,34,0.35)`, borderRadius: 24, padding: "16px 24px" }}>
            <div style={{ fontSize: 38, fontWeight: 800, color: ORANGE, whiteSpace: "nowrap" }}>{label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: L.dim, marginTop: 2, fontStyle: lang === "en" ? "italic" : "normal" }}>{ex}</div>
          </div>
        ))}
      </div>
      <div style={{ ...b, fontSize: 72, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.12, marginTop: 36 }}>
        {parse(T.switch.big).map((p, i) => (
          <span key={i} style={{ color: ROLE[p.r] }}>
            {p.t}
          </span>
        ))}
      </div>
      {/* 9:16: the line under the cards; 16:9: next to them. */}
      <div style={{ display: "flex", flexDirection: z.v ? "column" : "row", alignItems: z.v ? "stretch" : "center", gap: z.v ? 48 : 70, marginTop: z.v ? 64 : 50 }}>
        <div style={{ ...c, position: "relative", flex: "none", height: 160, width: 2 * W + GAP + 10, marginLeft: 10 }}>
          {chip("ik", RED, swap * (W + GAP), -lift)}
          {chip("werk", BLUE, (1 - swap) * (W + GAP), lift)}
        </div>
        <div style={{ ...d, fontSize: 64, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.2 }}>
          <RedWords text={T.switch.name} italic={lang === "en"} />
        </div>
      </div>
    </Body>
  );
}

function CaseHead({ s, T, pos }) {
  const a = useIn(0);
  const b = useIn(6);
  return (
    <>
      <Kicker style={{ ...a, display: "flex", justifyContent: "space-between" }}>
        <span>{T.case.kicker}</span>
        <span style={{ color: L.dim, visibility: pos.total > 1 ? "visible" : "hidden" }}>
          {pos.n}/{pos.total}
        </span>
      </Kicker>
      <div style={{ ...b, fontSize: 92, fontWeight: 800, letterSpacing: -3, lineHeight: 1.05, color: ORANGE, marginBottom: 44 }}>
        <Rich text={T.case.labels[labelOf(s)]} />
      </div>
    </>
  );
}

/** Under the question-word example: the -t drops (jij woont → woon jij). */
function TNote({ T, at }) {
  const a = useIn(at);
  return (
    <div style={{ ...a, fontSize: 36, fontWeight: 700, color: GOLD, marginTop: 18 }}>
      ↳ <Rich text={T.case.tNote} />
    </div>
  );
}

function Case({ s, T, lang, v, pos }) {
  const c = useIn(sec(0.5));
  return (
    <Body>
      <CaseHead s={s} T={T} pos={pos} />
      <div style={{ ...c, ...card, padding: "40px 50px 34px" }}>
        <Sentence text={s.nl} size={86} badges />
        <Gloss lang={lang}>{s.en}</Gloss>
        {s.note && <TNote T={T} at={sec(vo(v, 1, 1.8)) - 3} />}
      </div>
    </Body>
  );
}

function Clause({ s, T, lang, v, pos }) {
  const c = useIn(sec(0.5));
  const after = useIn(sec(Math.max(2.4, (v?.[0]?.[1] ?? 0) + 0.3)));
  return (
    <Body>
      <CaseHead s={s} T={T} pos={pos} />
      <div style={{ ...c, ...card, padding: "40px 50px 34px" }}>
        <Sentence text={s.nl} size={74} badges />
        <Gloss lang={lang}>{s.en}</Gloss>
      </div>
      {s.showNote && <div style={{ ...after, fontSize: 46, fontWeight: 800, color: RED, marginTop: 34, lineHeight: 1.3 }}>↳ {T.clause.note}</div>}
      {s.pairs && (
        <div style={{ ...after, marginTop: 34, fontSize: 46, fontWeight: 800, color: GOLD, lineHeight: 1.35 }}>
          💡 {T.clause.trick}:{" "}
          {s.pairs.map(([x, y], i) => (
            <span key={i} style={{ whiteSpace: "nowrap" }}>
              {i > 0 && <span style={{ color: L.dim }}> · </span>}
              <span style={{ color: ORANGE }}>{x}</span> <span style={{ color: BLUE }}>{y}</span>
            </span>
          ))}
        </div>
      )}
    </Body>
  );
}

function Beware({ s, T, lang }) {
  const a = useIn(0);
  const b = useIn(sec(1.2));
  const c = useIn(sec(2.6));
  return (
    <Body>
      <Kicker style={{ ...a, color: RED }}>{T.beware.kicker}</Kicker>
      <div style={{ ...a, fontSize: 80, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.12, marginBottom: 50 }}>
        <RedWords text={T.beware.title} italic={lang === "en"} />
      </div>
      <div style={{ ...b, ...card, padding: "40px 50px 34px", display: "flex", gap: 24, alignItems: "flex-start", border: `3px solid ${GREEN}` }}>
        <span style={{ fontSize: 56, lineHeight: 1.3 }}>✅</span>
        <div>
          <Sentence text={s.right} size={72} />
          <Gloss lang={lang}>{s.en}</Gloss>
        </div>
      </div>
      <div style={{ ...c, ...card, padding: "28px 50px", marginTop: 22, display: "flex", gap: 24, alignItems: "center", opacity: c.opacity * 0.75 }}>
        <span style={{ fontSize: 48 }}>❌</span>
        <span style={{ fontSize: 60, fontWeight: 800, color: L.dim }}>{s.wrong}</span>
      </div>
    </Body>
  );
}

function Pick({ s, T, lang }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = useIn(0);
  const b = useIn(8);
  const reveal = sec(s.reveal);
  const shown = f >= reveal;
  const pop = spring({ frame: f - reveal, fps, config: { damping: 14 } });
  const left = Math.max(0, Math.ceil((reveal - f) / fps));
  const progress = interpolate(f, [sec(0.35), reveal], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const n = QUIZ.indexOf(s) + 1;
  return (
    <Body>
      <Kicker style={{ ...a, display: "flex", justifyContent: "space-between" }}>
        <span>{fill(T.quiz.kicker, { n, total: QUIZ.length })}</span>
        {!shown && <span style={{ color: RED, fontSize: 48 }}>{left}</span>}
      </Kicker>
      <div style={{ ...b, display: "flex", flexDirection: "column", gap: 24, marginTop: 20 }}>
        {s.options.map((o, i) => {
          const right = i === s.answer;
          return (
            <div
              key={i}
              style={{
                ...card,
                padding: "36px 40px",
                display: "flex",
                alignItems: "center",
                gap: 28,
                opacity: shown && !right ? interpolate(pop, [0, 1], [1, 0.4]) : 1,
                border: `3px solid ${shown && right ? GREEN : L.line}`,
                boxShadow: shown && right ? `0 0 0 ${interpolate(pop, [0, 1], [0, 8])}px rgba(26,158,88,0.15)` : card.boxShadow,
              }}
            >
              <span style={{ flex: "none", width: 72, height: 72, borderRadius: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 800, color: "#fff", background: shown ? (right ? GREEN : RED) : L.dim }}>
                {shown ? (right ? "✓" : "✗") : "AB"[i]}
              </span>
              <Sentence text={o} size={62} colour={shown && right} />
            </div>
          );
        })}
      </div>
      <div style={{ height: 14, borderRadius: 7, background: "#e9ebf0", marginTop: 40, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, background: shown ? GREEN : RED }} />
      </div>
      {shown && <Gloss lang={lang} style={{ opacity: pop, marginTop: 30 }}>{s.en}</Gloss>}
    </Body>
  );
}

function Cta({ s, T }) {
  const z = useFmt();
  const a = useIn(0);
  const b = useIn(14);
  const C = T[s.id] ?? T.cta; // storyCta, ytCta or the full video's cta
  const colors = C.rows.length === 2 ? [BLUE, RED] : [GREEN, BLUE, RED];
  const rows = C.rows.map(([label, link], i) => (
    <div key={i} style={{ ...b, ...card, padding: "24px 36px", marginTop: i ? 20 : 0 }}>
      <div style={{ fontSize: 36, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 44, fontWeight: 800, color: colors[i], marginTop: 4 }}>{link}</div>
    </div>
  ));
  if (!z.v)
    return (
      <Body>
        <div style={{ display: "flex", alignItems: "center", gap: 80 }}>
          <div style={a}>
            <LogoMark size={260} delay={-60} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...a, fontSize: 96, fontWeight: 800, letterSpacing: -3, marginBottom: 36 }}>{C.title}</div>
            {rows}
          </div>
        </div>
      </Body>
    );
  return (
    <Body>
      <div style={{ ...a, alignSelf: "center" }}>
        <LogoMark size={200} delay={-60} />
      </div>
      <div style={{ ...a, fontSize: 88, fontWeight: 800, letterSpacing: -3, margin: "40px 0 40px", textAlign: "center" }}>{C.title}</div>
      {rows}
    </Body>
  );
}

// "Why does everyone get this wrong?" stays at the top from the first frame, over the
// three mistakes, until the answer (the why scene) is done.
const qSpan = (times) => {
  const q = times.filter((t) => t.s.kind === "mistake" || t.s.kind === "why");
  return q.length ? { from: q[0].from, len: q.reduce((n, t) => n + t.len, 0) } : null;
};

function Question({ T, len }) {
  const z = useFmt();
  const f = useCurrentFrame();
  const o = interpolate(f, [len - FADE, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", left: z.body.left, right: z.body.right, top: z.qTop, opacity: o, fontSize: z.qSize, fontWeight: 800, letterSpacing: -3.5, lineHeight: 1.04 }}>{T.why.q}</div>;
}

/** Every scene fades in and out quickly. */
function Fade({ len, children }) {
  const f = useCurrentFrame();
  const o = Math.min(interpolate(f, [0, FADE], [0, 1], { extrapolateRight: "clamp" }), interpolate(f, [len - FADE, len], [1, 0], { extrapolateLeft: "clamp" }));
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
}

const SCENES = { spot: Spot, punch: Punch, switch: Switch, mistake: Mistake, why: Why, rule: Rule, case: Case, clause: Clause, beware: Beware, pick: Pick, cta: Cta };

/** Music volume: soft under Emma's voice, back up in between. */
function musicVolume(times, total) {
  const talk = times.flatMap((t) => (t.v ?? []).map(([a, b]) => [t.from + sec(a), t.from + sec(b)]));
  return (x) => {
    const edge = interpolate(x, [0, 15, total - 45, total], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    if (!talk.length) return 0.6 * edge;
    const d = Math.min(...talk.map(([a, b]) => (x < a ? a - x : x > b ? x - b : 0))) / INV_FPS;
    return interpolate(d, [0.15, 0.6], [0.08, 0.28], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * edge;
  };
}

/** Scene n of total among the scenes of its kind (mistakes; the "Start with…" cards) in this cut. */
function positions(times) {
  const mist = times.filter((t) => t.s.kind === "mistake" || t.s.kind === "spot").map((t) => t.s.id);
  const cases = [...new Set(times.filter((t) => t.s.kind === "case" || t.s.kind === "clause").map((t) => labelOf(t.s)))];
  return (s) => (s.kind === "mistake" || s.kind === "spot" ? { n: mist.indexOf(s.id) + 1, total: mist.length } : { n: cases.indexOf(labelOf(s)) + 1, total: cases.length });
}

export function InversionShort({ lang, voice = false, cut = "full" }) {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const fmt = FORMATS[width > height ? "wide" : cut.startsWith("story") ? "story" : "short"];
  const T = CONTENT.text[lang];
  const TIMES = planOf(voice, cut);
  const total = inversionDuration(voice, cut);
  const posOf = positions(TIMES);
  const q = qSpan(TIMES);
  const now = TIMES.find((t) => f >= t.from && f < t.from + t.len) ?? TIMES[TIMES.length - 1];
  return (
    <Fmt.Provider value={fmt}>
    <AbsoluteFill style={{ background: L.bg, fontFamily, color: L.text }}>
      <Header section={sectionOf(now.s.kind)} T={T} />
      <AbsoluteFill style={fmt.scale ? { transform: `scale(${fmt.scale})`, transformOrigin: `50% ${fmt.body.top}px` } : undefined}>
      {TIMES.map(({ s, from, len, v }) => {
        const Scene = SCENES[s.kind];
        return (
          <Sequence key={s.id} from={from} durationInFrames={len}>
            <Fade len={len}>
              <Scene s={s} T={T} lang={lang} v={v} pos={posOf(s)} />
            </Fade>
            {/* The voice of this scene: its own stretch of the voice track, so every cut can use it. */}
            {voice && v && <Audio src={staticFile("inversie/voice.wav")} trimBefore={sec(VOICE_AT[s.id].start)} trimAfter={sec(VOICE_AT[s.id].start) + len} />}
          </Sequence>
        );
      })}
      {q && (
        <Sequence from={q.from} durationInFrames={q.len}>
          <Question T={T} len={q.len} />
        </Sequence>
      )}
      </AbsoluteFill>
      <Audio src={staticFile("music.mp3")} volume={musicVolume(TIMES, total)} />
    </AbsoluteFill>
    </Fmt.Provider>
  );
}

/** Cover for the Short / Reel (1080×1920). */
export function InversionCover({ lang }) {
  const T = CONTENT.text[lang];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 85% 12%, #fde4e8 0%, ${L.bg} 55%)`, fontFamily, color: L.text }}>
      <div style={{ position: "absolute", left: 80, top: 260, display: "flex", alignItems: "center", gap: 22 }}>
        <LogoMark size={96} delay={-60} />
        <span style={{ fontSize: 38, fontWeight: 800, color: "#fff", background: RED, borderRadius: 999, padding: "12px 30px" }}>A2</span>
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, top: 440, fontSize: 132, fontWeight: 800, letterSpacing: -5, lineHeight: 1 }}>
        <div style={{ color: RED }}>{T.cover.lines[0]}</div>
        <div>{T.cover.lines[1]}</div>
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, top: 920, ...card, padding: "40px 50px", transform: "rotate(-1.5deg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 10 }}>
          <span style={{ fontSize: 56 }}>❌</span>
          <Sentence text={CONTENT.scenes[0].wrong} size={70} colour={false} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ fontSize: 56 }}>✅</span>
          <Sentence text={CONTENT.scenes[0].right} size={70} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, top: 1260, fontSize: 60, fontWeight: 700, color: L.dim, lineHeight: 1.3 }}>{T.cover.sub}</div>
    </AbsoluteFill>
  );
}

/** YouTube thumbnail for the 16:9 video (1280×720). */
export function InversionThumb({ lang }) {
  const T = CONTENT.text[lang];
  const m = CONTENT.scenes[0];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 85% 15%, #fde4e8 0%, ${L.bg} 55%)`, fontFamily, color: L.text }}>
      <div style={{ position: "absolute", left: 70, top: 120, display: "flex", alignItems: "center", gap: 22 }}>
        <LogoMark size={84} delay={-60} />
        <span style={{ fontSize: 34, fontWeight: 800, color: "#fff", background: RED, borderRadius: 999, padding: "10px 26px" }}>A2</span>
      </div>
      <div style={{ position: "absolute", left: 70, top: 250, width: 680, fontSize: 84, fontWeight: 800, letterSpacing: -3.5, lineHeight: 1.02 }}>
        <div style={{ color: RED }}>{T.cover.lines[0]}</div>
        <div>{T.cover.lines[1]}</div>
      </div>
      <div style={{ position: "absolute", right: 50, top: 230, width: 470, ...card, padding: "28px 32px", transform: "rotate(2deg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 12 }}>
          <span style={{ fontSize: 44 }}>❌</span>
          <Sentence text={m.wrong} size={40} colour={false} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ fontSize: 44 }}>✅</span>
          <Sentence text={m.right} size={40} />
        </div>
      </div>
    </AbsoluteFill>
  );
}
