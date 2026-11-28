// The full lesson (16:9, ~2:25) of the double infinitive (dubbele infinitief, B1; site topic
// topic.dubbele-infinitief-b1, /en/grammar/dubbele-infinitief-b1/), in the style of the other lesson
// videos (LessonVideo.jsx): an example on the first frame and on every chapter card, animations
// instead of tables, a live summary and a quiz. The three steps follow the grammar page:
// 1. the perfect tense without ge-, 2. which verbs (and hebben or zijn), 3. the verb group at the end.
// Emma's English intro (raw/dubbele_infinitief_voice.wav) plays from 2 s, the music (A Stroll) soft
// under it; after that she reads every Dutch example as it appears (SAYS), the music dipping under her.
// Sentence markup: [x] the conjugated verb (orange), {x} an infinitive
// (green), ~x~ a wrong form (red, struck), <x> a past participle (blue). In EN text, Dutch is *italic*.
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, C, LogoMark, fontFamily } from "./Demo";
import { Rich, Ring, card, gradientText, pop } from "./LessonReel";
import { Strike, clamp } from "./LessonVideo";

export const DI_VIDEO_FPS = 30;
const S = (s) => Math.round(s * DI_VIDEO_FPS);
const FADE = 10;
const RED = "#ff5a5a";
const lift = (p, px = 24) => ({ opacity: p, transform: `translateY(${(1 - p) * px}px)` });
const pill = (color, size = 30) => ({ display: "inline-block", fontSize: size, fontWeight: 700, color, border: `3px solid ${color}`, borderRadius: 999, padding: "6px 22px", whiteSpace: "nowrap" });

// Emma's intro (27 Nov 2026, Google Drive "27 Nov at 19-26.m4a", cut [1.68, 17.95] s, levelled to -19 dB):
// "Have you ever noticed… what is this verb vomit?! You count back, and there are three verbs in one
// sentence. Ik heb moeten wachten. Let's untangle that in three simple steps." raw/dubbele_infinitief_voice.wav.
// count/fix/steps: when she says "three verbs", "Ik heb moeten wachten" and "three steps" (seconds into the clip).
const VOICE = { len: 16.27, count: 7.3, fix: 11.26, steps: 13.5 };
const VOICE_AT = 2;
const atVoice = (t) => VOICE_AT + t; // a time in her clip → in the video

const T = {
  level: "B1",
  topic: "Double infinitive",
  kicker: "Talking about the past",
  title: ["The double infinitive", "*gemoeten* or *moeten*?"],
  sub: "*Ik heb moeten wachten* · for B1 and up · then a quiz",
  chapters: { perfect: "No *ge-*", verbs: "Which verbs", order: "Word order", quiz: "Quiz" },
  chapterSub: {
    perfect: "Two verbs in the perfect tense",
    verbs: "And *hebben* or *zijn*",
    order: "The verbs stay together at the end",
  },
  agendaTitle: "In this lesson",
  rule: {
    title: "Perfect tense + another verb? No *ge-*",
    sub: "The first verb stays an infinitive",
    labels: ["present", "perfect ✗", "perfect ✓"],
    formula: ["*hebben/zijn*", "…", "infinitive", "infinitive"],
  },
  alone: {
    title: "Only one verb? Then it's *ge-* again",
    sub: "No second verb, no double infinitive",
    rows: [
      { s: "Dat [heb] ik nooit <gewild>.", en: "I never wanted that.", tag: "1 verb → *ge-*" },
      { s: "Ik [heb] nooit {willen} {helpen}.", en: "I never wanted to help.", tag: "2 verbs → no *ge-*" },
    ],
  },
  groups: {
    title: "Not just *moeten*",
    sub: "These verbs do it too",
    rows: [
      { label: "*moeten · kunnen · willen · mogen*", s: "Ik [heb] niet {kunnen} {slapen}.", en: "I couldn't sleep." },
      { label: "*zien · horen · voelen*", s: "Ik [heb] je {horen} {schreeuwen}.", en: "I heard you scream." },
      { label: "*laten · helpen · leren*", s: "Zij [heeft] mij {laten} {wachten}.", en: "She kept me waiting." },
      { label: "*gaan · komen · blijven*", s: "Wij [zijn] {gaan} {wandelen}.", en: "We went for a walk.", zijn: true },
    ],
    aux: "*gaan, komen, blijven* → *zijn*. The rest → *hebben*.",
  },
  order: {
    title: "All the verbs at the end",
    sub: "*hebben/zijn* in position 2, the infinitives last",
    slots: ["1", "2", "…", "end"],
    rows: [
      ["Ik", "[heb]", "vandaag lang", "{moeten} {wachten}."],
      ["Gister", "[heb]", "ik te lang", "{moeten} {wachten}."],
    ],
    en: ["I had to wait a long time today.", "Yesterday I had to wait too long."],
    also: "Without the perfect tense: *Ik [moet] {kunnen} {zwemmen}.* (two infinitives at the end)",
  },
  stack: {
    title: "How far can Dutch go? 😅",
    rows: [
      { s: "Ik [kan] het {zien}.", en: "I can see it." },
      { s: "Ik [heb] het {kunnen} {zien}.", en: "I was able to see it." },
      { s: "Ik [had] het {moeten} {kunnen} {zien}.", en: "I should have been able to see it." },
    ],
  },
  summary: {
    title: "Summary",
    sub: "*Ik moet wachten*, but yesterday?",
    steps: ["Perfect tense?", "Two verbs? No *ge-*", "*gaan* & co → *zijn*", "All verbs at the end"],
  },
  quizTitle: "Your turn!",
  quizSub: "4 questions · pause the video if you need more time",
  outroTitle: "Practise the double infinitive in the app",
  outroUrl: "mijntaalstudio.nl/en/grammar/dubbele-infinitief-b1",
  outroCta: "Subscribe for more lessons",
};

