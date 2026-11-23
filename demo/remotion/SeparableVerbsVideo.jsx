// Separable verbs (A2), with Emma's voice: 16:9 for YouTube and the lesson, 9:16 for
// Shorts and Reels, in NL and EN. Goes with the lesson "Mijn eerste scheidbare
// werkwoorden". The look is the verbs part of the Sinterklaas video: first part red,
// base verb blue, one big sentence per card in which the first part drops to the end.
// Text: separableVerbs.json. Timing and voice: separableTimeline.json, made by
// demo/scheidbaar/build_track.py. Dutch words inside English text are *italic*.
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoMark, fontFamily } from "./Demo";
import { Rich } from "./LessonReel";
import { L } from "./Carousel";
import { RED, GOLD } from "./Sinterklaas";
import CONTENT from "./separableVerbs.json";
import TIMELINE from "./separableTimeline.json";

export const SEP_FPS = 30;
export const SEP_SIZES = { video: { width: 1920, height: 1080 }, short: { width: 1080, height: 1920 } };
export const separableDuration = () => Math.ceil(TIMELINE.total * SEP_FPS);

const BLUE = L.perfect;
const GREEN = L.past;
const sec = (s) => Math.round(s * SEP_FPS);
const card = { background: L.card, border: `2px solid ${L.line}`, borderRadius: 32, boxShadow: "0 10px 30px rgba(11,13,17,0.06)" };
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
const VERBS = CONTENT.scenes.filter((s) => s.kind === "verb");
const QUIZ = CONTENT.scenes.filter((s) => s.kind === "quiz");

/** Vertical (9:16) or not, and the sizes that go with it. */
function useFmt() {
  const { width, height } = useVideoConfig();
  const v = height > width;
  return {
    v,
    body: v ? { left: 70, right: 90, top: 330, bottom: 380 } : { left: 120, right: 120, top: 170, bottom: 120 },
    kicker: v ? 36 : 32,
    title: v ? 112 : 180,
    inf: v ? 140 : 110,
    sentence: v ? 94 : 88,
    small: v ? 46 : 46,
  };
}

