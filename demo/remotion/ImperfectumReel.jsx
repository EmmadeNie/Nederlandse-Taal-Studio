// The ~40 s Reel / YouTube Short of the past tense (imperfectum, regular verbs), with Emma's voice:
// an opening with the title and an example on the first frame (werkte, but belde. Why?), the rule
// ('t kofschip), two verbs, one quiz question and the way to the full lesson on YouTube.
// The look is the lesson's (dark, LessonReel / LessonVideoPast); the content is
// imperfectumReel.json, the timing imperfectumReelTimeline.json (imperfectum/build_track.py),
// every verb form comes from the app's data.
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, C, LogoMark, fontFamily } from "./Demo";
import { KetchupCard, KetchupMini, KetchupWord, KofForm, KofWord, MARKER, Sentence, TOMATO } from "./LessonVideoPerfect";
import { Rich, Ring, card, gradientText, pop } from "./LessonReel";
import { MorphRow, clamp } from "./LessonVideo";
import { KOFSCHIP, kofschip, quizAnswers, verb } from "./lessons";
import CONTENT from "./imperfectumReel.json";
import TIMELINE from "./imperfectumReelTimeline.json";

export const IMPERFECTUM_REEL_FPS = 30;
export const imperfectumReelDuration = () => Math.ceil(TIMELINE.total * IMPERFECTUM_REEL_FPS);

const sec = (s) => Math.round(s * IMPERFECTUM_REEL_FPS);
const FADE = 7;
const RED = "#ff4f4f"; // YouTube
const fillIn = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
const VERBS = CONTENT.scenes.filter((s) => s.kind === "verb");
const kicker = { fontSize: 38, fontWeight: 800, color: C.dim, letterSpacing: 3, textTransform: "uppercase", marginBottom: 40 };
const lift = (p, px = 30) => ({ opacity: p, transform: `translateY(${(1 - p) * px}px)` });

/** A scene's frame: fades in (unless `still`, for the opening) and out, inside the Reels safe area. */
function Frame({ len, still, children }) {
  const f = useCurrentFrame();
  const enter = still ? 1 : interpolate(f, [0, FADE], [0, 1], clamp);
  const leave = interpolate(f, [len - FADE, len], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: Math.min(enter, leave), transform: `translateY(${(1 - enter) * 24}px)` }}>
      <div style={{ position: "absolute", left: 80, right: 80, top: 230, bottom: 400, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>
    </AbsoluteFill>
  );
}

/**
 * The opening (Emma, 28 Nov): 't kofschip, "or for our internationals we suggest:" soft ketchup, complete on frame 0. Emma asks what ketchup has
 * to do with Dutch grammar; on "soft ketchup" the sticker bumps and the highlighter sweeps across it
 * (s.ketchup: seconds after her first sentence starts). With her second sentence the six letters and
 * "Same letters!" come. Then, quickly, the title screen.
 */
function Open({ s, t, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [k0, k1] = (s.ketchup || [0, 1]).map((x) => sec(t.voice[0] + x));
  const mark = interpolate(f, [k0, k1], [0, 1], clamp);
  const bump = Math.sin(interpolate(f, [k0, k0 + 14], [0, 1], clamp) * Math.PI);
  const same = sec(t.voice[1]);
  const letters = KOFSCHIP.filter((l) => l !== "x");
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 70 }}>
        <LogoMark size={96} delay={-60} />
        <span style={{ fontSize: 38, fontWeight: 800, padding: "8px 24px", borderRadius: 999, background: C.orange, color: C.bg }}>{T.level}</span>
      </div>
      <KofWord size={124} />
      <div style={{ fontSize: 50, fontWeight: 700, color: C.dim, lineHeight: 1.3, margin: "34px 0 40px" }}>
        <Rich text={T.openOr} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 40px", borderRadius: 32, background: "rgba(255,90,79,0.12)", border: `4px solid ${TOMATO}`, boxShadow: `0 0 ${30 + 50 * bump}px rgba(255,90,79,${0.3 + 0.3 * bump})`, transform: `rotate(-2deg) scale(${1 + 0.1 * bump})` }}>
        <KetchupWord size={104} mark={mark} />
        <span style={{ fontSize: 92 }}>🍅</span>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 80 }}>
        {letters.map((l, i) => {
          const p = pop(f, fps, same + 6 + i * 4, 11);
          return (
            <div key={l} style={{ width: 118, height: 118, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 66, fontWeight: 800, background: MARKER, color: C.bg, opacity: p, transform: `scale(${0.5 + 0.5 * p})` }}>
              {l}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 54, fontWeight: 800, marginTop: 34, opacity: pop(f, fps, same + 30) }}>
        <Rich text={T.openSame} />
      </div>
    </div>
  );
}