const CHAPTERS = ["perfect", "verbs", "order", "quiz"];
// An example on each chapter card.
const CHAPTER_EX = {
  perfect: "Ik [heb] ~gemoeten~ {moeten} {wachten}.",
  verbs: "Ik [heb] {willen} {helpen} · wij [zijn] {gaan} {wandelen}",
  order: "Ik [heb] vandaag lang {moeten} {wachten}.",
};
const QUIZ = [
  { q: "Ik heb gister niet ___ ___.", hint: "kunnen + komen", ans: ["kunnen", "komen"], en: "I couldn't come yesterday.", note: "two infinitives, no *ge-*" },
  { q: "Wij ___ gaan zwemmen.", hint: "hebben or zijn?", ans: ["zijn"], en: "We went swimming.", note: "*gaan* → *zijn*" },
  { q: "Dat heb ik nooit ___.", hint: "willen", ans: ["gewild"], en: "I never wanted that.", note: "only one verb → *ge-*" },
  { q: "Ik heb hem nooit ___ lachen.", hint: "zien", ans: ["zien"], en: "I've never seen him laugh.", note: "*zien*, not *gezien*" },
];
// Emma reads every Dutch example as it appears (27 Nov 2026, "27 Nov at 19-27.m4a" and "19-29.m4a"),
// cut into raw/di/<clip>.wav at the intro's level (clips and lengths: dubbele-infinitief/lesson_clips.json).
// Per scene: [clip, seconds into the scene], timed on the rows' entrances.
const SAYS = {
  rule: [["moet", 0.6], ["heb_moeten", 5.0]],
  alone: [["gewild", 0.6], ["willen_helpen_nooit", 3.6]],
  "chapter:verbs": [["willen_helpen", 0.6], ["gaan_wandelen_a", 2.2]],
  groups: [["kunnen_slapen", 0.6], ["horen_schreeuwen", 3.0], ["laten_wachten", 5.4], ["gaan_wandelen", 7.8]],
  order: [["vandaag", 1.0], ["gister", 3.5]],
  stack: [["kan_zien", 0.6], ["kunnen_zien", 3.0], ["moeten_kunnen_zien", 5.4]],
  "question:0": [["q1", 5.9]],
  "question:1": [["q2", 5.9]],
  "question:2": [["q3", 5.9]],
  "question:3": [["q4", 5.9]],
};
const CLIP_LEN = { moet: 1.34, heb_moeten: 1.56, gewild: 1.52, willen_helpen_nooit: 1.66, willen_helpen: 1.32, gaan_wandelen_a: 1.4, kunnen_slapen: 1.74, horen_schreeuwen: 1.72, laten_wachten: 1.64, gaan_wandelen: 1.58, vandaag: 2.36, gister: 2.6, kan_zien: 1.1, kunnen_zien: 1.52, moeten_kunnen_zien: 2.04, q1: 2.24, q2: 1.64, q3: 1.84, q4: 2.06 };
const saysOf = (s) => SAYS[s.kind === "chapter" ? `chapter:${s.key}` : s.kind === "question" ? `question:${s.i}` : s.kind] ?? [];
const ANSWER_AT = 5.6;
const QUESTION_SEC = 8.5;

