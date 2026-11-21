// The scenes of the perfect-tense lesson video (LESSON_VIDEOS.perfectum in
// lessons.js): the form, regular participles ('t kofschip), irregular ones,
// hebben or zijn, and word order. Every verb form comes from the app's data;
// timings shared with the captions live in lessonVideoScenes.js.
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./Demo";
import { auxForm, auxOf, cap, enShort, fill, kofschip, participleParts, pastParts, perfectParts, verb } from "./lessons";
import { FallingT, card, gradientText, pop } from "./LessonReel";
import { Heading, Strike, clamp } from "./LessonVideo";
import { IRR_STEP, KOF_STEP, S, TRAP_WHY_AT, WHAT_NOTE_AT, WHAT_STEP, ZIJN_STEP, kofWhyAt, zijnTipAt } from "./lessonVideoScenes";

const pill = (color) => ({ display: "inline-block", fontSize: 26, fontWeight: 700, color, border: `2px solid ${color}`, borderRadius: 999, padding: "4px 18px", whiteSpace: "nowrap" });
const gloss = { fontSize: 30, color: C.dim, fontWeight: 500, marginTop: 6 };

/** A sentence in the perfect: hebben/zijn in orange, the participle in green. */
export function Sentence({ s }) {
  return perfectParts(s).map((p, i) =>
    p.text ? (
      <span key={i}>{p.text}</span>
    ) : p.past ? (
      <span key={i}>
        {p.past.startsWith(p.stem) ? p.stem : ""}
        <span style={{ color: C.green }}>{p.past.startsWith(p.stem) ? p.past.slice(p.stem.length) : p.past}</span>
      </span>
    ) : (
      <span key={i} style={{ color: p.aux ? C.orange : C.green }}>
        {p.aux ?? p.part}
      </span>
    ),
  );
}

/** A participle with its pieces coloured: ge- dim, the ending green. Irregular ones all green. */
export function Participle({ id, regular = true }) {
  if (!regular) return <span style={{ color: C.green }}>{verb(id).participle}</span>;
  const { pre, stem, end } = participleParts(id);
  return (
    <>
      <span style={{ color: C.blue }}>{pre}</span>
      {stem}
      <span style={{ color: C.green }}>{end}</span>
    </>
  );
}

/** The form 't kofschip decides: the participle (gewerkt) or the past tense (werkte), its ending green. */
export function KofForm({ id, tense = "perfect" }) {
  if (tense !== "past") return <Participle id={id} />;
  const { stem, end } = pastParts(id);
  return (
    <>
      {stem}
      <span style={{ color: C.green }}>{end}</span>
    </>
  );
}
/** The ending 't kofschip gives: -t / -d (participle) or -te / -de (past). */
export const kofEnding = (end, tense) => (tense === "past" ? `-${end}e` : `-${end}`);

