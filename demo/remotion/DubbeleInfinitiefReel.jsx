// The ~45 s Reel / YouTube Short of the double infinitive (dubbele infinitief, B1), for people who
// already speak Dutch fairly well: the opening is the classic slip "ik heb gemoeten wachten" with
// Emma's English intro, then the rule, four verb groups, a verb stack for fun, one quiz question and
// the call to action. The look is the lesson reels' (dark, like ImperfectumReel); the content is
// dubbeleInfinitiefReel.json, the timing dubbeleInfinitiefReelTimeline.json (dubbele-infinitief/build_track.py).
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, C, LogoMark, fontFamily } from "./Demo";
import { Rich, Ring, card, gradientText, pop } from "./LessonReel";
import { Strike, clamp } from "./LessonVideo";
import CONTENT from "./dubbeleInfinitiefReel.json";
import TIMELINE from "./dubbeleInfinitiefReelTimeline.json";

export const DI_REEL_FPS = 30;
export const diReelDuration = () => Math.ceil(TIMELINE.total * DI_REEL_FPS);

const sec = (s) => Math.round(s * DI_REEL_FPS);
const FADE = 7;
const RED = "#ff5a5a";
const kicker = { fontSize: 38, fontWeight: 800, color: C.dim, letterSpacing: 3, textTransform: "uppercase", marginBottom: 40 };
const lift = (p, px = 30) => ({ opacity: p, transform: `translateY(${(1 - p) * px}px)` });
const pill = (color, size = 32) => ({ display: "inline-block", fontSize: size, fontWeight: 700, color, border: `3px solid ${color}`, borderRadius: 999, padding: "6px 22px", whiteSpace: "nowrap" });

/** Sentence markup: [x] the conjugated verb (orange), {x} an infinitive (green), ~x~ a wrong form (struck). */
const tokens = (s) => s.split(/(\[[^\]]+\]|\{[^}]+\}|~[^~]+~)/).filter(Boolean);
const infinitives = (s) => tokens(s).filter((t) => t.startsWith("{")).length;
function Sentence({ s, strike = 1 }) {
  // Consecutive infinitives stay together on one line ("moeten kunnen zien").
  const parts = [];
  for (const t of tokens(s)) {
    const prev = parts[parts.length - 1];
    if (Array.isArray(prev) && (t.startsWith("{") || t === " ")) prev.push(t);
    else parts.push(t.startsWith("{") ? [t] : t);
  }
  return parts.map((p, i) =>
    Array.isArray(p) ? (
      <span key={i} style={{ whiteSpace: "nowrap", color: C.green }}>
        {p.map((t) => (t.startsWith("{") ? t.slice(1, -1) : t)).join("")}
      </span>
    ) : (
      <Token key={i} t={p} strike={strike} />
    ),
  );
}
function Token({ t, strike }) {
  const inner = t.slice(1, -1);
  if (t.startsWith("[")) return <span style={{ color: C.orange }}>{inner}</span>;
  if (t.startsWith("~"))
    return (
      <span style={{ position: "relative", color: RED }}>
        {inner}
        <Strike p={strike} color={RED} />
      </span>
    );
  return t;
}

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
 * The opening, complete on frame 0: the title and "Ik heb gemoeten wachten." ❌. Emma's intro starts at
 * ~0.4 s (subtitled); on her third sentence the ge- drops off: "Ik heb moeten wachten." ✓, then the hook.
 */