const SCENES = [
  // With Emma's intro the opening lasts until she says "three steps", the agenda comes with it.
  { kind: "hook", sec: VOICE ? atVoice(VOICE.steps) - 0.3 : 7.5, ch: "intro" },
  { kind: "agenda", sec: VOICE ? VOICE.len - VOICE.steps + 4.5 : 7, ch: "intro" },
  { kind: "chapter", key: "perfect", sec: 4.5, ch: "perfect" },
  { kind: "rule", sec: 12.5, ch: "perfect" },
  { kind: "alone", sec: 10, ch: "perfect" },
  { kind: "chapter", key: "verbs", sec: 4.5, ch: "verbs" },
  { kind: "groups", sec: 15, ch: "verbs" },
  { kind: "chapter", key: "order", sec: 4.5, ch: "order" },
  { kind: "order", sec: 13, ch: "order" },
  { kind: "stack", sec: 10, ch: "order" },
  { kind: "summary", sec: 12, ch: "summary" },
  { kind: "quizIntro", sec: 3.5, ch: "quiz" },
  ...QUIZ.map((q, i) => ({ kind: "question", q, i, sec: QUESTION_SEC, ch: "quiz" })),
  { kind: "outro", sec: 10, ch: "outro" },
].map((s, i, all) => ({ ...s, from: all.slice(0, i).reduce((n, x) => n + S(x.sec), 0), len: S(s.sec) }));

export const diVideoDuration = () => SCENES.reduce((n, s) => n + s.len, 0);
/** YouTube chapters: "0:00 Intro", one line per chapter. */
export const diVideoChapters = () => {
  const seen = new Set();
  const names = { intro: "Intro", perfect: "No ge-: the perfect tense", verbs: "Which verbs (hebben or zijn)", order: "Word order", summary: "Summary", quiz: "Quiz" };
  return SCENES.filter((s) => s.ch !== "outro" && !seen.has(s.ch) && seen.add(s.ch)).map((s) => {
    const sec = Math.floor(s.from / DI_VIDEO_FPS);
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")} ${names[s.ch]}`;
  });
};

/* ---------- sentences ---------- */

const tokens = (s) => s.split(/(\[[^\]]+\]|\{[^}]+\}|~[^~]+~|<[^>]+>)/).filter(Boolean);
/** A sentence in colour; `strike` (0 → 1) draws the line through ~wrong~ forms, `hideWrong` leaves them out. */
function Sentence({ s, strike = 1, hideWrong = false }) {
  return tokens(s).map((t, i) => {
    const inner = t.slice(1, -1);
    if (t.startsWith("[")) return <span key={i} style={{ color: C.orange }}>{inner}</span>;
    if (t.startsWith("{")) return <span key={i} style={{ color: C.green }}>{inner}</span>;
    if (t.startsWith("<")) return <span key={i} style={{ color: C.blue }}>{inner}</span>;
    if (t.startsWith("~"))
      return hideWrong ? null : (
        <span key={i} style={{ position: "relative", color: RED, marginRight: "0.3em" }}>
          {inner}
          <Strike p={strike} color={RED} />
        </span>
      );
    return <span key={i}>{hideWrong && tokens(s)[i - 1]?.startsWith("~") ? t.replace(/^ /, "") : t}</span>;
  });
}

/* ---------- frame ---------- */

