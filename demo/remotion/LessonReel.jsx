// A lesson reel (9:16): the grammar of one lesson in a few animated steps,
// then a quiz with a countdown, then the call to action. The content comes
// from lessons.js; the look (backdrop, logo, colours) from Demo.jsx.
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, C, FPS, LogoMark, fontFamily } from "./Demo";
import { MUSIC } from "./manifests";
import { LESSONS, verb } from "./lessons";

const S = (sec) => Math.round(sec * FPS);
const FADE = 8; // frames each scene fades in and out

// Seconds per scene; the quiz has one card per question.
const LEN = { hook: 3.2, stems: 7.6, table: 6.6, trap: 4.8, quizIntro: 1.9, question: 5.6, outro: 3.6 };
const ANSWER_AT = 3.7; // a question's countdown runs from 0.6 s to here

function scenesOf(lesson) {
  return [
    { kind: "hook", sec: LEN.hook },
    { kind: "stems", sec: LEN.stems },
    { kind: "table", sec: LEN.table },
    { kind: "trap", sec: LEN.trap },
    { kind: "quizIntro", sec: LEN.quizIntro },
    ...lesson.quiz.map((q, i) => ({ kind: "question", sec: LEN.question, q, i })),
    { kind: "outro", sec: LEN.outro },
  ];
}

export const lessonDuration = (id) => scenesOf(LESSONS[id]).reduce((n, s) => n + S(s.sec), 0);

export function LessonReel({ lesson: id, lang }) {
  const lesson = LESSONS[id];
  const T = lesson.text[lang];
  const scenes = scenesOf(lesson);
  const total = lessonDuration(id);
  let from = 0;
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily, color: C.text }}>
      <Backdrop />
      {scenes.map((s, i) => {
        const len = S(s.sec);
        const at = from;
        from += len;
        return (
          <Sequence key={i} from={at} durationInFrames={len}>
            <Scene len={len}>
              {s.kind === "hook" && <Hook lesson={lesson} T={T} />}
              {s.kind === "stems" && <Stems lesson={lesson} T={T} />}
              {s.kind === "table" && <Table lesson={lesson} T={T} />}
              {s.kind === "trap" && <Trap T={T} />}
              {s.kind === "quizIntro" && <QuizIntro T={T} />}
              {s.kind === "question" && <Question q={s.q} i={s.i} n={lesson.quiz.length} T={T} lang={lang} />}
              {s.kind === "outro" && <Outro T={T} />}
            </Scene>
          </Sequence>
        );
      })}
      {MUSIC && (
        <Audio
          src={staticFile("music.mp3")}
          volume={(f) => interpolate(f, [0, 15, total - 30, total], [0, 0.7, 0.7, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      )}
    </AbsoluteFill>
  );
}

/* ---------- building blocks ---------- */

const pop = (f, fps, delay = 0, damping = 15) => spring({ frame: f - delay, fps, config: { damping } });

/** Every scene fades and lifts in, and fades out at its end. */
function Scene({ len, children }) {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, FADE], [0, 1], { extrapolateRight: "clamp" });
  const leave = interpolate(f, [len - FADE, len], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: Math.min(enter, leave), transform: `translateY(${(1 - enter) * 30}px)` }}>
      <div style={{ position: "absolute", left: 80, right: 80, top: 240, bottom: 400, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>
    </AbsoluteFill>
  );
}

function Heading({ title, sub, center = false }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, fps, 2);
  const b = pop(f, fps, 10);
  return (
    <div style={{ textAlign: center ? "center" : "left", marginBottom: 70 }}>
      <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05, opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>{title}</div>
      {sub && <div style={{ fontSize: 44, fontWeight: 500, color: C.dim, marginTop: 18, opacity: b }}>{sub}</div>}
    </div>
  );
}

const gradientText = {
  color: "transparent",
  backgroundImage: `linear-gradient(90deg, ${C.blue}, ${C.green})`,
  WebkitBackgroundClip: "text",
};

const card = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 32,
};

/* ---------- scenes ---------- */

function Hook({ lesson, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chip = pop(f, fps, 4, 12);
  const l1 = pop(f, fps, 8);
  const l2 = pop(f, fps, 14);
  const sub = pop(f, fps, 24);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 56 }}>
        <LogoMark size={110} />
        <span
          style={{
            fontSize: 40,
            fontWeight: 800,
            padding: "10px 26px",
            borderRadius: 999,
            background: C.orange,
            color: C.bg,
            transform: `scale(${chip})`,
          }}
        >
          {lesson.level}
        </span>
      </div>
      <div style={{ fontSize: 112, fontWeight: 800, letterSpacing: -3, lineHeight: 1.02 }}>
        <div style={{ opacity: l1, transform: `translateY(${(1 - l1) * 50}px)` }}>{T.title[0]}</div>
        <div style={{ ...gradientText, opacity: l2, transform: `translateY(${(1 - l2) * 50}px)` }}>{T.title[1]}</div>
      </div>
      <div style={{ fontSize: 50, fontWeight: 500, color: C.dim, marginTop: 40, opacity: sub }}>{T.sub}</div>
    </div>
  );
}

