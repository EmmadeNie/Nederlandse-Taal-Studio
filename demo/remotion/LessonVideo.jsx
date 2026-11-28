// A full lesson video (16:9, a few minutes): the grammar page's explanation in
// chapters, a summary, a quiz with a countdown, and an outro that leaves room
// on the right for YouTube's end-screen elements. Everything is on screen, at a
// pace you can read; a lesson can open with Emma's recorded intro (L.voice).
// Content: LESSON_VIDEOS in lessons.js; timeline: lessonVideoScenes.js;
// building blocks: LessonReel.jsx.
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useAudioData } from "@remotion/media-utils";
import { Backdrop, C, LogoMark, fontFamily } from "./Demo";
import { MUSIC, MUSIC_FILES } from "./manifests";
import { LESSON_VIDEOS, fill, pastParts, quizAnswers, verb } from "./lessons";
import { PastExamples, PastNotes, PastSummary, PastTable, PastThumbCard } from "./LessonVideoPast";
import { PAux, PWhat, PContrast, PForm, PFormula, PIrregular, PKofschip, PNotes, POrder, POrder2, PTrap, PZijn, PerfectThumbCard } from "./LessonVideoPerfect";
import { FallingT, Rich, Ring, card, gradientText, pop } from "./LessonReel";
import { ANSWER_AT, S, STEM_T_STEP, stemStep, stemTNoteAt, stemsWhyAt, videoDuration, videoScenes } from "./lessonVideoScenes";

const FADE = 10;
// The chapters in the header: the lesson's own, else the present tense's.
const chaptersOf = (L) => L.chapters ?? ["stem", "ending", "stemT", "inversion", "quiz"];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