function Header({ ch }) {
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 44, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28 }}>
        <LogoMark size={54} />
        <span style={{ fontWeight: 800 }}>Taal Studio</span>
        <span style={{ color: C.dim, fontWeight: 500 }}>
          · {T.level} · {T.topic}
        </span>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {CHAPTERS.map((k, i) => {
          const on = k === ch;
          return (
            <span key={k} style={{ fontSize: 22, fontWeight: 700, padding: "8px 18px", borderRadius: 999, whiteSpace: "pre", color: on ? C.bg : C.dim, background: on ? C.green : "rgba(255,255,255,0.05)", border: `1px solid ${on ? C.green : "rgba(255,255,255,0.09)"}` }}>
              {k === "quiz" ? "" : `${i + 1}  `}
              <Rich text={T.chapters[k]} />
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Scene({ len, header, ch, still, children }) {
  const f = useCurrentFrame();
  const enter = still ? 1 : interpolate(f, [0, FADE], [0, 1], clamp);
  const leave = interpolate(f, [len - FADE, len], [1, 0], clamp);
  return (
    <AbsoluteFill>
      {header && <Header ch={ch} />}
      <AbsoluteFill style={{ opacity: Math.min(enter, leave), transform: `translateY(${(1 - enter) * 24}px)` }}>
        <div style={{ position: "absolute", left: 150, right: 150, top: 150, bottom: 90, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function Heading({ title, sub }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, fps, 2);
  const b = pop(f, fps, 10);
  return (
    <div style={{ marginBottom: 50 }}>
      <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.08, ...lift(a) }}>
        <Rich text={title} />
      </div>
      {sub && (
        <div style={{ fontSize: 38, fontWeight: 500, color: C.dim, marginTop: 14, opacity: b }}>
          <Rich text={sub} />
        </div>
      )}
    </div>
  );
}

/** "gemoeten": the ge- drops off (fall 0 → 1) and the word closes up behind it. */
function Gemoeten({ fall, size }) {
  return (
    <span style={{ color: fall > 0.5 ? C.green : RED }}>
      <span style={{ display: "inline-block", width: fall > 0 ? `${1.2 * (1 - fall)}em` : "auto", whiteSpace: "nowrap", overflow: "visible", fontSize: size }}>
        <span style={{ display: "inline-block", opacity: 1 - fall, transform: `translateY(${fall * 1.6}em) rotate(${fall * 50}deg)` }}>ge</span>
      </span>
      moeten
    </span>
  );
}

/* ---------- scenes ---------- */

/** Complete on frame 0: the title and "Ik heb gemoeten wachten" ✗; the ge- drops off: "moeten" ✓. */
function Hook() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  // The ge- drops off as Emma says "Ik heb moeten wachten"; before that, "three verbs" get 1 · 2 · 3.
  const at = VOICE ? S(atVoice(VOICE.fix)) - 4 : S(3.2);
  const count = VOICE ? S(atVoice(VOICE.count)) : null;
  const fall = interpolate(f, [at, at + 16], [0, 1], clamp);
  const ok = pop(f, fps, at + 12, 12);
  const badge = (k) => (count == null ? 0 : pop(f, fps, count + k * 9, 9));
  const Num = ({ k, children }) => (
    <span style={{ position: "relative", display: "inline-block" }}>
      {children}
      <span style={{ position: "absolute", left: "50%", top: -44, width: 50, height: 50, marginLeft: -25, borderRadius: 25, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: C.bg, background: C.orange, opacity: badge(k), transform: `scale(${badge(k)})` }}>{k + 1}</span>
    </span>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 60, height: "100%" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 44 }}>
          <LogoMark size={110} delay={-60} />
          <span style={{ fontSize: 40, fontWeight: 800, padding: "10px 26px", borderRadius: 999, background: C.orange, color: C.bg }}>{T.level}</span>
        </div>
        <div style={{ fontSize: 44, fontWeight: 800, color: C.dim, letterSpacing: 1, marginBottom: 10 }}>{T.kicker}:</div>
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -3, lineHeight: 1.04 }}>
          <div>{T.title[0]}</div>
          <div style={{ ...gradientText, paddingBottom: 8 }}>
            <Rich text={T.title[1]} />
          </div>
        </div>
        <div style={{ fontSize: 40, color: C.dim, marginTop: 24 }}>
          <Rich text={T.sub} />
        </div>
      </div>
      <div style={{ ...card, position: "relative", alignSelf: "flex-start", padding: "34px 54px", borderColor: ok > 0.5 ? "rgba(47,210,122,0.5)" : "rgba(255,90,90,0.5)" }}>
        <div style={{ fontSize: 78, fontWeight: 800, whiteSpace: "nowrap" }}>
          Ik <Num k={0}><span style={{ color: C.orange }}>heb</span></Num> <Num k={1}><Gemoeten fall={fall} /></Num> <Num k={2}><span style={{ color: C.green }}>wachten</span></Num>.
        </div>
        <div style={{ fontSize: 36, color: C.dim, marginTop: 10, opacity: ok }}>I had to wait.</div>
        <div style={{ position: "absolute", right: 34, top: -38, width: 88, height: 88, borderRadius: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, fontWeight: 800, color: C.bg, background: ok > 0.5 ? C.green : RED, transform: `scale(${ok > 0.5 ? 0.6 + 0.4 * ok : 1})` }}>{ok > 0.5 ? "✓" : "✗"}</div>
      </div>
    </div>
  );
}