/**
 * The opening: the title and the first example are both there on the first frame (no fade-in, so
 * the feed never shows an empty card). Emma's intro starts at ~0.4 s, subtitled; the second example
 * slides in with her second sentence, then the question "werkte, but belde. Why?".
 */
function Hook({ s, t, T, cover }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = cover ? 1 : pop(f, fps, sec(t.ends[t.ends.length - 1]) + 4, 12);
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 34 }}>
        <LogoMark size={96} delay={-60} />
        <span style={{ fontSize: 38, fontWeight: 800, padding: "8px 24px", borderRadius: 999, background: C.orange, color: C.bg }}>{T.level}</span>
      </div>
      <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -3, lineHeight: 1.05, marginBottom: 56 }}>
        <div>{T.title[0]}</div>
        <div style={{ ...gradientText, paddingBottom: 8 }}>
          <Rich text={T.title[1]} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {s.lines.map((line, i) => {
          // The first example is there from frame 0; the next one comes with Emma's voice.
          const p = cover || i === 0 ? 1 : pop(f, fps, Math.max(0, sec(t.voice[i]) - 6));
          return (
            <div key={i} style={{ ...card, padding: "32px 44px", ...lift(p) }}>
              <div style={{ fontSize: 70, fontWeight: 800, lineHeight: 1.2 }}>
                <Sentence s={line} />
              </div>
              <div style={{ fontSize: 36, color: C.dim, marginTop: 8 }}>{line.en}</div>
            </div>
          );
        })}
      </div>
      {/* Emma's intro isn't on screen (her wish, 25 Nov); after it, the question. */}
      <div style={{ position: "relative", height: 100, marginTop: 50 }}>
        <div style={{ position: "absolute", left: 0, top: 0, fontSize: 66, fontWeight: 800, lineHeight: 1.2, whiteSpace: "nowrap", transform: `scale(${0.85 + 0.15 * q})`, transformOrigin: "left center", opacity: q }}>
          <Rich text={T.hook} />
        </div>
      </div>
    </>
  );
}

/**
 * Step 1, the stem: werken → werk, spelen → spel → speel (+ e), bellen → bell → bel (− l), animated;
 * then each stem's last letter lights up (k, l, l): that's the letter 't kofschip looks at, next.
 */
function Stem({ s, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, fps, 0);
  const last = pop(f, fps, sec(s.lastAt));
  return (
    <>
      <div style={{ ...kicker, ...lift(a) }}><Rich text={T.stemKicker} /></div>
      <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, ...lift(a) }}>
        <Rich text={T.stemTitle} />
      </div>
      <div style={{ fontSize: 46, color: C.dim, marginTop: 14, marginBottom: 50, ...lift(a) }}>
        <Rich text={T.stemSub} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {s.verbs.map((id, i) => (
          <MorphRow key={id} id={id} d={12 + i * sec(s.step)} size={84} cols="330px 80px auto 1fr" label={40} lastAt={sec(s.lastAt) + i * 8} />
        ))}
      </div>
      <div style={{ fontSize: 50, fontWeight: 800, marginTop: 50, color: "#ffd84a", ...lift(last, 16) }}>
        <Rich text={T.stemLast} />
      </div>
    </>
  );
}