export function LessonVideo({ lesson: id, lang }) {
  const L = LESSON_VIDEOS[id];
  const T = L.text[lang];
  const total = videoDuration(id);
  // The lesson's own track from raw/music/ (MUSIC.md), else the usual music.mp3.
  const music = MUSIC_FILES.includes(L.music) ? L.music : MUSIC ? "music.mp3" : null;
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily, color: C.text }}>
      <Backdrop />
      {videoScenes(id).map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.len}>
          <Scene len={s.len} header={s.kind !== "hook" && s.kind !== "outro"} ch={s.ch} L={L} T={T}>
            {s.kind === "hook" && <Hook L={L} T={T} />}
            {s.kind === "agenda" && <Agenda L={L} T={T} />}
            {s.kind === "intro" && <Intro L={L} T={T} />}
            {s.kind === "chapter" && <Chapter k={s.key} L={L} T={T} />}
            {s.kind === "stems" && <Stems g={s.g} T={T} />}
            {s.kind === "table" && <Table L={L} T={T} />}
            {s.kind === "examples" && <Examples L={L} T={T} />}
            {s.kind === "stemT" && <StemT L={L} T={T} />}
            {s.kind === "inversion" && <Inversion L={L} T={T} lang={lang} />}
            {s.kind === "inversionNote" && <InversionNote T={T} />}
            {s.kind === "summary" && <Summary T={T} />}
            {s.kind === "pWhat" && <PWhat L={L} T={T} />}
            {s.kind === "pForm" && <PForm L={L} T={T} lang={lang} />}
            {s.kind === "pAux" && <PAux L={L} T={T} />}
            {s.kind === "pFormula" && <PFormula L={L} T={T} />}
            {s.kind === "pKofschip" && <PKofschip g={s.g} T={T} tense={L.tense} first={s.g === L.kofschip[0]} />}
            {s.kind === "pTrap" && <PTrap L={L} T={T} tense={L.tense} />}
            {s.kind === "pastTable" && <PastTable L={L} T={T} />}
            {s.kind === "pastExamples" && <PastExamples L={L} T={T} />}
            {s.kind === "pastSummary" && <PastSummary L={L} T={T} />}
            {s.kind === "pastNotes" && <PastNotes L={L} T={T} />}
            {s.kind === "pNotes" && <PNotes L={L} T={T} />}
            {s.kind === "pIrregular" && <PIrregular g={s.g} T={T} />}
            {s.kind === "pZijn" && <PZijn L={L} T={T} />}
            {s.kind === "pContrast" && <PContrast L={L} T={T} lang={lang} />}
            {s.kind === "pOrder" && <POrder L={L} T={T} lang={lang} />}
            {s.kind === "pOrder2" && <POrder2 L={L} T={T} lang={lang} />}
            {s.kind === "quizIntro" && <QuizIntro T={T} />}
            {s.kind === "question" && <Question q={s.q} i={s.i} n={L.quiz.length} tense={L.tense} T={T} lang={lang} />}
            {s.kind === "outro" && <Outro T={T} />}
          </Scene>
        </Sequence>
      ))}
      {music && <MusicLoop src={staticFile(music)} total={total} duck={L.voice ? duckFor(L.voice) : undefined} />}
      {L.voice && (
        <Sequence from={S(L.voice.at)}>
          <Audio src={staticFile(L.voice.src)} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
}

/* ---------- frame ---------- */

/**
 * With Emma's voice at the start (L.voice): the music soft before it (as in the Reel), very soft
 * under it, then back up to its usual level over 3 s. A factor for each frame of the video.
 */
const duckFor = ({ at, len }) => (frame) =>
  interpolate(frame, [0, S(at - 0.35), S(at), S(at + len + 0.2), S(at + len + 0.6), S(at + len + 3.6)], [0.3, 0.3, 0.05, 0.05, 0.3, 1], clamp);

/** The track as often as the video needs it, each repeat crossfading into the next. */
function MusicLoop({ src, total, volume = 1, duck }) {
  const data = useAudioData(src);
  if (!data) return null;
  const len = Math.floor(data.durationInSeconds * S(1));
  const xf = S(3);
  const step = len - xf;
  return Array.from({ length: Math.ceil(total / step) }, (_, k) => {
    const from = k * step;
    const vol = (f) => {
      const master = interpolate(from + f, [0, 30, total - 90, total], [0, volume, volume, 0], clamp);
      const fadeIn = k ? interpolate(f, [0, xf], [0, 1], clamp) : 1;
      const fadeOut = interpolate(f, [len - xf, len], [1, 0], clamp);
      return master * Math.min(fadeIn, fadeOut) * (duck ? duck(from + f) : 1);
    };
    return (
      <Sequence key={k} from={from} durationInFrames={Math.min(len, total - from)}>
        <Audio src={src} volume={vol} />
      </Sequence>
    );
  });
}

function Scene({ len, header, ch, L, T, children }) {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, FADE], [0, 1], { extrapolateRight: "clamp" });
  const leave = interpolate(f, [len - FADE, len], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill>
      {header && <Header ch={ch} L={L} T={T} />}
      <AbsoluteFill style={{ opacity: Math.min(enter, leave), transform: `translateY(${(1 - enter) * 24}px)` }}>
        <div style={{ position: "absolute", left: 150, right: 150, top: 150, bottom: 90, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/** Logo and topic on the left, the chapters on the right (the current one lit). */
function Header({ ch, L, T }) {
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 44, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28 }}>
        <LogoMark size={54} />
        <span style={{ fontWeight: 800 }}>Taal Studio</span>
        <span style={{ color: C.dim, fontWeight: 500 }}>
          · {L.level} · {T.topic}
        </span>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {chaptersOf(L).map((k, i) => {
          const on = k === ch;
          const num = k === "quiz" ? "" : `${i + 1}  `;
          return (
            <span
              key={k}
              style={{
                fontSize: 22,
                fontWeight: 700,
                padding: "8px 18px",
                borderRadius: 999,
                whiteSpace: "pre",
                color: on ? C.bg : C.dim,
                background: on ? C.green : "rgba(255,255,255,0.05)",
                border: `1px solid ${on ? C.green : "rgba(255,255,255,0.09)"}`,
              }}
            >
              {num}
              <Rich text={T.chapters[k]} />
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function Heading({ title, sub, center = false }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, fps, 2);
  const b = pop(f, fps, 10);
  return (
    <div style={{ textAlign: center ? "center" : "left", marginBottom: 54 }}>
      <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.08, opacity: a, transform: `translateY(${(1 - a) * 24}px)` }}>
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

/** A verb form with its ending in green: werk|t. */
function Form({ form, stem, color = C.green }) {
  const end = form.startsWith(stem) ? form.slice(stem.length) : "";
  return (
    <>
      {end ? stem : form}
      <span style={{ color }}>{end}</span>
    </>
  );
}

/** A thick line drawn across a word, left to right (p: 0 → 1). */
export function Strike({ p, color = C.orange }) {
  return <span style={{ position: "absolute", left: -4, top: "52%", height: 7, borderRadius: 4, width: `calc(${p * 100}% + 8px)`, background: color }} />;
}

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };


/* ---------- intro ---------- */

function Hook({ L, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chip = pop(f, fps, 6, 12);
  const l1 = pop(f, fps, 10);
  const l2 = pop(f, fps, 16);
  const sub = pop(f, fps, 28);
  const ex = pop(f, fps, 20);
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 50 }}>
        <LogoMark size={120} />
        <span style={{ fontSize: 40, fontWeight: 800, padding: "10px 26px", borderRadius: 999, background: C.orange, color: C.bg, transform: `scale(${chip})` }}>{L.level}</span>
      </div>
      <div style={{ fontSize: 124, fontWeight: 800, letterSpacing: -3, lineHeight: 1.04 }}>
        <div style={{ opacity: l1, transform: `translateY(${(1 - l1) * 40}px)` }}>{T.title[0]}</div>
        <div style={{ ...gradientText, opacity: l2, transform: `translateY(${(1 - l2) * 40}px)` }}>{T.title[1]}</div>
      </div>
      <div style={{ fontSize: 48, fontWeight: 500, color: C.dim, marginTop: 40, opacity: sub }}>
        <Rich text={T.sub} />
      </div>
      {/* An example right away (L.chapterExamples.intro), before the agenda. */}
      {L.chapterExamples?.intro && (
        <div style={{ ...card, alignSelf: "flex-start", display: "inline-flex", alignItems: "baseline", gap: 30, marginTop: 44, padding: "22px 44px", fontSize: 76, fontWeight: 800, opacity: ex, transform: `translateX(${(1 - ex) * -60}px)` }}>
          <ChapterExample ex={L.chapterExamples.intro} />
        </div>
      )}
    </div>
  );
}

function Agenda({ L, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hint = pop(f, fps, S(2.5));
  return (
    <>
      <Heading title={T.agendaTitle} />
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {chaptersOf(L).map((k, i) => {
          const s = pop(f, fps, 14 + i * 12);
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 30, fontSize: 52, fontWeight: 700, opacity: s, transform: `translateX(${(1 - s) * -50}px)` }}>
              <span style={{ width: 76, height: 76, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800, background: k === "quiz" ? C.orange : "rgba(79,156,249,0.16)", color: k === "quiz" ? C.bg : C.blue }}>
                {k === "quiz" ? "?" : i + 1}
              </span>
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
      <div style={{ alignSelf: "flex-start", marginTop: 44, fontSize: 32, fontWeight: 700, padding: "12px 26px", borderRadius: 999, background: "rgba(240,140,60,0.14)", border: `1px solid rgba(240,140,60,0.5)`, color: C.orange, opacity: hint, transform: `translateY(${(1 - hint) * 16}px)` }}>
        💬 {T.ccHint}
      </div>
    </>
  );
}

/** ik werk · hij werkt · wij werken, then what each ending is, then the rule. */
function Intro({ L, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = verb(L.intro);
  const rows = [
    ["ik", v.present.ik],
    ["hij", v.present.hij],
    ["wij", v.present.wij],
  ];
  const rule = pop(f, fps, S(6.5));
  return (
    <>
      <Heading title={T.introTitle} sub={`${v.nl} · ${v.en}`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 36 }}>
        {rows.map(([p, form], i) => {
          const s = pop(f, fps, 16 + i * 14);
          const lab = pop(f, fps, S(3) + i * 12);
          return (
            <div key={p} style={{ ...card, padding: "40px 40px 34px", textAlign: "center", opacity: s, transform: `translateY(${(1 - s) * 40}px)` }}>
              <div style={{ fontSize: 76, fontWeight: 800, whiteSpace: "nowrap" }}>
                <span style={{ color: C.dim, fontWeight: 600 }}>{p} </span>
                <Form form={form} stem={v.stem} />
              </div>
              <div style={{ marginTop: 22, display: "inline-block", fontSize: 32, fontWeight: 700, color: C.green, border: `2px solid ${C.green}`, borderRadius: 999, padding: "6px 22px", opacity: lab, transform: `scale(${0.8 + 0.2 * lab})` }}>
                {T.introLabels[i]}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 50, fontSize: 38, fontWeight: 700, textAlign: "center", padding: "24px 30px", borderRadius: 24, background: "rgba(79,156,249,0.12)", border: `1px solid rgba(79,156,249,0.35)`, whiteSpace: "pre", opacity: rule, transform: `translateY(${(1 - rule) * 20}px)` }}>
        {T.rule}
      </div>
    </>
  );
}

/** A chapter's title card: a big number, the title, what it's about and (L.chapterExamples) an example right away. */
function Chapter({ k, L, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = pop(f, fps, 0, 11);
  const t = pop(f, fps, 8);
  const sub = pop(f, fps, 16);
  const ex = L.chapterExamples?.[k];
  const e = pop(f, fps, 14);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 70, height: "100%" }}>
      <div style={{ fontSize: 340, fontWeight: 800, lineHeight: 1, ...gradientText, transform: `scale(${0.6 + 0.4 * n})`, opacity: n }}>{chaptersOf(L).indexOf(k) + 1}</div>
      <div>
        <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: -2.5, opacity: t, transform: `translateX(${(1 - t) * 40}px)` }}>
          <Rich text={T.chapters[k]} />
        </div>
        <div style={{ fontSize: 48, color: C.dim, marginTop: 16, opacity: sub }}>
          <Rich text={T.chapterSub[k]} />
        </div>
        {ex && (
          <div style={{ ...card, display: "inline-flex", alignItems: "baseline", gap: 30, marginTop: 44, padding: "22px 44px", fontSize: 76, fontWeight: 800, opacity: e, transform: `translateY(${(1 - e) * 30}px)` }}>
            <ChapterExample ex={ex} />
          </div>
        )}
      </div>
    </div>
  );
}

/** werken → werk · werkte, belde · ik werkte → wij werkten: the ending (or what goes) in colour. */
function ChapterExample({ ex }) {
  const arrow = <span style={{ color: C.dim, fontWeight: 500 }}>→</span>;
  const past = (id, plural = false) => {
    const { stem, end } = pastParts(id, plural);
    return (
      <span>
        {stem}
        <span style={{ color: C.green }}>{end}</span>
      </span>
    );
  };
  if (ex.kind === "stem") {
    const v = verb(ex.verb);
    return (
      <>
        <span>
          {v.nl.slice(0, -2)}
          <span style={{ color: C.orange }}>en</span>
        </span>
        {arrow}
        <span style={{ color: C.green }}>{v.stem}</span>
      </>
    );
  }
  if (ex.kind === "past")
    return ex.verbs.map((id, i) => (
      <span key={id}>
        {i > 0 && <span style={{ color: C.dim, fontWeight: 500, marginRight: 30 }}>·</span>}
        {past(id)}
      </span>
    ));
  return (
    <>
      <span>
        <span style={{ color: C.dim, fontWeight: 600 }}>ik </span>
        {past(ex.verb)}
      </span>
      {arrow}
      <span>
        <span style={{ color: C.dim, fontWeight: 600 }}>wij </span>
        {past(ex.verb, true)}
      </span>
    </>
  );
}

/* ---------- 1. the stem ---------- */

/** werken → werk. When "-en off" isn't the stem yet (mak), it's struck and fixed (maak). */
function Stems({ g, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = T.stems[g.key];
  const step = stemStep(g);
  const why = pop(f, fps, stemsWhyAt(g));
  return (
    <>
      <Heading title={t.title} sub={t.sub} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {g.morph && g.verbs.map((id, i) => <MorphRow key={id} id={id} d={20 + i * step} />)}
        {!g.morph && g.verbs.map((id, i) => {
          const v = verb(id);
          const raw = v.nl.slice(0, -2);
          const fix = raw !== v.stem;
          const d = 20 + i * step;
          const inn = pop(f, fps, d);
          const en = interpolate(f, [d + 10, d + 18], [0, 1], clamp);
          const rawIn = pop(f, fps, d + 20);
          const rawStrike = interpolate(f, [d + 36, d + 44], [0, 1], clamp);
          const stemIn = pop(f, fps, fix ? d + 46 : d + 20);
          return (
            <div key={id} style={{ ...card, display: "grid", gridTemplateColumns: "430px 110px 330px 110px 1fr", alignItems: "center", padding: "20px 40px", fontSize: 72, fontWeight: 800, opacity: inn, transform: `translateX(${(1 - inn) * -50}px)` }}>
              <span>
                {raw}
                <span style={{ position: "relative", color: C.orange, opacity: 1 - en * 0.6 }}>
                  en
                  <Strike p={en} />
                </span>
              </span>
              <span style={{ color: C.dim, fontWeight: 500, opacity: rawIn, justifySelf: "center" }}>→</span>
              {fix ? (
                <>
                  <span style={{ position: "relative", justifySelf: "start", color: C.orange, opacity: rawIn * (1 - rawStrike * 0.5) }}>
                    {raw}
                    <Strike p={rawStrike} />
                  </span>
                  <span style={{ color: C.dim, fontWeight: 500, opacity: stemIn, justifySelf: "center" }}>→</span>
                  <span style={{ color: C.green, opacity: stemIn, transform: `scale(${0.7 + 0.3 * stemIn})`, transformOrigin: "left center", display: "inline-block" }}>{v.stem} ✓</span>
                </>
              ) : (
                <span style={{ color: C.green, opacity: stemIn, transform: `scale(${0.7 + 0.3 * stemIn})`, transformOrigin: "left center", display: "inline-block", gridColumn: "3 / 6" }}>{v.stem} ✓</span>
              )}
            </div>
          );
        })}
      </div>
      {t.why && <div style={{ marginTop: 36, fontSize: 36, color: C.dim, lineHeight: 1.4, opacity: why, transform: `translateY(${(1 - why) * 16}px)` }}>💡 <Rich text={fill(t.why)} /></div>}
    </>
  );
}

/**
 * werken → werk ✓, spelen → spel → speel (an e slides in), bellen → bell → bel (an l drops off),
 * reizen → reiz → reis (the z flips to s), durven → durv → durf. What changes comes from
 * comparing the verb without -en with the stem in the data.
 */
export function MorphRow({ id, d, size = 72, cols = "430px 110px auto 1fr", label: labelSize = 40, lastAt = null }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = verb(id);
  const raw = v.nl.slice(0, -2);
  const stem = v.stem;
  let a = 0;
  while (a < Math.min(raw.length, stem.length) && raw[a] === stem[a]) a++;
  let b = 0;
  while (b < Math.min(raw.length, stem.length) - a && raw[raw.length - 1 - b] === stem[stem.length - 1 - b]) b++;
  const [pre, out, inn, post] = [raw.slice(0, a), raw.slice(a, raw.length - b), stem.slice(a, stem.length - b), raw.slice(raw.length - b)];
  const fix = out || inn;
  const row = pop(f, fps, d);
  const en = interpolate(f, [d + 10, d + 18], [0, 1], clamp);
  const word = pop(f, fps, d + 20);
  // The letter(s) that will change light up, then go (drop off) and the new ones come in.
  const lit = pop(f, fps, d + 32, 12);
  const go = interpolate(f, [d + 44, d + 58], [0, 1], clamp);
  const come = pop(f, fps, d + 52, 11);
  const done = fix ? pop(f, fps, d + 66) : pop(f, fps, d + 26);
  const label = !fix ? null : !out ? `+ ${inn}` : !inn ? `− ${out}` : `${out} → ${inn}`;
  const em = 0.6; // about one letter, in em
  // lastAt: the stem's last letter lights up (highlighter) and moves into a circle, for 't kofschip next.
  const lastP = lastAt == null ? 0 : pop(f, fps, lastAt, 9);
  const bump = Math.sin(Math.min(1, lastP) * Math.PI);
  const lastLetter = stem.slice(-1);
  const hl = (str) =>
    lastP > 0 ? (
      <>
        {str.slice(0, -1)}
        <span style={{ display: "inline-block", color: C.bg, background: `rgba(255,216,74,${lastP})`, borderRadius: 12, padding: "0 6px", margin: "0 -6px", transform: `translateY(${-size * 0.2 * bump}px) scale(${1 + 0.25 * bump})` }}>{str.slice(-1)}</span>
      </>
    ) : (
      str
    );
  const holder = post ? "post" : inn ? "inn" : "pre";
  return (
    <div style={{ ...card, display: "grid", gridTemplateColumns: cols, alignItems: "center", padding: "20px 40px", fontSize: size, fontWeight: 800, opacity: row, transform: `translateX(${(1 - row) * -50}px)` }}>
      <span>
        {raw}
        <span style={{ position: "relative", color: C.orange, opacity: 1 - en * 0.6 }}>
          en
          <Strike p={en} />
        </span>
      </span>
      <span style={{ color: C.dim, fontWeight: 500, opacity: word, justifySelf: "center" }}>→</span>
      <span style={{ opacity: word, whiteSpace: "nowrap", color: done > 0.5 ? C.green : C.text }}>
        {holder === "pre" ? hl(pre) : pre}
        {out && (
          <span style={{ display: "inline-block", width: go > 0 ? `${out.length * em * (1 - go)}em` : "auto", overflow: "visible", whiteSpace: "nowrap", verticalAlign: "bottom" }}>
            <span style={{ display: "inline-block", color: C.orange, background: `rgba(240,140,60,${0.25 * lit * (1 - go)})`, borderRadius: 12, transform: `translateY(${go * 1.6}em) rotate(${go * 50}deg) scale(${1 + 0.15 * lit * (1 - go)})`, opacity: 1 - go }}>{out}</span>
          </span>
        )}
        {inn && (
          <span style={{ display: "inline-block", width: come > 0.98 ? "auto" : `${inn.length * em * come}em`, verticalAlign: "bottom" }}>
            <span style={{ display: "inline-block", color: done > 0.5 ? C.green : C.orange, transform: `translateY(${(1 - come) * -1.2}em) scale(${come})`, opacity: come }}>{holder === "inn" ? hl(inn) : inn}</span>
          </span>
        )}
        {holder === "post" ? hl(post) : post}
        <span style={{ opacity: done * (1 - lastP) }}> ✓</span>
      </span>
      <span style={{ position: "relative", justifySelf: "start", marginLeft: 24, display: "flex", alignItems: "center" }}>
        {label && (
          <span style={{ whiteSpace: "nowrap", fontSize: labelSize, fontWeight: 800, color: C.orange, border: `3px solid ${C.orange}`, borderRadius: 999, padding: "6px 24px", opacity: lit * (1 - lastP), transform: `scale(${0.7 + 0.3 * lit})` }}>{label}</span>
        )}
        {lastP > 0 && (
          <span style={{ position: "absolute", left: 0, top: "50%", width: size * 1.3, height: size * 1.3, marginTop: -size * 0.65, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", border: `4px solid #ffd84a`, color: "#ffd84a", fontSize: size * 0.8, opacity: lastP, transform: `scale(${0.5 + 0.5 * lastP})` }}>{lastLetter}</span>
        )}
      </span>
    </div>
  );
}

/* ---------- 2. the ending ---------- */

const PERSONS = [
  { p: "ik", form: "ik", end: 0 },
  { p: "jij", form: "jij", end: 1 },
  { p: "u", form: "jij", end: 1 },
  { p: "hij", form: "hij", end: 1 },
  { p: "wij", form: "wij", end: 2 },
  { p: "jullie", form: "wij", end: 2 },
  { p: "zij", form: "wij", end: 2 },
];

function Table({ L, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = verb(L.table);
  const col = (title, rows, offset) => (
    <div style={{ ...card, padding: "22px 40px 10px" }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: C.dim, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{title}</div>
      {rows.map((r, i) => {
        const s = pop(f, fps, 18 + (offset + i) * S(0.9));
        const end = r.end > 0;
        return (
          <div key={r.p} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: i ? "1px solid rgba(255,255,255,0.08)" : "none", opacity: s, transform: `translateY(${(1 - s) * 20}px)` }}>
            <div>
              <div style={{ fontSize: 26, color: C.dim, fontWeight: 500 }}>{T.persons[r.p]}</div>
              <div style={{ fontSize: 58, fontWeight: 800 }}>
                <Form form={v.present[r.form]} stem={v.stem} />
              </div>
            </div>
            <span style={{ fontSize: 26, fontWeight: 700, color: end ? C.green : C.text, border: `2px solid ${end ? C.green : "rgba(255,255,255,0.25)"}`, borderRadius: 999, padding: "6px 18px" }}>{T.endings[r.end]}</span>
          </div>
        );
      })}
    </div>
  );
  return (
    <>
      <Heading title={`${v.nl} · ${v.en}`} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, alignItems: "start", marginTop: -20 }}>
        {col(T.tableSingular, PERSONS.slice(0, 4), 0)}
        {col(T.tablePlural, PERSONS.slice(4), 4)}
      </div>
    </>
  );
}

function Examples({ L, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Heading title={T.examplesTitle} sub={T.examplesSub} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
        {L.examples.map((id, c) => {
          const v = verb(id);
          const s = pop(f, fps, 16 + c * S(1.6));
          return (
            <div key={id} style={{ ...card, padding: "30px 36px", opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
              <div style={{ fontSize: 44, fontWeight: 800, color: C.orange }}>{v.nl}</div>
              <div style={{ fontSize: 28, color: C.dim, marginBottom: 14 }}>
                {v.en} · {T.endings[0]}: <b style={{ color: C.text }}>{v.stem}</b>
              </div>
              {["ik", "jij", "wij"].map((p, r) => {
                const row = pop(f, fps, 16 + c * S(1.6) + 10 + r * 8);
                return (
                  <div key={p} style={{ fontSize: 54, fontWeight: 800, padding: "8px 0", opacity: row }}>
                    <span style={{ color: C.dim, fontWeight: 600 }}>{p} </span>
                    <Form form={v.present[p]} stem={v.stem} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------- 3. stem ending in t ---------- */

/** jij praat + t: the extra t comes, and drops off again. */
function StemT({ L, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const step = STEM_T_STEP;
  const note = pop(f, fps, stemTNoteAt(L.stemT));
  return (
    <>
      <Heading title={T.stemTTitle} sub={T.stemTSub} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {L.stemT.map((r, i) => {
          const v = verb(r.verb);
          const d = 20 + i * step;
          const inn = pop(f, fps, d);
          const t = pop(f, fps, d + 14, 12);
          const fall = interpolate(f, [d + 36, d + 54], [0, 1], clamp);
          const ok = pop(f, fps, d + 54);
          return (
            <div key={i} style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 44px", opacity: inn, transform: `translateX(${(1 - inn) * -50}px)` }}>
              <div style={{ fontSize: 76, fontWeight: 800 }}>
                <span style={{ color: C.dim, fontWeight: 600 }}>{r.subject} </span>
                {v.present[r.person]}
                <FallingT fall={fall} show={t} color={fall > 0 ? C.orange : C.green} />
                <span style={{ fontSize: 56, color: C.green, marginLeft: 26, opacity: ok }}>✓</span>
              </div>
              <div style={{ fontSize: 36, color: C.dim }}>
                {v.nl} → {T.endings[0]} <b style={{ color: C.text }}>{v.stem}</b>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 36, fontSize: 38, color: C.dim, opacity: note }}>💡 {T.stemTNote}</div>
    </>
  );
}

/* ---------- 4. jij after the verb ---------- */

/** Jij speelt tennis. → Speel jij tennis? → Vandaag speel jij tennis. */
function Inversion({ L, T, lang }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { verb: id, rest, first } = L.inversion;
  const v = verb(id);
  const form = v.present.jij; // speelt
  const bare = v.present.ik; // speel
  const a = pop(f, fps, 14);
  const b = pop(f, fps, S(2), 12);
  const fall = interpolate(f, [S(3.2), S(3.9)], [0, 1], clamp);
  const ok = pop(f, fps, S(4));
  const c = pop(f, fps, S(5.4), 12);
  const gloss = (i, o) => lang === "en" && T.inversionGloss[i] && <div style={{ fontSize: 30, color: C.dim, fontWeight: 500, marginTop: 4, opacity: o }}>{T.inversionGloss[i]}</div>;
  const line = { ...card, padding: "22px 44px", fontSize: 72, fontWeight: 800 };
  return (
    <>
      <Heading title={T.inversionTitle} sub={T.inversionSub} />
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ ...line, opacity: a }}>
          Jij {bare}
          <span style={{ color: C.green }}>{form.slice(bare.length)}</span> {rest}.{gloss(0, a)}
        </div>
        <div style={{ ...line, opacity: b, transform: `translateX(${(1 - b) * -40}px)`, borderColor: `rgba(47,210,122,${0.4 * fall})` }}>
          <span style={{ color: fall > 0.5 ? C.green : C.text }}>
            {cap(bare)}
            <FallingT fall={fall} /> jij
          </span>{" "}
          {rest}? <span style={{ color: C.green, fontSize: 56, opacity: ok }}>✓</span>
          {gloss(1, b)}
        </div>
        <div style={{ ...line, opacity: c, transform: `translateX(${(1 - c) * -40}px)`, borderColor: "rgba(47,210,122,0.4)" }}>
          {first} <span style={{ color: C.green }}>{bare} jij</span> {rest}. <span style={{ color: C.green, fontSize: 56 }}>✓</span>
          {gloss(2, c)}
        </div>
      </div>
    </>
  );
}

/** Two things to watch: the stem's own t stays, and only jij/je lose the t. */
function InversionNote({ T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const praten = verb("word.praten");
  const werken = verb("word.werken");
  const cards = [
    { title: T.noteStemT, lines: [[`Jij ${praten.present.jij}.`, `${cap(praten.present.ik)} jij?`]] },
    {
      title: T.noteOthers,
      lines: [
        [`Hij ${werken.present.hij}.`, `${cap(werken.present.hij)} hij?`],
        [`U ${werken.present.jij}.`, `${cap(werken.present.jij)} u?`],
      ],
    },
  ];
  return (
    <>
      <Heading title={T.noteTitle} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
        {cards.map((c, i) => {
          const s = pop(f, fps, 14 + i * S(2.2));
          return (
            <div key={i} style={{ ...card, padding: "34px 44px", opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: C.orange, marginBottom: 20 }}>{c.title}</div>
              {c.lines.map(([from, to], j) => (
                <div key={j} style={{ fontSize: 60, fontWeight: 800, padding: "8px 0" }}>
                  <span style={{ color: C.dim }}>{from}</span> → <span style={{ color: C.green }}>{to}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------- summary, quiz, outro ---------- */

function Summary({ T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Heading title={T.summaryTitle} />
      <div style={{ ...card, padding: "14px 48px", marginTop: -10 }}>
        {T.summary.map(([k, v], i) => {
          const s = pop(f, fps, 16 + i * S(1.1));
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "520px 1fr", alignItems: "baseline", padding: "16px 0", borderTop: i ? "1px solid rgba(255,255,255,0.08)" : "none", opacity: s, transform: `translateX(${(1 - s) * -30}px)` }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: C.green }}>
                <Rich text={k} />
              </div>
              <div style={{ fontSize: 42, fontWeight: 600 }}>
                <Rich text={fill(v)} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function QuizIntro({ T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, fps, 0, 10);
  const b = pop(f, fps, 10);
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", height: "100%" }}>
      <div style={{ fontSize: 180, fontWeight: 800, letterSpacing: -4, ...gradientText, transform: `scale(${0.6 + 0.4 * a})` }}>{T.quizTitle}</div>
      <div style={{ fontSize: 46, color: C.dim, marginTop: 20, opacity: b }}>
        <Rich text={T.quizSub} />
      </div>
    </div>
  );
}

function Question({ q, i, n, tense, T, lang }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = verb(q.verb);
  const answers = quizAnswers(q, tense);
  const pieces = q.sentence.split("___");
  if (pieces.length !== answers.length + 1) throw new Error(`${q.sentence}: ${answers.length} gap(s) expected`);
  const two = answers.length > 1;
  const reveal = pop(f, fps, S(ANSWER_AT), 11);
  const note = pop(f, fps, S(ANSWER_AT) + 10);
  const cardIn = pop(f, fps, 0);
  const gloss = T.gloss[q.sentence];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{ fontSize: 34, fontWeight: 700, color: C.dim, letterSpacing: 2, marginBottom: 26 }}>
        QUIZ {i + 1}/{n}
      </div>
      <div style={{ ...card, width: two ? 1600 : 1300, padding: "54px 40px", transform: `scale(${0.94 + 0.06 * cardIn})` }}>
        <div style={{ fontSize: two ? 76 : 96, fontWeight: 800, lineHeight: 1.3 }}>
          {pieces.map((piece, k) => (
            <span key={k}>
              {piece}
              {k < answers.length && (
                <span style={{ display: "inline-block", minWidth: two ? 180 : 220, padding: "0 18px", margin: "0 6px", borderRadius: 18, borderBottom: reveal > 0.05 ? "none" : `7px solid ${C.orange}`, background: reveal > 0.05 ? "rgba(47,210,122,0.16)" : "transparent", color: C.green }}>
                  <span style={{ display: "inline-block", transform: `scale(${reveal})`, opacity: reveal }}>{answers[k] || " "}</span>
                </span>
              )}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 44, fontWeight: 700, color: C.orange, marginTop: 24 }}>({v.nl})</div>
        {lang === "en" && gloss && <div style={{ fontSize: 36, color: C.dim, marginTop: 14 }}>{gloss}</div>}
      </div>
      <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {f < S(ANSWER_AT) + 6 ? (
          <Ring start={S(0.8)} len={S(ANSWER_AT - 0.8)} />
        ) : (
          <div style={{ fontSize: 52, fontWeight: 800, color: C.green, opacity: note, transform: `translateY(${(1 - note) * 20}px)` }}>✓ <Rich text={T.quizNote[q.note]} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Left half only: the right half is for YouTube's end-screen elements. */
function Outro({ T }) {
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
      <div style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.15, opacity: a, transform: `translateY(${(1 - a) * 20}px)` }}>{T.outroTitle}</div>
      <div style={{ fontSize: 32, fontWeight: 700, whiteSpace: "nowrap", ...gradientText, backgroundImage: `linear-gradient(90deg, ${C.blue}, ${C.green} 60%, ${C.orange})`, opacity: url }}>{T.outroUrl}</div>
      <div style={{ alignSelf: "flex-start", fontSize: 38, fontWeight: 800, color: C.bg, background: `linear-gradient(90deg, ${C.blue}, ${C.green})`, padding: "18px 40px", borderRadius: 999, opacity: cta, transform: `scale(${0.85 + 0.15 * cta})` }}>{T.outroCta}</div>
    </div>
  );
}

/** The YouTube thumbnail (1280×720): the topic big, and the three forms. */
export function LessonThumb({ lesson: id, lang }) {
  const L = LESSON_VIDEOS[id];
  const T = L.text[lang];
  const v = L.tense === "perfect" || L.tense === "past" ? null : verb(L.intro);
  const rows = v && [
    ["ik", v.present.ik],
    ["jij", v.present.jij],
    ["wij", v.present.wij],
  ];
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily, color: C.text }}>
      <Backdrop />
      <AbsoluteFill style={{ padding: "64px 70px", display: "flex", flexDirection: "row", alignItems: "center", gap: 50 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 34 }}>
            <LogoMark size={84} delay={-60} />
            <span style={{ fontSize: 34, fontWeight: 800, padding: "6px 20px", borderRadius: 999, background: C.orange, color: C.bg }}>{L.level}</span>
          </div>
          <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.02 }}>{T.thumb[0]}</div>
          <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.02, ...gradientText }}>{T.thumb[1]}</div>
        </div>
        {!v && L.tense === "past" && <PastThumbCard L={L} />}
        {!v && L.tense === "perfect" && <PerfectThumbCard />}
        {v && <div style={{ ...card, padding: "26px 44px", background: "rgba(255,255,255,0.07)" }}>
          {rows.map(([p, form]) => (
            <div key={p} style={{ fontSize: 84, fontWeight: 800, padding: "6px 0", whiteSpace: "nowrap" }}>
              <span style={{ color: C.dim, fontWeight: 600 }}>{p} </span>
              <Form form={form} stem={v.stem} />
            </div>
          ))}
        </div>}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