function Agenda() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Heading title={T.agendaTitle} />
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {CHAPTERS.map((k, i) => {
          const s = pop(f, fps, 14 + i * 12);
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 30, fontSize: 52, fontWeight: 700, opacity: s, transform: `translateX(${(1 - s) * -50}px)` }}>
              <span style={{ width: 76, height: 76, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800, background: k === "quiz" ? C.orange : "rgba(79,156,249,0.16)", color: k === "quiz" ? C.bg : C.blue }}>{k === "quiz" ? "?" : i + 1}</span>
              <Rich text={T.chapters[k]} />
              {k !== "quiz" && (
                <span style={{ fontSize: 36, color: C.dim, fontWeight: 500 }}>
                  <Rich text={T.chapterSub[k]} />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/** A chapter's card: a big number, the title, what it's about, and an example right away. */
function Chapter({ k }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = pop(f, fps, 0, 11);
  const t = pop(f, fps, 8);
  const sub = pop(f, fps, 16);
  const e = pop(f, fps, 14);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 70, height: "100%" }}>
      <div style={{ fontSize: 340, fontWeight: 800, lineHeight: 1, ...gradientText, transform: `scale(${0.6 + 0.4 * n})`, opacity: n }}>{CHAPTERS.indexOf(k) + 1}</div>
      <div>
        <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: -2.5, opacity: t, transform: `translateX(${(1 - t) * 40}px)` }}>
          <Rich text={T.chapters[k]} />
        </div>
        <div style={{ fontSize: 48, color: C.dim, marginTop: 16, opacity: sub }}>
          <Rich text={T.chapterSub[k]} />
        </div>
        <div style={{ ...card, display: "inline-block", marginTop: 44, padding: "22px 44px", fontSize: 64, fontWeight: 800, ...lift(e, 30) }}>
          <Sentence s={CHAPTER_EX[k]} />
        </div>
      </div>
    </div>
  );
}