/** 't kofschip: the letters light up as Emma says them, then -te / -de. */
function Rule({ t, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const word = pop(f, fps, Math.max(0, sec(t.voice[0]) - 4));
  const letters = KOFSCHIP.filter((l) => l !== "x");
  const [l0, l1] = [sec(t.voice[1]), sec(t.ends[1])];
  // After the letters: the soft ketchup tip (card, highlighter, "same letters"), then -te / -de.
  const k0 = l1 + 6;
  const ketchup = pop(f, fps, k0, 9);
  const mark = interpolate(f, [k0 + 12, k0 + 28], [0, 1], clamp);
  const same = pop(f, fps, k0 + 34);
  const r0 = k0 + sec(2.6);
  const rows = [
    { label: T.ruleIn, end: "-te", from: "werken", form: "word.werken", at: r0 },
    { label: T.ruleOut, end: "-de", from: "bellen", form: "word.bellen", at: r0 + 12 },
  ];
  const sub = pop(f, fps, r0 + 26);
  return (
    <>
      <div style={{ ...kicker, ...lift(word) }}><Rich text={T.ruleKicker} /></div>
      <div style={{ ...lift(word), marginBottom: 36 }}>
        <KofWord size={120} />
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 56 }}>
        {letters.map((l, i) => {
          const p = pop(f, fps, l0 + ((l1 - l0) * i) / letters.length, 11);
          return (
            <div key={l} style={{ width: 128, height: 128, borderRadius: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, fontWeight: 800, background: C.orange, color: C.bg, opacity: p, transform: `scale(${0.5 + 0.5 * p})` }}>
              {l}
            </div>
          );
        })}
      </div>
      {/* Always there (invisible until it bounces in), so nothing jumps when it comes. */}
      <div style={{ marginBottom: 44 }}>
        <KetchupCard p={ketchup} T={T} size={96} small={38} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {rows.map((r) => {
          const p = pop(f, fps, r.at);
          const { raw, last } = kofschip(r.form, "past");
          return (
            <div key={r.end} style={{ ...card, padding: "26px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", ...lift(p) }}>
              <div>
                <div style={{ fontSize: 38, fontWeight: 700, color: C.dim }}>{r.label}</div>
                <div style={{ fontSize: 60, fontWeight: 800, marginTop: 6 }}>
                  {raw.slice(0, -last.length)}
                  <span style={{ color: r.end === "-te" ? C.orange : C.blue }}>{last}</span>
                  <span style={{ color: C.dim, fontWeight: 500 }}> → </span>
                  <KofForm id={r.form} tense="past" />
                </div>
              </div>
              <div style={{ fontSize: 96, fontWeight: 800, color: C.green }}>
                <em>{r.end}</em>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 40, color: C.dim, marginTop: 34, opacity: sub }}>
        💡 <Rich text={T.ruleSub} />
      </div>
    </>
  );
}

/** fietsen: s is in 't kofschip → fietste, and the sentence. */
function Verb({ s, t, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = verb(s.verb);
  const { raw, last, end } = kofschip(s.verb, "past");
  const n = VERBS.indexOf(s) + 1;
  const inn = pop(f, fps, 0);
  const form = pop(f, fps, sec(t.ends[0]) + 3, 12);
  const why = pop(f, fps, sec(t.ends[0]) + 10);
  const look = pop(f, fps, sec(t.ends[0]) + 18, 9);
  const sent = pop(f, fps, Math.max(0, sec(t.voice[1]) - 4));
  const isIn = end === "t";
  // The last letter (without -en) lights up while Emma says the verb, before the form appears.
  const hi = pop(f, fps, sec(t.voice[0]) + 8, 9);
  return (
    <>
      <div style={{ ...kicker, opacity: inn }}>{fillIn(T.verbKicker, { n, total: VERBS.length })}</div>
      <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, ...lift(inn) }}>
        {raw.slice(0, -last.length)}
        <span style={{ display: "inline-block", color: hi > 0.05 ? (isIn ? C.orange : C.blue) : C.text, background: `rgba(${isIn ? "240,140,60" : "79,156,249"},${0.22 * hi})`, borderRadius: 16, padding: "0 6px", margin: "0 -6px", transform: `translateY(${-20 * Math.sin(Math.min(1, hi) * Math.PI)}px) scale(${1 + 0.2 * Math.sin(Math.min(1, hi) * Math.PI)})` }}>{last}</span>
        <span style={{ color: C.dim }}>en</span>
      </div>
      <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, opacity: form, transform: `translateX(${(1 - form) * -40}px)` }}>
        <span style={{ color: C.dim, fontWeight: 500 }}>→ </span>
        <KofForm id={s.verb} tense="past" />
      </div>
      {/* The letter looked up in soft ketchup, then the conclusion. */}
      <div style={{ marginTop: 34, opacity: why }}>
        <KetchupMini letter={last} size={72} p={look} />
      </div>
      <div style={{ marginTop: 22, opacity: why }}>
        <span style={{ display: "inline-block", fontSize: 40, fontWeight: 700, color: C.green, border: `3px solid ${C.green}`, borderRadius: 999, padding: "10px 30px" }}>
          ✓ <Rich text={fillIn(isIn ? T.isIn : T.isOut, { last })} /> → <em>-{end}e</em>
        </span>
      </div>
      <div style={{ ...card, padding: "34px 44px", marginTop: 50, ...lift(sent) }}>
        <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.2 }}>
          <Sentence s={s.s} />
        </div>
        <div style={{ fontSize: 38, color: C.dim, marginTop: 10 }}>{s.s.en}</div>
      </div>
    </>
  );
}