function useIn(at = 0) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 200 } });
  return { opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)` };
}

const sectionOf = (kind) => ({ split: "rule", rule: "rule", verb: "verbs", together: "together", quizIntro: "quiz", quiz: "quiz" })[kind] ?? null;

function Header({ section, T }) {
  const { v } = useFmt();
  const chips = Object.entries(T.chips);
  const chipRow = (
    <div style={{ display: "flex", gap: 10 }}>
      {chips.map(([id, label]) => {
        const on = id === section;
        return (
          <span key={id} style={{ fontSize: 24, fontWeight: 800, padding: "8px 18px", borderRadius: 999, color: on ? "#fff" : L.dim, background: on ? RED : "#e9ebf0" }}>
            {label}
          </span>
        );
      })}
    </div>
  );
  const brand = (
    <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: v ? 36 : 32, fontWeight: 800 }}>
      <LogoMark size={v ? 64 : 56} delay={-60} />
      Taal Studio {!v && <span style={{ color: L.dim, fontWeight: 600 }}>· {T.series}</span>}
    </div>
  );
  if (v)
    return (
      <div style={{ position: "absolute", left: 70, right: 70, top: 110, display: "flex", flexDirection: "column", gap: 28 }}>
        {brand}
        {chipRow}
      </div>
    );
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 50, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      {brand}
      {chipRow}
    </div>
  );
}

/** Little sound bars while Emma speaks (16:9 only; in a Short the app's buttons sit there). */
function Speaking({ at }) {
  const f = useCurrentFrame();
  const { v } = useFmt();
  if (v || !at.length) return null;
  const on = at.some(([a, b]) => f >= a && f < b);
  return (
    <div style={{ position: "absolute", right: 80, bottom: 60, display: "flex", alignItems: "flex-end", gap: 6, height: 44, opacity: on ? 1 : 0.25 }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ width: 10, borderRadius: 5, background: RED, height: on ? 14 + 26 * Math.abs(Math.sin((f + i * 7) / 4)) : 12 }} />
      ))}
    </div>
  );
}

function Body({ children, center }) {
  const { body } = useFmt();
  return <div style={{ position: "absolute", ...body, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: center ? "center" : "stretch", textAlign: center ? "center" : "left" }}>{children}</div>;
}

function Kicker({ children, style }) {
  const { kicker } = useFmt();
  return <div style={{ fontSize: kicker, fontWeight: 800, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 22, ...style }}>{children}</div>;
}

/** The infinitive: first part red, base verb blue. */
function Inf({ parts, size, gap = 0, plus = 0 }) {
  return (
    <span style={{ fontSize: size, fontWeight: 800, letterSpacing: -2, whiteSpace: "nowrap" }}>
      <span style={{ color: RED }}>{parts[0]}</span>
      {gap > 0 && <span style={{ display: "inline-block", width: gap, textAlign: "center", color: L.dim, fontWeight: 600, opacity: plus }}>+</span>}
      <span style={{ color: BLUE }}>{parts[1]}</span>
    </span>
  );
}

function Title({ T }) {
  const { v, title } = useFmt();
  const a = useIn(0);
  const b = useIn(14);
  const c = useIn(30);
  return (
    <Body>
      <div style={{ ...a, display: "flex", gap: 16, marginBottom: 44 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: "#fff", background: RED, borderRadius: 999, padding: "10px 28px", letterSpacing: 1, textTransform: "uppercase" }}>{T.title.tag}</span>
        <span style={{ fontSize: 32, fontWeight: 800, color: L.dim, background: "#e9ebf0", borderRadius: 999, padding: "10px 28px" }}>{T.title.level}</span>
      </div>
      <div style={{ ...b, fontSize: title, fontWeight: 800, letterSpacing: v ? -5 : -6, lineHeight: 0.98 }}>
        <div style={{ color: RED }}>{T.title.lines[0]}</div>
        <div>{T.title.lines[1]}</div>
      </div>
      <div style={{ ...c, fontSize: v ? 50 : 56, fontWeight: 600, color: L.dim, marginTop: 50, lineHeight: 1.3 }}>
        <Rich text={T.title.sub} />
      </div>
    </Body>
  );
}

function Split({ T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { v } = useFmt();
  const a = useIn(0);
  const c = useIn(62);
  const sep = spring({ frame: f - 36, fps, config: { damping: 200 } });
  const size = v ? 150 : 200;
  const parts = CONTENT.scenes.find((s) => s.id === "opbellen").inf;
  return (
    <Body center>
      <Kicker style={a}>{T.split.kicker}</Kicker>
      <div style={a}>
        <Inf parts={parts} size={size} gap={sep * (v ? 110 : 150)} plus={sep} />
      </div>
      <div style={{ ...c, fontSize: v ? 52 : 60, fontWeight: 700, marginTop: 60 }}>
        <Rich text={T.split.sub} /> ✂️
      </div>
    </Body>
  );
}

function Rule({ T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { v } = useFmt();
  const a = useIn(0);
  const note = useIn(78);
  const colors = [L.text, BLUE, L.dim, RED];
  return (
    <Body>
      <Kicker style={a}>{T.rule.kicker}</Kicker>
      <div style={{ display: "flex", flexWrap: "wrap", gap: v ? 22 : 26, rowGap: v ? 36 : 26 }}>
        {T.rule.blocks.map((w, i) => {
          // In 9:16, two blocks per row: "Ik bel" / "mijn moeder op".
          const brk = v && i === 2 ? <div key="br" style={{ flexBasis: "100%", height: 0 }} /> : null;
          const s = spring({ frame: f - 12 - i * 13, fps, config: { damping: 14 } });
          return [
            brk,
            <div key={i} style={{ opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.7, 1])})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ ...card, padding: v ? "26px 34px" : "30px 44px", fontSize: v ? 84 : 92, fontWeight: 800, color: colors[i], borderBottom: `10px solid ${colors[i]}`, whiteSpace: "nowrap" }}>{w}</div>
              <div style={{ fontSize: v ? 32 : 32, fontWeight: 700, color: L.dim, marginTop: 14 }}>{T.rule.labels[i]}</div>
            </div>,
          ];
        })}
      </div>
      <div style={{ ...note, fontSize: v ? 48 : 56, fontWeight: 800, color: RED, marginTop: v ? 60 : 70 }}>
        ↳ <Rich text={T.rule.note} />
      </div>
    </Body>
  );
}

function Verb({ s, t, T, lang }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const z = useFmt();
  const a = useIn(0);
  const say = sec(t.voice[1]) - 6;
  const b = useIn(say + 12);
  // The infinitive pops when Emma says it; the first part drops to the end with the sentence.
  const pop = spring({ frame: f - sec(t.voice[0]), fps, config: { damping: 10, stiffness: 160 } });
  const move = spring({ frame: f - say, fps, config: { damping: 200 } });
  const i = s.nl.lastIndexOf(` ${s.part}`);
  const body = s.nl.slice(0, i);
  const end = s.nl.slice(i + s.part.length + 1);
  const vi = body.indexOf(` ${s.verb} `) >= 0 ? body.indexOf(` ${s.verb} `) + 1 : body.indexOf(s.verb);
  const n = VERBS.indexOf(s) + 1;
  return (
    <Body>
      <Kicker style={a}>{fill(T.verb.kicker, { n, total: VERBS.length })}</Kicker>
      <div style={{ ...a, display: "flex", alignItems: "baseline", flexWrap: "wrap", columnGap: 30, marginBottom: z.v ? 44 : 50 }}>
        <span style={{ display: "inline-block", transform: `scale(${1 + 0.06 * Math.sin(Math.min(1, pop) * Math.PI)})`, transformOrigin: "left center" }}>
          <Inf parts={s.inf} size={z.inf} />
        </span>
        {lang === "en" && <span style={{ fontSize: z.small, fontWeight: 600, color: L.dim }}>{s.gloss}</span>}
      </div>
      <div style={{ ...a, ...card, padding: z.v ? "46px 50px" : "52px 64px" }}>
        <div style={{ fontSize: z.sentence, fontWeight: 800, lineHeight: 1.18, letterSpacing: -1.5 }}>
          {body.slice(0, vi)}
          <span style={{ color: BLUE }}>{s.verb}</span>
          {body.slice(vi + s.verb.length)}{" "}
          <span style={{ color: RED, display: "inline-block", opacity: move, transform: `translateY(${interpolate(move, [0, 1], [-60, 0])}px)` }}>{s.part}</span>
          {end}
        </div>
        {lang === "en" && <div style={{ ...b, fontSize: z.small, color: L.dim, marginTop: 24, fontStyle: "italic" }}>{s.en}</div>}
      </div>
      <div style={{ ...b, fontSize: z.v ? 44 : 42, fontWeight: 700, color: RED, marginTop: 34 }}>
        ↳ <Rich text={fill(T.verb.end, { part: s.part })} />
      </div>
    </Body>
  );
}

/** A sentence with the joined verb coloured: first part red, the rest blue. */
function Joined({ row }) {
  const i = row.nl.indexOf(row.hl);
  return (
    <>
      {row.nl.slice(0, i)}
      <span style={{ color: RED }}>{row.part}</span>
      <span style={{ color: BLUE }}>{row.hl.slice(row.part.length)}</span>
      {row.nl.slice(i + row.hl.length)}
    </>
  );
}

function Together({ s, t, T, lang }) {
  const z = useFmt();
  const a = useIn(0);
  const rows = [useIn(sec(t.voice[0]) - 10), useIn(sec(t.voice[1]) - 10)];
  return (
    <Body>
      <Kicker style={a}>{T.together.kicker} 🤝</Kicker>
      {s.rows.map((row, i) => (
        <div key={i} style={{ ...rows[i], marginTop: i ? (z.v ? 50 : 40) : 0 }}>
          <div style={{ fontSize: z.v ? 40 : 36, fontWeight: 700, color: L.dim, marginBottom: 14 }}>
            <Rich text={T.together.labels[i]} />
          </div>
          <div style={{ ...card, padding: z.v ? "36px 44px" : "36px 56px", borderLeft: `14px solid ${BLUE}` }}>
            <div style={{ fontSize: z.v ? 78 : 74, fontWeight: 800, lineHeight: 1.18, letterSpacing: -1.2 }}>
              <Joined row={row} />
            </div>
            {lang === "en" && <div style={{ fontSize: z.v ? 38 : 40, color: L.dim, marginTop: 14, fontStyle: "italic" }}>{row.en}</div>}
          </div>
        </div>
      ))}
    </Body>
  );
}

function Tip({ T }) {
  const z = useFmt();
  const a = useIn(0);
  return (
    <Body>
      <div style={{ ...a, ...card, padding: z.v ? "56px 56px" : "60px 70px", fontSize: z.v ? 66 : 72, fontWeight: 700, lineHeight: 1.3 }}>
        💡 <Rich text={T.tip} />
      </div>
    </Body>
  );
}

function QuizIntro({ T }) {
  const z = useFmt();
  const a = useIn(0);
  const b = useIn(14);
  return (
    <Body>
      <div style={{ ...a, fontSize: z.v ? 150 : 170, fontWeight: 800, letterSpacing: -5 }}>
        {T.quizIntro.title} <span style={{ color: RED }}>✏️</span>
      </div>
      <div style={{ ...b, fontSize: z.v ? 50 : 56, color: L.dim, marginTop: 36, lineHeight: 1.35 }}>{T.quizIntro.sub}</div>
    </Body>
  );
}

function Quiz({ s, t, T, lang }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const z = useFmt();
  const a = useIn(0);
  const reveal = sec(t.reveal);
  const shown = f >= reveal;
  const pop = spring({ frame: f - reveal, fps, config: { damping: 14 } });
  const left = Math.max(0, Math.ceil((reveal - f) / fps));
  const progress = interpolate(f, [sec(0.35), reveal], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pieces = s.q.split("___");
  const n = QUIZ.indexOf(s) + 1;
  return (
    <Body>
      <Kicker style={{ ...a, display: "flex", justifyContent: "space-between" }}>
        <span>{fill(T.quiz, { n, total: QUIZ.length })}</span>
        {!shown && <span style={{ color: RED, fontSize: 44 }}>{left}</span>}
      </Kicker>
      <div style={{ ...a, ...card, padding: z.v ? "52px 50px" : "60px 64px" }}>
        <div style={{ fontSize: z.v ? 92 : 96, fontWeight: 800, lineHeight: 1.25, letterSpacing: -1.5 }}>
          {pieces.map((p, i) => {
            // Keep a blank and the punctuation right after it on one line.
            const glue = i > 0 ? (p.match(/^[.,!?]+/)?.[0] ?? "") : "";
            const rest = p.slice(glue.length);
            const blank = i < s.ans.length && (shown ? (
              <span style={{ color: RED, display: "inline-block", transform: `scale(${interpolate(pop, [0, 1], [0.6, 1])})` }}>{s.ans[i]}</span>
            ) : (
              <span style={{ display: "inline-block", width: z.v ? 170 : 240, borderBottom: `10px solid ${RED}`, margin: "0 10px" }} />
            ));
            const nextGlue = pieces[i + 1]?.match(/^[.,!?]+/)?.[0] ?? "";
            return (
              <span key={i}>
                {rest}
                {blank && (
                  <span style={{ whiteSpace: "nowrap" }}>
                    {blank}
                    {nextGlue}
                  </span>
                )}
              </span>
            );
          })}
        </div>
        <div style={{ fontSize: z.small, fontWeight: 700, color: GOLD, marginTop: 26 }}>
          💡 <Inf parts={s.hint} size={z.small} />
        </div>
        {lang === "en" && <div style={{ fontSize: z.v ? 40 : 44, color: L.dim, marginTop: 14, fontStyle: "italic" }}>{s.en}</div>}
      </div>
      <div style={{ height: 14, borderRadius: 7, background: "#e9ebf0", marginTop: 40, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, background: shown ? GREEN : RED }} />
      </div>
    </Body>
  );
}

function Cta({ T }) {
  const z = useFmt();
  const a = useIn(0);
  const b = useIn(14);
  const colors = [GREEN, BLUE, RED];
  const rows = T.cta.rows.map(([label, link], i) => (
    <div key={i} style={{ ...b, ...card, padding: "24px 36px", marginTop: i ? 20 : 0 }}>
      <div style={{ fontSize: 36, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: z.v ? 44 : 46, fontWeight: 800, color: colors[i], marginTop: 4 }}>{link}</div>
    </div>
  ));
  if (z.v)
    return (
      <Body>
        <div style={{ ...a, alignSelf: "center" }}>
          <LogoMark size={200} delay={-60} />
        </div>
        <div style={{ ...a, fontSize: 88, fontWeight: 800, letterSpacing: -3, margin: "40px 0 40px", textAlign: "center" }}>{T.cta.title}</div>
        {rows}
      </Body>
    );
  return (
    <Body>
      <div style={{ display: "flex", alignItems: "center", gap: 80 }}>
        <div style={a}>
          <LogoMark size={260} delay={-60} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...a, fontSize: 96, fontWeight: 800, letterSpacing: -3, marginBottom: 36 }}>{T.cta.title}</div>
          {rows}
        </div>
      </div>
    </Body>
  );
}

/** YouTube thumbnail (1280×720) in the lesson-thumbnail layout. */
export function SeparableThumb({ lang }) {
  const T = CONTENT.text[lang];
  const ex = CONTENT.scenes.find((s) => s.id === "opbellen");
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 85% 15%, #fde4e8 0%, ${L.bg} 55%)`, fontFamily, color: L.text }}>
      <div style={{ position: "absolute", left: 70, top: 150, display: "flex", alignItems: "center", gap: 22 }}>
        <LogoMark size={84} delay={-60} />
        <span style={{ fontSize: 34, fontWeight: 800, color: "#fff", background: RED, borderRadius: 999, padding: "10px 26px" }}>A2</span>
      </div>
      <div style={{ position: "absolute", left: 70, top: 270, fontSize: 108, fontWeight: 800, letterSpacing: -4, lineHeight: 0.98 }}>
        <div style={{ color: RED }}>{T.title.lines[0]}</div>
        <div>{T.title.lines[1]}</div>
      </div>
      <div style={{ position: "absolute", right: 60, top: 200, width: 470, ...card, padding: "34px 40px", transform: "rotate(2deg)" }}>
        <Inf parts={ex.inf} size={64} />
        <div style={{ fontSize: 50, fontWeight: 800, marginTop: 20, lineHeight: 1.2 }}>
          Ik <span style={{ color: BLUE }}>bel</span> je <span style={{ color: RED }}>op</span>.
        </div>
      </div>
    </AbsoluteFill>
  );
}