/** Ik moet wachten → Ik heb gemoeten wachten ✗ → Ik heb moeten wachten ✓, and the formula. */
function Rule() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const R = T.rule;
  const rows = [
    { s: "Ik [moet] {wachten}.", at: 16 },
    { s: "Ik [heb] ~gemoeten~ {wachten}.", at: 16 + S(2), wrong: true },
    { s: "Ik [heb] {moeten} {wachten}.", at: 16 + S(4.4), right: true },
  ];
  const strike = interpolate(f, [16 + S(3.2), 16 + S(3.8)], [0, 1], clamp);
  const formula = pop(f, fps, 16 + S(6.6));
  return (
    <>
      <Heading title={R.title} sub={R.sub} />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {rows.map((r, i) => {
          const p = pop(f, fps, r.at);
          return (
            <div key={i} style={{ ...card, display: "grid", gridTemplateColumns: "260px 1fr auto", alignItems: "center", padding: "18px 44px", opacity: (r.wrong ? 1 - 0.45 * strike : 1) * p, transform: `translateX(${(1 - p) * -40}px)`, borderColor: r.right ? "rgba(47,210,122,0.45)" : undefined }}>
              <span style={{ fontSize: 30, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1.5 }}>{R.labels[i]}</span>
              <span style={{ fontSize: 68, fontWeight: 800 }}>
                <Sentence s={r.s} strike={strike} />
              </span>
              <span style={{ fontSize: 56 }}>{r.right ? "✅" : r.wrong ? (strike > 0.5 ? "❌" : "") : ""}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 34, opacity: formula, transform: `translateY(${(1 - formula) * 16}px)` }}>
        {R.formula.map((x, i) => (
          <span key={i} style={{ ...pill(i === 0 ? C.orange : i === 1 ? C.dim : C.green, 34) }}>
            <Rich text={x} />
          </span>
        ))}
      </div>
    </>
  );
}

/** One verb: ge- (Dat heb ik nooit gewild). Two verbs: no ge- (Ik heb nooit willen helpen). */
function Alone() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const A = T.alone;
  return (
    <>
      <Heading title={A.title} sub={A.sub} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {A.rows.map((r, i) => {
          const p = pop(f, fps, 16 + i * S(3));
          const tag = pop(f, fps, 16 + i * S(3) + 18);
          return (
            <div key={i} style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "26px 44px", ...lift(p) }}>
              <div>
                <div style={{ fontSize: 72, fontWeight: 800 }}>
                  <Sentence s={r.s} />
                </div>
                <div style={{ fontSize: 32, color: C.dim, marginTop: 6 }}>{r.en}</div>
              </div>
              <span style={{ ...pill(i ? C.green : C.blue, 32), opacity: tag, transform: `scale(${0.8 + 0.2 * tag})` }}>
                <Rich text={r.tag} />
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Four groups of verbs that do it, each with an example; gaan/komen/blijven take zijn. */
function Groups() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const G = T.groups;
  const step = S(2.4);
  const aux = pop(f, fps, 16 + G.rows.length * step + S(0.6));
  return (
    <>
      <Heading title={G.title} sub={G.sub} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: -16 }}>
        {G.rows.map((r, i) => {
          const p = pop(f, fps, 16 + i * step);
          const lit = r.zijn ? pop(f, fps, 16 + G.rows.length * step + S(0.6), 9) : 0;
          return (
            <div key={i} style={{ ...card, display: "grid", gridTemplateColumns: "520px 1fr", columnGap: 40, alignItems: "center", padding: "16px 40px", opacity: p, transform: `translateX(${(1 - p) * -40}px)`, borderColor: lit > 0.5 ? "rgba(240,140,60,0.6)" : undefined }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: C.text }}>
                <Rich text={r.label} />
              </span>
              <div>
                <div style={{ fontSize: 54, fontWeight: 800, whiteSpace: "nowrap" }}>
                  <Sentence s={r.s} />
                </div>
                <div style={{ fontSize: 28, color: C.dim, marginTop: 2 }}>{r.en}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 28, fontSize: 40, fontWeight: 800, color: C.orange, ...lift(aux, 16) }}>
        💡 <Rich text={G.aux} />
      </div>
    </>
  );
}

/** Position 2 and the end: the verb group stays together at the end, also after inversion. */
function Order() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const O = T.order;
  const also = pop(f, fps, 16 + S(6.6));
  return (
    <>
      <Heading title={O.title} sub={O.sub} />
      <div style={{ display: "grid", gridTemplateColumns: "260px 140px 420px 1fr", gap: "14px 16px", alignItems: "center" }}>
        {O.slots.map((x) => (
          <span key={x} style={{ fontSize: 28, fontWeight: 800, color: C.dim, textTransform: "uppercase", letterSpacing: 1.5, textAlign: "center" }}>{x}</span>
        ))}
        {O.rows.map((row, r) =>
          row.map((cell, c) => {
            const p = pop(f, fps, 16 + r * S(2.6) + c * 6);
            const isEnd = c === 3;
            return (
              <div key={`${r}-${c}`} style={{ ...card, padding: "16px 20px", textAlign: "center", fontSize: 54, fontWeight: 800, whiteSpace: "nowrap", opacity: p, transform: `scale(${0.85 + 0.15 * p})`, borderColor: isEnd ? "rgba(47,210,122,0.5)" : c === 1 ? "rgba(240,140,60,0.5)" : undefined }}>
                <Sentence s={cell} />
              </div>
            );
          }),
        )}
      </div>
      <div style={{ display: "flex", gap: 60, marginTop: 10, fontSize: 28, color: C.dim }}>
        {O.en.map((e, i) => (
          <span key={i} style={{ opacity: pop(f, fps, 16 + i * S(2.6) + 30) }}>
            {i ? "·" : ""} {e}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 34, fontSize: 38, fontWeight: 700, color: C.dim, ...lift(also, 16) }}>
        💡 <Rich text={O.also.replace(/\[([^\]]+)\]/g, "$1").replace(/\{([^}]+)\}/g, "$1")} />
      </div>
    </>
  );
}