/** "'t kofschip" with its consonants lit. */
export function KofWord({ size = 64 }) {
  return (
    <span style={{ fontSize: size, fontWeight: 800, letterSpacing: 1 }}>
      {[..."'t kofschip"].map((ch, i) => (
        <span key={i} style={{ color: "tkfschp".includes(ch) ? C.orange : C.dim }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

/**
 * An English sentence with its {marked} words coloured like the Dutch line:
 * with two marks hebben/zijn (orange) and the participle (green), with one just green.
 */
export function English({ text }) {
  const parts = text.split(/(\{[^}]+\})/).filter(Boolean);
  const marks = parts.filter((p) => p.startsWith("{")).length;
  let k = 0;
  return parts.map((p, i) => {
    if (!p.startsWith("{")) return <span key={i}>{p}</span>;
    const color = marks > 1 && k++ === 0 ? C.orange : C.green;
    return (
      <span key={i} style={{ color }}>
        {p.slice(1, -1)}
      </span>
    );
  });
}

/* ---------- intro: what it is ---------- */

/** Ik heb taart gegeten = I have eaten cake; and with gisteren, where English says "I worked". */
export function PWhat({ L, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const note = pop(f, fps, WHAT_NOTE_AT);
  const tag = { fontSize: 24, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: C.dim, width: 200, flexShrink: 0 };
  return (
    <>
      <Heading title={T.whatTitle} sub={T.whatSub} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {L.what.map((s, i) => {
          const d = 16 + i * WHAT_STEP;
          const nl = pop(f, fps, d);
          const en = pop(f, fps, d + S(1.6));
          return (
            <div key={i} style={{ ...card, padding: "22px 44px", opacity: nl, transform: `translateX(${(1 - nl) * -40}px)` }}>
              <div style={{ display: "flex", alignItems: "baseline", fontSize: 68, fontWeight: 800 }}>
                <span style={tag}>{T.whatLabels[0]}</span>
                <span>
                  <Sentence s={s} />
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", fontSize: 50, fontWeight: 700, marginTop: 6, opacity: en, transform: `translateY(${(1 - en) * 12}px)` }}>
                <span style={tag}>{T.whatLabels[1]}</span>
                <span style={{ color: C.dim }}>
                  <English text={s.en} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 32, fontSize: 34, color: C.dim, lineHeight: 1.4, opacity: note, transform: `translateY(${(1 - note) * 16}px)` }}>💡 {fill(T.whatNote)}</div>
    </>
  );
}

/* ---------- 1. the form ---------- */

/** Ik werk. → Ik heb gewerkt, with what heb and gewerkt are. */
export function PForm({ L, T, lang }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = L.intro;
  const v = verb(s.verb);
  const parts = perfectParts(s);
  const a = pop(f, fps, 14);
  const b = pop(f, fps, S(2.2));
  const lab = pop(f, fps, S(4.4));
  const rule = pop(f, fps, S(7));
  const en = (i, o) => lang === "en" && T.formGloss[i] && <div style={{ ...gloss, opacity: o }}>{T.formGloss[i]}</div>;
  const word = (text, color, label) => (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", verticalAlign: "top" }}>
      <span style={{ color }}>{text}</span>
      <span style={{ ...pill(color), marginTop: 10, opacity: lab, transform: `scale(${0.8 + 0.2 * lab})` }}>{label}</span>
    </span>
  );
  return (
    <>
      <Heading title={T.formTitle} sub={`${v.nl} · ${enShort(v.en)}`} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.35fr", gap: 36, alignItems: "stretch" }}>
        <div style={{ ...card, padding: "30px 44px", opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.dim, letterSpacing: 1.5, textTransform: "uppercase" }}>{T.now}</div>
          <div style={{ fontSize: 80, fontWeight: 800, marginTop: 10 }}>{`${s.text.split(" ")[0]} ${v.present[s.person]}.`}</div>
          {en(0, a)}
        </div>
        <div style={{ ...card, padding: "30px 44px", opacity: b, transform: `translateY(${(1 - b) * 30}px)`, borderColor: "rgba(47,210,122,0.4)" }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.dim, letterSpacing: 1.5, textTransform: "uppercase" }}>{T.past}</div>
          <div style={{ fontSize: 80, fontWeight: 800, marginTop: 10, whiteSpace: "pre" }}>
            {parts.map((p, i) => (p.text ? <span key={i}>{p.text}</span> : <span key={i}>{word(p.aux ?? p.part, p.aux ? C.orange : C.green, T.formLabels[p.aux ? 0 : 1])}</span>))}
          </div>
          {en(1, b)}
        </div>
      </div>
      <div style={{ marginTop: 44, fontSize: 40, fontWeight: 700, textAlign: "center", padding: "24px 30px", borderRadius: 24, background: "rgba(79,156,249,0.12)", border: `1px solid rgba(79,156,249,0.35)`, whiteSpace: "pre", opacity: rule, transform: `translateY(${(1 - rule) * 20}px)` }}>
        {T.rule}
      </div>
    </>
  );
}

/** ik heb gewerkt / ik ben gegaan … for every person: only hebben/zijn changes. */
export function PAux({ L, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cols = ["hebben", "zijn"].map((aux) => ({ aux, id: L.auxTable[aux] }));
  const head = pop(f, fps, 14);
  return (
    <>
      <Heading title={T.auxTitle} sub={T.auxSub} />
      <div style={{ ...card, padding: "18px 48px 8px", marginTop: -10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr 1fr", paddingBottom: 8, opacity: head }}>
          <span />
          {cols.map((c) => (
            <span key={c.aux} style={{ fontSize: 34, fontWeight: 800, color: C.orange }}>
              {c.aux} <span style={{ color: C.dim, fontWeight: 500, fontSize: 28 }}>· {verb(c.id).nl}</span>
            </span>
          ))}
        </div>
        {["ik", "jij", "hij", "wij"].map((p, i) => {
          const s = pop(f, fps, 24 + i * S(1.1));
          return (
            <div key={p} style={{ display: "grid", gridTemplateColumns: "340px 1fr 1fr", alignItems: "center", padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.08)", opacity: s, transform: `translateY(${(1 - s) * 20}px)` }}>
              <span style={{ fontSize: 30, color: C.dim, fontWeight: 500 }}>{T.persons[p]}</span>
              {cols.map((c) => (
                <span key={c.aux} style={{ fontSize: 50, fontWeight: 800, whiteSpace: "nowrap" }}>
                  <Sentence s={{ verb: c.id, person: p, aux: c.aux, text: `${p} [aux] [part]` }} />
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------- 2. regular ---------- */

/** werken → ge + werk + t = gewerkt, piece by piece. */
export function PFormula({ L, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Heading title={T.formulaTitle} sub={T.formulaSub} />
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        {L.formula.map((id, r) => {
          const v = verb(id);
          const { pre, stem, end } = participleParts(id);
          const d = 16 + r * S(3.4);
          const inn = pop(f, fps, d);
          const tiles = [
            [pre, C.blue],
            [stem, C.text],
            [end, C.green],
          ];
          const eq = pop(f, fps, d + 3 * 12 + 10);
          return (
            <div key={id} style={{ ...card, display: "flex", alignItems: "center", gap: 26, padding: "26px 44px", fontSize: 72, fontWeight: 800, opacity: inn, transform: `translateX(${(1 - inn) * -50}px)` }}>
              <span style={{ color: C.orange, width: 300 }}>{v.nl}</span>
              <span style={{ color: C.dim, fontWeight: 500 }}>→</span>
              {tiles.map(([t, color], k) => {
                const s = pop(f, fps, d + 10 + k * 12);
                return (
                  <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 26 }}>
                    {k > 0 && <span style={{ color: C.dim, fontWeight: 500, opacity: s }}>+</span>}
                    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", opacity: s, transform: `scale(${0.7 + 0.3 * s})` }}>
                      <span style={{ color, padding: "0 22px", borderRadius: 18, background: "rgba(255,255,255,0.06)" }}>{t}</span>
                      <span style={{ fontSize: 26, color: C.dim, fontWeight: 600, marginTop: 6 }}>{T.formulaLabels[k]}</span>
                    </span>
                  </span>
                );
              })}
              <span style={{ color: C.dim, fontWeight: 500, opacity: eq }}>=</span>
              <span style={{ opacity: eq, transform: `scale(${0.7 + 0.3 * eq})`, display: "inline-block" }}>
                <Participle id={id} />
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** One verb's way to t or d: werk|en → k → gewerkt. */
function KofRow({ id, d, tense }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { raw, last, end } = kofschip(id, tense);
  const inn = pop(f, fps, d);
  const strike = interpolate(f, [d + 10, d + 18], [0, 1], clamp);
  const letter = pop(f, fps, d + 22, 12);
  const out = pop(f, fps, d + 38);
  const isT = end === "t";
  return (
    <div style={{ ...card, display: "grid", gridTemplateColumns: "360px 90px 150px 90px 1fr", alignItems: "center", padding: "18px 40px", fontSize: 68, fontWeight: 800, opacity: inn, transform: `translateX(${(1 - inn) * -50}px)` }}>
      <span>
        {raw}
        <span style={{ position: "relative", color: C.orange, opacity: 1 - strike * 0.6 }}>
          en
          <Strike p={strike} />
        </span>
      </span>
      <span style={{ color: C.dim, fontWeight: 500, opacity: letter }}>→</span>
      <span style={{ justifySelf: "center", width: 112, height: 112, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: isT ? "rgba(240,140,60,0.18)" : "rgba(255,255,255,0.06)", border: `3px solid ${isT ? C.orange : "rgba(255,255,255,0.25)"}`, color: isT ? C.orange : C.text, opacity: letter, transform: `scale(${0.6 + 0.4 * letter})` }}>
        {last}
      </span>
      <span style={{ color: C.dim, fontWeight: 500, opacity: out }}>→</span>
      <span style={{ opacity: out, transform: `scale(${0.75 + 0.25 * out})`, transformOrigin: "left center", display: "inline-block" }}>
        <KofForm id={id} tense={tense} />
        <span style={{ fontSize: 50, color: C.green, marginLeft: 22 }}>{kofEnding(end, tense)} ✓</span>
      </span>
    </div>
  );
}

export function PKofschip({ g, T, tense }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = T.kofschip[g.key];
  const word = pop(f, fps, 12);
  const why = pop(f, fps, kofWhyAt(g));
  return (
    <>
      <Heading title={t.title} sub={t.sub} />
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {g.verbs.map((id, i) => (
          <KofRow key={id} id={id} d={24 + i * KOF_STEP} tense={tense} />
        ))}
      </div>
      <div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 30, opacity: Math.min(word, 0.35 + 0.65 * why) }}>
        <KofWord size={56} />
        <span style={{ fontSize: 36, color: C.dim, opacity: why }}>{T.kofWhy}</span>
      </div>
    </>
  );
}

/** reizen: the stem has an s, but the verb has a z. Look at reiz, not reis: -d. */
export function PTrap({ L, T, tense }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const id = L.trap;
  const v = verb(id);
  const { raw, last, end } = kofschip(id, tense);
  // What you'd write if you looked at the stem (reis: s → t): gereist / reiste.
  const wrong = tense === "past" ? `${v.stem}te` : `${participleParts(id).pre}${v.stem}t`;
  const sLast = v.stem.slice(-1);
  const a = pop(f, fps, 16);
  const wrongStrike = interpolate(f, [S(2.6), S(3.1)], [0, 1], clamp);
  const b = pop(f, fps, S(3.6));
  const ok = pop(f, fps, S(5));
  const why = pop(f, fps, TRAP_WHY_AT);
  const row = { ...card, display: "grid", gridTemplateColumns: "330px 360px 80px 1fr", alignItems: "center", padding: "20px 40px", fontSize: 68, fontWeight: 800 };
  const label = { fontSize: 28, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1.5 };
  return (
    <>
      <Heading title={T.trapTitle} sub={T.trapSub} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ ...row, opacity: a * (1 - 0.45 * wrongStrike) }}>
          <span style={label}>✗ {T.trapLabels[0]}</span>
          <span>
            {v.stem.slice(0, -1)}
            <span style={{ color: C.orange }}>{sLast}</span>
          </span>
          <span style={{ color: C.dim, fontWeight: 500 }}>→</span>
          <span style={{ position: "relative", justifySelf: "start", color: C.orange }}>
            {wrong}
            <Strike p={wrongStrike} />
          </span>
        </div>
        <div style={{ ...row, opacity: b, transform: `translateX(${(1 - b) * -40}px)`, borderColor: "rgba(47,210,122,0.4)" }}>
          <span style={label}>✓ {T.trapLabels[1]}</span>
          <span>
            {raw.slice(0, -last.length)}
            <span style={{ color: C.green }}>{last}</span>
            <span style={{ color: C.dim }}>en</span>
          </span>
          <span style={{ color: C.dim, fontWeight: 500 }}>→</span>
          <span style={{ opacity: ok }}>
            <KofForm id={id} tense={tense} />
            <span style={{ fontSize: 50, color: C.green, marginLeft: 22 }}>{kofEnding(end, tense)} ✓</span>
          </span>
        </div>
      </div>
      <div style={{ marginTop: 36, fontSize: 36, color: C.dim, lineHeight: 1.4, opacity: why, transform: `translateY(${(1 - why) * 16}px)` }}>💡 {fill(T.trapWhy)}</div>
    </>
  );
}

/** Two things to watch: no double t/d at the end, and no ge- after be-/ver-. */
export function PNotes({ L, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cards = [
    { title: T.noteDouble, ids: L.notes.double, kind: "double" },
    { title: T.noteNoGe, ids: L.notes.noGe, kind: "noGe" },
  ];
  return (
    <>
      <Heading title={T.noteTitle} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
        {cards.map((c, i) => {
          const d = 14 + i * S(3.6);
          const s = pop(f, fps, d);
          return (
            <div key={c.kind} style={{ ...card, padding: "34px 44px", opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: C.orange, marginBottom: 20, lineHeight: 1.25 }}>{c.title}</div>
              {c.ids.map((id, j) => {
                const v = verb(id);
                const { pre, stem, end } = participleParts(id);
                // FallingT drops a t: the double-letter card needs stems ending in t.
                if (c.kind === "double" && kofschip(id).end !== "t") throw new Error(`${id}: not a t verb`);
                const at = d + S(1) + j * S(1);
                const fall = interpolate(f, [at, at + 20], [0, 1], clamp);
                const strike = interpolate(f, [at, at + 10], [0, 1], clamp);
                return (
                  <div key={id} style={{ fontSize: 56, fontWeight: 800, padding: "10px 0", whiteSpace: "nowrap" }}>
                    <span style={{ color: C.dim, fontSize: 40 }}>{v.nl} → </span>
                    {c.kind === "double" ? (
                      <>
                        <span style={{ color: C.blue }}>{pre}</span>
                        {stem}
                        <span style={{ color: C.green }}>{end}</span>
                        {/* the t or d that 't kofschip would add: it isn't written twice */}
                        <FallingT fall={fall} />
                      </>
                    ) : (
                      <>
                        <span style={{ position: "relative", color: C.orange, opacity: 1 - strike * 0.6 }}>
                          ge
                          <Strike p={strike} />
                        </span>
                        {pre}
                        {stem}
                        <span style={{ color: C.green }}>{end}</span>
                      </>
                    )}
                    <span style={{ fontSize: 44, color: C.green, marginLeft: 18, opacity: fall }}>✓</span>
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

/* ---------- 3. irregular ---------- */

export function PIrregular({ g, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = T.irregular[g.key];
  return (
    <>
      <Heading title={t.title} sub={t.sub} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
        {g.verbs.map((id, i) => {
          const v = verb(id);
          const s = pop(f, fps, 16 + i * IRR_STEP);
          const p = pop(f, fps, 16 + i * IRR_STEP + 14);
          return (
            <div key={id} style={{ ...card, padding: "24px 34px", opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: C.orange }}>
                {v.nl} <span style={{ fontSize: 26, color: C.dim, fontWeight: 500 }}>· {enShort(v.en)}</span>
              </div>
              <div style={{ fontSize: 58, fontWeight: 800, marginTop: 6, whiteSpace: "nowrap", opacity: p }}>
                <span style={{ color: C.dim, fontSize: 40, fontWeight: 600 }}>{auxForm(auxOf(id), "hij")} </span>
                <span style={{ color: C.green }}>{v.participle}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------- 4. hebben or zijn ---------- */

export function PZijn({ L, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const is = auxForm("zijn", "hij");
  const tip = pop(f, fps, zijnTipAt(L));
  return (
    <>
      <Heading title={T.zijnTitle} sub={T.zijnSub} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28, alignItems: "start" }}>
        {L.zijn.map((g, i) => {
          const s = pop(f, fps, 16 + i * ZIJN_STEP);
          return (
            <div key={g.key} style={{ ...card, padding: "26px 36px", opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.blue, marginBottom: 10 }}>{T.zijnGroups[g.key]}</div>
              {g.verbs.map((id) => {
                const v = verb(id);
                if (!v.aux.split("/").includes("zijn")) throw new Error(`${id} doesn't take zijn`);
                return (
                  <div key={id} style={{ padding: "8px 0" }}>
                    <div style={{ fontSize: 28, color: C.dim, fontWeight: 600 }}>
                      {v.nl} · {enShort(v.en)}
                    </div>
                    <div style={{ fontSize: 52, fontWeight: 800, whiteSpace: "nowrap" }}>
                      <span style={{ color: C.orange }}>{is}</span> <span style={{ color: C.green }}>{v.participle}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 32, fontSize: 36, color: C.dim, opacity: tip, transform: `translateY(${(1 - tip) * 16}px)` }}>💡 {fill(T.irregularTip)}</div>
    </>
  );
}

/** Ik heb een uur gefietst (activity) · Ik ben naar huis gefietst (destination). */
export function PContrast({ L, T, lang }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Heading title={T.contrastTitle} sub={T.contrastSub} />
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {L.contrast.map((s, i) => {
          const o = pop(f, fps, 16 + i * S(3));
          const lab = pop(f, fps, 16 + i * S(3) + 18);
          const color = s.aux === "zijn" ? C.green : C.blue;
          return (
            <div key={i} style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "26px 44px", opacity: o, transform: `translateX(${(1 - o) * -40}px)` }}>
              <div>
                <div style={{ fontSize: 76, fontWeight: 800 }}>
                  <Sentence s={s} />
                </div>
                {lang === "en" && T.contrastGloss[i] && <div style={gloss}>{T.contrastGloss[i]}</div>}
              </div>
              <span style={{ ...pill(color), fontSize: 32, opacity: lab, transform: `scale(${0.8 + 0.2 * lab})` }}>{T.contrastLabels[s.label]}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ---------- 5. word order ---------- */

/** Ik heb gewerkt, then "gisteren in de tuin" slides in and pushes the participle to the end. */
export function POrder({ L, T, lang }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o = L.order;
  const aux = auxForm(auxOf(o.verb), o.person);
  const part = verb(o.verb).participle;
  const tiles = pop(f, fps, 14);
  const grow = interpolate(f, [S(2.6), S(3.6)], [0, 1], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 });
  const lab = pop(f, fps, S(5));
  const end = pop(f, fps, S(7));
  const tile = (text, color, label, i, extra = {}) => (
    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, ...extra }}>
      <span style={{ ...card, padding: "16px 28px", fontSize: 64, fontWeight: 800, color, whiteSpace: "nowrap", borderColor: i === 3 && end > 0.5 ? C.green : "rgba(255,255,255,0.09)" }}>{text}</span>
      <span style={{ ...pill(i === 3 ? C.green : C.dim), opacity: lab }}>{label}</span>
    </div>
  );
  return (
    <>
      <Heading title={T.orderTitle} sub={T.orderSub} />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 20, opacity: tiles }}>
        {tile(o.subject, C.text, T.orderLabels[0], 0)}
        {tile(aux, C.orange, T.orderLabels[1], 1)}
        <div style={{ maxWidth: grow * 820, overflow: "hidden", opacity: grow }}>{tile(o.rest, C.text, T.orderLabels[2], 2)}</div>
        {tile(part, C.green, T.orderLabels[3], 3)}
      </div>
      <div style={{ marginTop: 50, textAlign: "center", fontSize: 40, fontWeight: 700, color: C.green, opacity: end, transform: `translateY(${(1 - end) * 16}px)` }}>
        {`${o.subject} ${aux} ${o.rest} ${part}.`} ✓{lang === "en" && T.orderGloss && <div style={{ ...gloss, fontWeight: 500 }}>{T.orderGloss}</div>}
      </div>
    </>
  );
}

/** Something in front, or a question: hebben/zijn moves, the participle stays last. */
export function POrder2({ L, T, lang }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      <Heading title={T.order2Title} sub={T.order2Sub} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {L.order2.map((s, i) => {
          const o = pop(f, fps, 16 + i * S(2.6));
          return (
            <div key={i} style={{ ...card, padding: "22px 44px", opacity: o, transform: `translateX(${(1 - o) * -40}px)` }}>
              <div style={{ fontSize: 70, fontWeight: 800 }}>
                <Sentence s={s} />
              </div>
              {lang === "en" && T.order2Gloss[i] && <div style={gloss}>{T.order2Gloss[i]}</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

/** The thumbnail's card: Ik heb gewerkt · Jij bent gegaan · Wij hebben gegeten. */
export function PerfectThumbCard() {
  const rows = [
    { verb: "word.werken", person: "ik", aux: "hebben" },
    { verb: "word.gaan", person: "jij", aux: "zijn" },
    { verb: "word.eten", person: "wij", aux: "hebben" },
  ];
  return (
    <div style={{ ...card, padding: "22px 36px", background: "rgba(255,255,255,0.07)" }}>
      {rows.map((r) => (
        <div key={r.verb} style={{ fontSize: 54, fontWeight: 800, padding: "4px 0", whiteSpace: "nowrap" }}>
          <span>{cap(r.person)} </span>
          <span style={{ color: C.orange }}>{auxForm(r.aux, r.person)} </span>
          <span style={{ ...gradientText }}>{verb(r.verb).participle}</span>
        </div>
      ))}
    </div>
  );
}