/** Mijn vader ___ elke avond. (koken) A 3-2-1 ring, then kookte. */
function Quiz({ s, t, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = sec(t.reveal);
  const [answer] = quizAnswers({ verb: s.verb, person: s.person }, "past");
  const r = pop(f, fps, reveal, 11);
  const note = pop(f, fps, reveal + 10);
  const cardIn = pop(f, fps, 0);
  const { last } = kofschip(s.verb, "past");
  const [before, after] = s.sentence.split("___");
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{ ...kicker, color: C.orange, fontSize: 56, letterSpacing: 0, textTransform: "none" }}>{T.quizKicker}</div>
      <div style={{ ...card, width: "100%", padding: "60px 40px", transform: `scale(${0.92 + 0.08 * cardIn})` }}>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.3 }}>
          {before}
          <span
            style={{
              display: "inline-block",
              minWidth: 220,
              padding: "0 16px",
              margin: "0 6px",
              borderRadius: 18,
              borderBottom: r > 0.05 ? "none" : `6px solid ${C.orange}`,
              background: r > 0.05 ? "rgba(47,210,122,0.16)" : "transparent",
              color: C.green,
            }}
          >
            <span style={{ display: "inline-block", transform: `scale(${r})`, opacity: r }}>{answer}</span>
          </span>
          {after}
        </div>
        <div style={{ fontSize: 50, fontWeight: 700, color: C.orange, marginTop: 28 }}>({verb(s.verb).nl})</div>
        <div style={{ fontSize: 40, color: C.dim, marginTop: 18, opacity: r }}>{s.en}</div>
      </div>
      <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {f < reveal + 6 ? (
          <Ring start={sec(0.35)} len={reveal - sec(0.35)} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, ...lift(note, 20) }}>
            <KetchupMini letter={last} size={64} p={pop(f, fps, reveal + 16, 9)} />
            <div style={{ fontSize: 52, fontWeight: 800, color: C.green }}>
              ✓ <Rich text={`${fillIn(T.isIn, { last })}: *-te*`} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Cta({ T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, fps, 0);
  const colors = [RED, C.green];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <LogoMark size={190} delay={-60} />
      <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -3, margin: "50px 0 50px", ...lift(a) }}>{T.ctaTitle}</div>
      {T.ctaRows.map(([label, link], i) => {
        const p = pop(f, fps, 10 + i * 8);
        return (
          <div key={link} style={{ ...card, width: "100%", padding: "30px 40px", marginTop: i ? 24 : 0, ...lift(p) }}>
            <div style={{ fontSize: 40, fontWeight: 700 }}>{i === 0 ? "▶️ " : "📱 "}{label}</div>
            <div style={{ fontSize: 52, fontWeight: 800, color: colors[i], marginTop: 6 }}>{link}</div>
          </div>
        );
      })}
    </div>
  );
}

const SCENES = { open: Open, hook: Hook, stem: Stem, rule: Rule, verb: Verb, quiz: Quiz, cta: Cta };

/** The Reel (9:16); cover renders the title screen complete (the cover image; the video itself opens on 't kofschip = soft ketchup). Without a recording (timeline "voice": false) it is silent, for previews. */
export function ImperfectumReel({ lang = "en", voice = "imperfectum_reel_voice.wav", cover = false }) {
  const T = CONTENT.text[lang];
  const timing = Object.fromEntries(TIMELINE.scenes.map((t) => [t.id, t]));
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily, color: C.text }}>
      <Backdrop />
      {TIMELINE.voice && <Audio src={staticFile(voice)} />}
      {cover && (
        <Frame len={9999} still>
          <Hook s={CONTENT.scenes.find((x) => x.kind === "hook")} t={timing.hook} T={T} cover />
        </Frame>
      )}
      {!cover && CONTENT.scenes.map((s) => {
        const t = timing[s.id];
        const Scene = SCENES[s.kind];
        const len = sec(t.start + t.dur) - sec(t.start);
        return (
          <Sequence key={s.id} from={sec(t.start)} durationInFrames={len}>
            <Frame len={len} still={s.kind === "open"}>
              <Scene s={s} t={t} T={T} cover={cover} />
            </Frame>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