/** For fun: the stack grows, one verb at a time. */
function Stack() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const K = T.stack;
  return (
    <>
      <Heading title={K.title} />
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {K.rows.map((r, i) => {
          const p = pop(f, fps, 14 + i * S(2.4));
          return (
            <div key={i} style={{ ...card, padding: "18px 44px", ...lift(p) }}>
              <div style={{ fontSize: 66 - i * 2, fontWeight: 800, whiteSpace: "nowrap" }}>
                <Sentence s={r.s} />
              </div>
              <div style={{ fontSize: 30, color: C.dim, marginTop: 4 }}>{r.en}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** The whole process live: Ik moet wachten → perfect → no ge- → hebben/zijn → all at the end. */
function Summary() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const M = T.summary;
  const step = S(1.6);
  const forms = ["Ik [moet] {wachten}. → Ik [heb] …", "Ik [heb] ~gemoeten~ {moeten} {wachten}.", "Wij [zijn] {gaan} {wandelen}.", "Ik [heb] gisteren lang {moeten} {wachten}."];
  const strike = interpolate(f, [16 + step + 14, 16 + step + 24], [0, 1], clamp);
  return (
    <>
      <Heading title={M.title} sub={M.sub} />
      <div style={{ ...card, padding: "14px 48px", marginTop: -10 }}>
        {M.steps.map((label, i) => {
          const p = pop(f, fps, 16 + i * step);
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "520px 1fr", alignItems: "baseline", padding: "16px 0", borderTop: i ? "1px solid rgba(255,255,255,0.08)" : "none", opacity: p, transform: `translateX(${(1 - p) * -30}px)` }}>
              <div style={{ fontSize: 38, fontWeight: 800, color: C.green }}>
                {i + 1}. <Rich text={label} />
              </div>
              <div style={{ fontSize: 48, fontWeight: 800 }}>
                <Sentence s={forms[i]} strike={strike} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function QuizIntro() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, fps, 0, 10);
  const b = pop(f, fps, 10);
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", height: "100%" }}>
      <div style={{ fontSize: 180, fontWeight: 800, letterSpacing: -4, ...gradientText, transform: `scale(${0.6 + 0.4 * a})` }}>{T.quizTitle}</div>
      <div style={{ fontSize: 46, color: C.dim, marginTop: 20, opacity: b }}>{T.quizSub}</div>
    </div>
  );
}

/** A sentence with gap(s), the hint, a 3-2-1 ring, then the answer and why. */
function Question({ q, i }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = pop(f, fps, S(ANSWER_AT), 11);
  const note = pop(f, fps, S(ANSWER_AT) + 10);
  const cardIn = pop(f, fps, 0);
  const pieces = q.q.split("___");
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", height: "100%" }}>
      <div style={{ fontSize: 36, fontWeight: 700, color: C.dim, letterSpacing: 2, marginBottom: 30 }}>
        QUIZ {i + 1}/{QUIZ.length}
      </div>
      <div style={{ ...card, width: 1300, padding: "54px 40px", transform: `scale(${0.94 + 0.06 * cardIn})` }}>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.3 }}>
          {pieces.map((piece, k) => (
            <span key={k}>
              {piece}
              {k < q.ans.length && (
                <span style={{ display: "inline-block", minWidth: 170, padding: "0 16px", margin: "0 6px", borderRadius: 18, borderBottom: reveal > 0.05 ? "none" : `6px solid ${C.orange}`, background: reveal > 0.05 ? "rgba(47,210,122,0.16)" : "transparent", color: C.green }}>
                  <span style={{ display: "inline-block", transform: `scale(${reveal})`, opacity: reveal }}>{q.ans[k]}</span>
                </span>
              )}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 44, fontWeight: 700, color: C.orange, marginTop: 24 }}>({q.hint})</div>
        <div style={{ fontSize: 34, color: C.dim, marginTop: 14 }}>{q.en}</div>
      </div>
      <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {f < S(ANSWER_AT) + 6 ? (
          <Ring start={S(0.8)} len={S(ANSWER_AT - 0.8)} />
        ) : (
          <div style={{ fontSize: 54, fontWeight: 800, color: C.green, opacity: note, transform: `translateY(${(1 - note) * 20}px)` }}>
            ✓ <Rich text={q.note} />
          </div>
        )}
      </div>
    </div>
  );
}

/** The outro leaves the right side free for YouTube's end-screen elements. */
function Outro() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, fps, 8);
  const url = pop(f, fps, 18);
  const cta = pop(f, fps, 28, 12);
  return (
    <div style={{ width: 1040, display: "flex", flexDirection: "column", gap: 34 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <LogoMark size={130} />
        <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -3 }}>Taal Studio</div>
      </div>
      <div style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.15, ...lift(a, 20) }}>{T.outroTitle}</div>
      <div style={{ fontSize: 32, fontWeight: 700, whiteSpace: "nowrap", ...gradientText, backgroundImage: `linear-gradient(90deg, ${C.blue}, ${C.green} 60%, ${C.orange})`, opacity: url }}>{T.outroUrl}</div>
      <div style={{ alignSelf: "flex-start", fontSize: 38, fontWeight: 800, color: C.bg, background: `linear-gradient(90deg, ${C.blue}, ${C.green})`, padding: "18px 40px", borderRadius: 999, opacity: cta, transform: `scale(${0.85 + 0.15 * cta})` }}>{T.outroCta}</div>
    </div>
  );
}