function Hook({ s, t, T, cover }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fixAt = sec(t.voice[2]) + 4;
  const fall = cover ? 0 : interpolate(f, [fixAt, fixAt + 16], [0, 1], clamp);
  const fixed = cover ? 0 : pop(f, fps, fixAt + 12, 12);
  const gloss = cover ? 0 : pop(f, fps, fixAt + 20);
  const q = cover ? 1 : pop(f, fps, sec(t.ends[t.ends.length - 1]) + 4, 12);
  const word = "gemoeten";
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 34 }}>
        <LogoMark size={96} delay={-60} />
        <span style={{ fontSize: 38, fontWeight: 800, padding: "8px 24px", borderRadius: 999, background: C.orange, color: C.bg }}>{T.level}</span>
      </div>
      <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: -3, lineHeight: 1.05, marginBottom: 56 }}>
        <div>{T.title[0]}</div>
        <div style={{ ...gradientText, paddingBottom: 8 }}>
          <Rich text={T.title[1]} />
        </div>
      </div>
      <div style={{ ...card, padding: "36px 44px", position: "relative", borderColor: fixed > 0.5 ? "rgba(47,210,122,0.5)" : "rgba(255,90,90,0.5)" }}>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.2, whiteSpace: "nowrap" }}>
          Ik <span style={{ color: C.orange }}>heb</span>{" "}
          <span style={{ color: fixed > 0.5 ? C.green : RED }}>
            {/* ge- drops off the word, and the word closes up behind it */}
            <span style={{ display: "inline-block", width: fall > 0 ? `${1.2 * (1 - fall)}em` : "auto", whiteSpace: "nowrap", overflow: "visible" }}>
              <span style={{ display: "inline-block", opacity: 1 - fall, transform: `translateY(${fall * 1.6}em) rotate(${fall * 50}deg)` }}>{word.slice(0, 2)}</span>
            </span>
            {word.slice(2)}
          </span>{" "}
          <span style={{ color: C.green }}>wachten</span>.
        </div>
        <div style={{ fontSize: 36, color: C.dim, marginTop: 8, opacity: gloss }}>{s.en}</div>
        <div style={{ position: "absolute", right: 34, top: -34, width: 84, height: 84, borderRadius: 42, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, fontWeight: 800, color: C.bg, background: fixed > 0.5 ? C.green : RED, transform: `scale(${fixed > 0.5 ? 0.6 + 0.4 * fixed : 1})` }}>
          {fixed > 0.5 ? "✓" : "✗"}
        </div>
      </div>
      {/* While Emma talks, her words as subtitles (Reels are often watched muted); then the hook line. */}
      <div style={{ position: "relative", height: 190, marginTop: 50 }}>
        {cover ? (
          <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.25 }}>
            <Rich text={T.coverLine} />
          </div>
        ) : (
          T.say.map((line, i) => {
            const last = i === T.say.length - 1;
            const on = pop(f, fps, sec(t.voice[i]) - 2, 20) * (1 - pop(f, fps, sec(t.ends[i]) + (last ? 0 : 6), 20));
            return (
              <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 0, display: "flex", opacity: on }}>
                <span style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.3, padding: "16px 30px", borderRadius: 24, background: "rgba(255,255,255,0.10)", color: C.text }}>
                  <Rich text={line} />
                </span>
              </div>
            );
          })
        )}
        {!cover && (
          <div style={{ position: "absolute", left: 0, top: 0, fontSize: 66, fontWeight: 800, lineHeight: 1.2, whiteSpace: "nowrap", transform: `scale(${0.85 + 0.15 * q})`, transformOrigin: "left center", opacity: q }}>
            <Rich text={T.hook} />
          </div>
        )}
      </div>
    </>
  );
}