/** werken → werk: the -en is struck off, the stem appears. One row after another. */
function Stems({ lesson, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Heading title={T.stemTitle} sub={T.stemSub} />
      <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
        {lesson.stems.map((row, i) => {
          const v = verb(row.verb);
          const start = 18 + i * S(1.35);
          const inn = pop(f, fps, start);
          const strike = interpolate(f, [start + 10, start + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const out = pop(f, fps, start + 20);
          const note = pop(f, fps, start + 28);
          return (
            <div key={row.verb} style={{ ...card, padding: "26px 36px", opacity: inn, transform: `translateX(${(1 - inn) * -60}px)` }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 26, fontSize: 70, fontWeight: 800 }}>
                <span>
                  {v.nl.slice(0, -2)}
                  <span style={{ position: "relative", color: C.orange, opacity: 1 - strike * 0.6 }}>
                    {v.nl.slice(-2)}
                    <span
                      style={{
                        position: "absolute",
                        left: -4,
                        top: "52%",
                        height: 7,
                        borderRadius: 4,
                        width: `calc(${strike * 100}% + 8px)`,
                        background: C.orange,
                      }}
                    />
                  </span>
                </span>
                <span style={{ color: C.dim, opacity: out, fontWeight: 500 }}>→</span>
                <span style={{ color: C.green, opacity: out, transform: `scale(${0.7 + 0.3 * out})`, display: "inline-block" }}>{v.stem}</span>
              </div>
              {row.note && <div style={{ fontSize: 36, color: C.dim, marginTop: 6, opacity: note }}>{T.stemNote[row.note]}</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

/** ik werk / jij werkt / … with the ending in colour. */
function Table({ lesson, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = verb(lesson.table);
  const forms = [v.present.ik, v.present.jij, v.present.hij, v.present.wij];
  return (
    <>
      <Heading title={T.tableTitle} sub={`${v.nl} · ${v.en}`} />
      <div style={{ ...card, padding: "16px 40px" }}>
        {forms.map((form, i) => {
          const s = pop(f, fps, 16 + i * 16);
          const end = form.startsWith(v.stem) ? form.slice(v.stem.length) : "";
          const base = end ? v.stem : form;
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
                padding: "26px 0",
                borderTop: i ? "1px solid rgba(255,255,255,0.08)" : "none",
                opacity: s,
                transform: `translateY(${(1 - s) * 30}px)`,
              }}
            >
              <div>
                <div style={{ fontSize: 36, color: C.dim, fontWeight: 500 }}>{T.persons[i]}</div>
                <div style={{ fontSize: 76, fontWeight: 800 }}>
                  {base}
                  <span style={{ color: C.green }}>{end}</span>
                </div>
              </div>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  color: end ? C.green : C.text,
                  border: `2px solid ${end ? C.green : "rgba(255,255,255,0.25)"}`,
                  borderRadius: 999,
                  padding: "8px 22px",
                }}
              >
                {T.endings[i]}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Jij werkt. → Werk jij? : the t falls off. */
function Trap({ T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fall = interpolate(f, [S(1.1), S(1.7)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const second = pop(f, fps, S(1.8), 12);
  const sub = pop(f, fps, S(2.4));
  const from = T.trapFrom; // "Jij werkt."
  const t = from.lastIndexOf("t");
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <div style={{ fontSize: 96, fontWeight: 800, color: C.orange, marginBottom: 70 }}>{T.trapTitle}</div>
      <div style={{ fontSize: 100, fontWeight: 800 }}>
        {from.slice(0, t)}
        <span
          style={{
            display: "inline-block",
            color: C.orange,
            transform: `translateY(${fall * 260}px) rotate(${fall * 70}deg)`,
            opacity: 1 - fall,
          }}
        >
          t
        </span>
        {from.slice(t + 1)}
      </div>
      <div style={{ fontSize: 70, color: C.dim, margin: "26px 0", opacity: second }}>↓</div>
      <div style={{ fontSize: 110, fontWeight: 800, ...gradientText, opacity: second, transform: `scale(${0.8 + 0.2 * second})` }}>{T.trapTo}</div>
      <div style={{ fontSize: 46, color: C.dim, marginTop: 60, opacity: sub }}>{T.trapSub}</div>
    </div>
  );
}

function QuizIntro({ T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, fps, 0, 10);
  const b = pop(f, fps, 10);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <div style={{ fontSize: 150, fontWeight: 800, letterSpacing: -4, ...gradientText, transform: `scale(${0.6 + 0.4 * a})` }}>{T.quizTitle}</div>
      <div style={{ fontSize: 48, color: C.dim, marginTop: 30, opacity: b }}>{T.quizSub}</div>
    </div>
  );
}

/** A sentence with a gap, the verb as a hint, a 3-2-1 ring, then the answer. */
function Question({ q, i, n, T, lang }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = verb(q.verb);
  let answer = v.present[q.person];
  if (q.capital) answer = answer[0].toUpperCase() + answer.slice(1);
  const [before, after] = q.sentence.split("___");
  const reveal = pop(f, fps, S(ANSWER_AT), 11);
  const note = pop(f, fps, S(ANSWER_AT) + 10);
  const cardIn = pop(f, fps, 0);
  const gloss = T.gloss[q.sentence];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <div style={{ fontSize: 40, fontWeight: 700, color: C.dim, letterSpacing: 2, marginBottom: 34 }}>
        QUIZ {i + 1}/{n}
      </div>
      <div style={{ ...card, width: "100%", padding: "60px 40px", transform: `scale(${0.92 + 0.08 * cardIn})` }}>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.3 }}>
          {before}
          <span
            style={{
              display: "inline-block",
              padding: "0 16px",
              margin: "0 6px",
              borderRadius: 18,
              borderBottom: reveal > 0.05 ? "none" : `6px solid ${C.orange}`,
              background: reveal > 0.05 ? "rgba(47,210,122,0.16)" : "transparent",
              color: C.green,
            }}
          >
            <span style={{ display: "inline-block", transform: `scale(${reveal})`, opacity: reveal }}>{answer}</span>
          </span>
          {after}
        </div>
        <div style={{ fontSize: 44, fontWeight: 700, color: C.orange, marginTop: 28 }}>({v.nl})</div>
        {lang === "en" && gloss && <div style={{ fontSize: 38, color: C.dim, marginTop: 18 }}>{gloss}</div>}
      </div>
      <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {f < S(ANSWER_AT) + 6 ? (
          <Ring start={S(0.6)} len={S(ANSWER_AT - 0.6)} />
        ) : (
          <div style={{ fontSize: 54, fontWeight: 800, color: C.green, opacity: note, transform: `translateY(${(1 - note) * 20}px)` }}>
            ✓ {T.quizNote[q.note]}
          </div>
        )}
      </div>
    </div>
  );
}

/** The 3-2-1 countdown ring. */
function Ring({ start, len }) {
  const f = useCurrentFrame() - start;
  const { fps } = useVideoConfig();
  if (f < 0) return null;
  const left = Math.max(0, len - f);
  const num = Math.max(1, Math.ceil((left / len) * 3));
  const p = pop(f, fps, 0, 12);
  const tick = spring({ frame: f % Math.round(len / 3), fps, config: { damping: 10, mass: 0.5 } });
  const r = 80;
  const arc = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 200, height: 200, transform: `scale(${0.6 + 0.4 * p})`, opacity: p }}>
      <svg width={200} height={200} style={{ position: "absolute", inset: 0 }}>
        <circle cx={100} cy={100} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={12} />
        <circle
          cx={100}
          cy={100}
          r={r}
          fill="none"
          stroke={C.orange}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={arc}
          strokeDashoffset={arc * (1 - left / len)}
          transform="rotate(-90 100 100)"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 96, fontWeight: 800, transform: `scale(${1.25 - 0.25 * tick})` }}>
        {num}
      </div>
    </div>
  );
}

function Outro({ T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const url = pop(f, fps, 12);
  const cta = pop(f, fps, 22, 12);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 44, textAlign: "center" }}>
      <LogoMark size={170} />
      <div style={{ fontSize: 100, fontWeight: 800, letterSpacing: -3 }}>Taal Studio</div>
      <div style={{ fontSize: 58, fontWeight: 700, ...gradientText, backgroundImage: `linear-gradient(90deg, ${C.blue}, ${C.green} 60%, ${C.orange})`, opacity: url }}>
        mijntaalstudio.nl
      </div>
      <div
        style={{
          fontSize: 44,
          fontWeight: 800,
          color: C.bg,
          background: `linear-gradient(90deg, ${C.blue}, ${C.green})`,
          padding: "22px 44px",
          borderRadius: 999,
          opacity: cta,
          transform: `scale(${0.85 + 0.15 * cta})`,
        }}
      >
        {T.outro}
      </div>
    </div>
  );
}