export function DoubleInfinitiveVideo() {
  const total = diVideoDuration();
  const vEnd = VOICE ? VOICE_AT + VOICE.len : 0;
  // Music: soft before and very soft under Emma's intro, then up to its usual level; out at the end.
  // Under each spoken example the music dips (to 35%).
  const said = SCENES.flatMap((sc) => saysOf(sc).map(([c, at]) => [sc.from + S(at), sc.from + S(at + CLIP_LEN[c])]));
  const dip = (fr) => Math.min(1, ...said.map(([a, b]) => interpolate(fr, [a - 9, a, b, b + 12], [1, 0.35, 0.35, 1], clamp)));
  const music = (fr) =>
    (VOICE
      ? interpolate(fr, [0, S(VOICE_AT - 0.35), S(VOICE_AT), S(vEnd + 0.2), S(vEnd + 0.6), S(vEnd + 3.6), total - 90, total], [0.3, 0.3, 0.05, 0.05, 0.3, 0.7, 0.7, 0], clamp)
      : interpolate(fr, [0, 30, total - 90, total], [0, 1, 1, 0], clamp)) * dip(fr);
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily, color: C.text }}>
      <Backdrop />
      <Audio src={staticFile("music/a-stroll.mp3")} volume={music} />
      {VOICE && (
        <Sequence from={S(VOICE_AT)}>
          <Audio src={staticFile("dubbele_infinitief_voice.wav")} />
        </Sequence>
      )}
      {SCENES.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.len}>
          {saysOf(s).map(([c, at]) => (
            <Sequence key={c} from={S(at)}>
              <Audio src={staticFile(`di/${c}.wav`)} />
            </Sequence>
          ))}
          <Scene len={s.len} header={s.kind !== "hook" && s.kind !== "outro"} ch={s.ch} still={s.kind === "hook"}>
            {s.kind === "hook" && <Hook />}
            {s.kind === "agenda" && <Agenda />}
            {s.kind === "chapter" && <Chapter k={s.key} />}
            {s.kind === "rule" && <Rule />}
            {s.kind === "alone" && <Alone />}
            {s.kind === "groups" && <Groups />}
            {s.kind === "order" && <Order />}
            {s.kind === "stack" && <Stack />}
            {s.kind === "summary" && <Summary />}
            {s.kind === "quizIntro" && <QuizIntro />}
            {s.kind === "question" && <Question q={s.q} i={s.i} />}
            {s.kind === "outro" && <Outro />}
          </Scene>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

/** The thumbnail: "Double infinitive explained" and the classic slip, fixed. */
export function DoubleInfinitiveThumb() {
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily, color: C.text }}>
      <Backdrop />
      <div style={{ position: "absolute", left: 70, top: 70, width: 1100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 30 }}>
          <LogoMark size={80} delay={-60} />
          <span style={{ fontSize: 34, fontWeight: 800, padding: "8px 22px", borderRadius: 999, background: C.orange, color: C.bg }}>B1</span>
        </div>
        <div style={{ fontSize: 40, fontWeight: 800, color: C.dim, marginBottom: 8 }}>Talking about the past</div>
        <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -3, lineHeight: 1.02 }}>
          Double infinitive
          <div style={{ ...gradientText, fontStyle: "italic", fontSize: 80, marginTop: 4 }}>gemoeten or moeten?</div>
        </div>
      </div>
      <div style={{ position: "absolute", right: 60, bottom: 60, ...card, padding: "22px 34px", background: "rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize: 50, fontWeight: 800, whiteSpace: "nowrap" }}>
          Ik heb <span style={{ position: "relative", color: RED }}>gemoeten<Strike p={1} color={RED} /></span>
        </div>
        <div style={{ fontSize: 50, fontWeight: 800, whiteSpace: "nowrap", marginTop: 6 }}>
          Ik heb <span style={{ color: C.green }}>moeten wachten</span> ✓
        </div>
      </div>
    </AbsoluteFill>
  );
}