/** moeten + another verb → in the perfect it stays an infinitive; the formula, an example, and the exception. */
function Rule({ s, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, fps, 0);
  const b = pop(f, fps, 10);
  const chips = T.formula.map((_, i) => pop(f, fps, 26 + i * 6, 12));
  const ex = pop(f, fps, sec(2.6));
  const tip = pop(f, fps, sec(4.6));
  const colors = [C.orange, C.dim, C.green, C.green];
  return (
    <>
      <div style={{ ...kicker, ...lift(a) }}>{T.ruleKicker}</div>
      <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, whiteSpace: "nowrap", ...lift(a) }}>
        <Rich text={T.ruleLine} />
      </div>
      <div style={{ fontSize: 46, fontWeight: 600, color: C.dim, marginTop: 18, marginBottom: 50, ...lift(b) }}>
        <Rich text={T.ruleSub} />
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
        {T.formula.map((x, i) =>
          x === "…" ? (
            <span key={i} style={{ fontSize: 44, fontWeight: 800, color: C.dim, alignSelf: "center", opacity: chips[i] }}>…</span>
          ) : (
            <span key={i} style={{ ...pill(colors[i], 34), opacity: chips[i], transform: `scale(${0.6 + 0.4 * chips[i]})` }}>
              <Rich text={x} />
            </span>
          ),
        )}
      </div>
      <div style={{ ...card, padding: "32px 42px", ...lift(ex) }}>
        <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.2 }}>
          <Sentence s={s.example} />
        </div>
        <div style={{ fontSize: 36, color: C.dim, marginTop: 8 }}>{s.en}</div>
      </div>
      <div style={{ marginTop: 44, ...lift(tip) }}>
        <div style={{ fontSize: 40, fontWeight: 600, color: C.dim }}>
          <Rich text={T.alone} />
        </div>
        <div style={{ fontSize: 54, fontWeight: 800, marginTop: 10 }}>
          <Sentence s={s.alone} />
        </div>
        <div style={{ fontSize: 34, color: C.dim, marginTop: 6 }}>{s.aloneEn}</div>
      </div>
    </>
  );
}