const SCENES = { title: Title, split: Split, rule: Rule, verb: Verb, together: Together, tip: Tip, quizIntro: QuizIntro, quiz: Quiz, cta: Cta };

export function SeparableVerbsVideo({ lang, voice = "separable_voice.wav" }) {
  const T = CONTENT.text[lang];
  const timing = Object.fromEntries(TIMELINE.scenes.map((t) => [t.id, t]));
  return (
    <AbsoluteFill style={{ background: L.bg, fontFamily, color: L.text }}>
      {TIMELINE.voice && <Audio src={staticFile(voice)} />}
      {CONTENT.scenes.map((s) => {
        const t = timing[s.id];
        const Scene = SCENES[s.kind];
        const from = sec(t.start);
        const dur = Math.max(1, sec(t.start + t.dur) - from);
        // Rough speaking windows for the sound bars: each clip until the next one or the scene's tail.
        const marks = t.voice ?? [];
        const at = marks.map((m, i) => [sec(m), i + 1 < marks.length ? sec(marks[i + 1]) - sec(0.5) : dur - sec(s.kind === "quiz" ? 1.4 : 1.6)]);
        return (
          <Sequence key={s.id} from={from} durationInFrames={dur}>
            <Header section={sectionOf(s.kind)} T={T} />
            <Scene s={s} t={t} T={T} lang={lang} />
            <Speaking at={at} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