/** Not just moeten: four groups of verbs, one example each. */
function Groups({ s, t, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, fps, 0);
  const step = (sec(t.dur) - sec(2.6)) / s.rows.length;
  return (
    <>
      <div style={{ ...kicker, ...lift(a) }}>
        <Rich text={T.groupsKicker} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {s.rows.map((r, i) => {
          const p = pop(f, fps, 8 + i * step);
          const n = r.note ? pop(f, fps, 8 + i * step + 14, 12) : 0;
          return (
            <div key={i} style={{ ...card, padding: "24px 38px", ...lift(p) }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: C.blue }}>
                  <Rich text={r.label} />
                </div>
                {r.note && (
                  <span style={{ ...pill(C.orange, 28), padding: "2px 18px", opacity: n, transform: `scale(${0.6 + 0.4 * n})` }}>
                    <Rich text={r.note} />
                  </span>
                )}
              </div>
              <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.25, marginTop: 4, whiteSpace: "nowrap" }}>
                <Sentence s={r.s} />
              </div>
              <div style={{ fontSize: 32, color: C.dim, marginTop: 4 }}>{r.en}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** How far can Dutch go? The verb pile grows row by row, with the number of infinitives on the right. */
function Stack({ s, t, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = pop(f, fps, 0);
  const step = (sec(t.dur) - sec(2.8)) / s.rows.length;
  const end = pop(f, fps, 8 + s.rows.length * step + 4);
  return (
    <>
      <div style={{ ...kicker, color: C.orange, fontSize: 52, letterSpacing: 0, textTransform: "none", ...lift(a) }}>{T.stackKicker}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {s.rows.map((r, i) => {
          const p = pop(f, fps, 8 + i * step);
          const last = i === s.rows.length - 1;
          const n = infinitives(r.s);
          // the last row shakes a little when it lands
          const shake = last ? Math.sin(Math.max(0, f - (8 + i * step)) * 1.3) * 8 * Math.max(0, 1 - (f - (8 + i * step)) / 24) : 0;
          return (
            <div key={i} style={{ ...card, padding: "24px 34px", display: "flex", alignItems: "center", gap: 24, ...(last ? { borderColor: "rgba(240,140,60,0.6)" } : {}), ...lift(p), transform: `translateY(${(1 - p) * 30}px) rotate(${shake * 0.3}deg)` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: last ? 48 : 54, fontWeight: 800, lineHeight: 1.2 }}>
                  <Sentence s={r.s} />
                </div>
                <div style={{ fontSize: 32, color: C.dim, marginTop: 6 }}>{r.en}</div>
              </div>
              <div style={{ flex: "none", width: 96, height: 96, borderRadius: 48, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, fontWeight: 800, background: last ? C.orange : "rgba(47,210,122,0.16)", color: last ? C.bg : C.green }}>{n}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 44, fontWeight: 700, marginTop: 40, ...lift(end) }}>
        <Rich text={T.stackEnd} />
      </div>
    </>
  );
}

/** Ik heb hem nooit ___ lachen. (zien) A 3-2-1 ring, then zien, not gezien. */
function Quiz({ s, t, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = sec(t.reveal);
  const r = pop(f, fps, reveal, 11);
  const note = pop(f, fps, reveal + 10);
  const cardIn = pop(f, fps, 0);
  const [before, after] = s.sentence.split("___");
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{ ...kicker, color: C.orange, fontSize: 56, letterSpacing: 0, textTransform: "none" }}>{T.quizKicker}</div>
      <div style={{ ...card, width: "100%", padding: "60px 40px", transform: `scale(${0.92 + 0.08 * cardIn})` }}>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.3 }}>
          {before}
          <span style={{ display: "inline-block", minWidth: 200, padding: "0 16px", margin: "0 6px", borderRadius: 18, borderBottom: r > 0.05 ? "none" : `6px solid ${C.orange}`, background: r > 0.05 ? "rgba(47,210,122,0.16)" : "transparent", color: C.green }}>
            <span style={{ display: "inline-block", transform: `scale(${r})`, opacity: r }}>{s.answer}</span>
          </span>
          {after}
        </div>
        <div style={{ fontSize: 50, fontWeight: 700, color: C.orange, marginTop: 28 }}>({s.verb})</div>
        <div style={{ fontSize: 40, color: C.dim, marginTop: 18, opacity: r }}>{s.en}</div>
      </div>
      <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {f < reveal + 6 ? (
          <Ring start={sec(0.35)} len={reveal - sec(0.35)} />
        ) : (
          <div style={{ fontSize: 60, fontWeight: 800, color: C.green, ...lift(note, 20) }}>
            <Rich text={T.quizNote} />
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
  const colors = [C.green, C.blue];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <LogoMark size={190} delay={-60} />
      <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -3, margin: "50px 0 50px", ...lift(a) }}>{T.ctaTitle}</div>
      {T.ctaRows.map(([label, link], i) => {
        const p = pop(f, fps, 10 + i * 8);
        return (
          <div key={link} style={{ ...card, width: "100%", padding: "30px 40px", marginTop: i ? 24 : 0, ...lift(p) }}>
            <div style={{ fontSize: 40, fontWeight: 700 }}>{i === 0 ? "📖 " : "🔔 "}{label}</div>
            <div style={{ fontSize: 56, fontWeight: 800, color: colors[i], marginTop: 6 }}>{link}</div>
          </div>
        );
      })}
    </div>
  );
}

const SCENES = { hook: Hook, rule: Rule, groups: Groups, stack: Stack, quiz: Quiz, cta: Cta };

/** The Reel (9:16); cover renders the opening as the cover image. The audio track is voice + music (or music only before the recording). */
export function DubbeleInfinitiefReel({ lang = "en", audio = "dubbele_infinitief_reel_audio.wav", cover = false }) {
  const T = CONTENT.text[lang];
  const timing = Object.fromEntries(TIMELINE.scenes.map((t) => [t.id, t]));
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily, color: C.text }}>
      <Backdrop />
      {!cover && <Audio src={staticFile(audio)} />}
      {CONTENT.scenes.map((s) => {
        const t = timing[s.id];
        const Scene = SCENES[s.kind];
        const len = sec(t.start + t.dur) - sec(t.start);
        return (
          <Sequence key={s.id} from={sec(t.start)} durationInFrames={len}>
            <Frame len={len} still={s.kind === "hook"}>
              <Scene s={s} t={t} T={T} cover={cover} />
            </Frame>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
