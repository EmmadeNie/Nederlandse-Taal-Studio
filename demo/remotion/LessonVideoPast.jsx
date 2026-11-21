// The scenes of the past-tense lesson video (LESSON_VIDEOS.imperfectum in
// lessons.js) that the perfect tense doesn't have: singular and plural, more
// examples, and two things to watch. The stem, 't kofschip and the trap reuse
// the perfect tense's scenes with tense="past". Every form comes from the data.
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./Demo";
import { cap, enShort, pastForm, pastParts, verb } from "./lessons";
import { card, gradientText, pop } from "./LessonReel";
import { Heading } from "./LessonVideo";
import { S } from "./lessonVideoScenes";

const pill = (color) => ({ display: "inline-block", fontSize: 26, fontWeight: 700, color, border: `2px solid ${color}`, borderRadius: 999, padding: "4px 18px", whiteSpace: "nowrap" });

/** A past form with its ending green: werk|te, speel|den. */
export function PastForm({ id, plural = false }) {
  const { stem, end } = pastParts(id, plural);
  return (
    <>
      {stem}
      <span style={{ color: C.green }}>{end}</span>
    </>
  );
}

const SINGULAR = ["ik", "jij", "u", "hij"];
const PLURAL = ["wij", "jullie", "zij"];

/** werken: ik/jij/u/hij werkte, wij/jullie/zij werkten. */
export function PastTable({ L, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const id = L.table;
  const v = verb(id);
  const col = (title, persons, plural, offset, label) => (
    <div style={{ ...card, padding: "22px 40px 10px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: C.dim, letterSpacing: 1.5, textTransform: "uppercase" }}>{title}</span>
        <span style={{ ...pill(C.green), opacity: pop(f, fps, 18 + offset * S(0.9)) }}>{label}</span>
      </div>
      {persons.map((p, i) => {
        const s = pop(f, fps, 18 + (offset + i) * S(0.9));
        return (
          <div key={p} style={{ padding: "12px 0", borderTop: i ? "1px solid rgba(255,255,255,0.08)" : "none", opacity: s, transform: `translateY(${(1 - s) * 20}px)` }}>
            <div style={{ fontSize: 26, color: C.dim, fontWeight: 500 }}>{T.persons[p]}</div>
            <div style={{ fontSize: 56, fontWeight: 800 }}>
              <PastForm id={id} plural={plural} />
            </div>
          </div>
        );
      })}
    </div>
  );
  return (
    <>
      <Heading title={T.tableTitle} sub={`${v.nl} · ${enShort(v.en)}`} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, alignItems: "start", marginTop: -20 }}>
        {col(T.tableSingular, SINGULAR, false, 0, T.endings[0])}
        {col(T.tablePlural, PLURAL, true, SINGULAR.length, T.endings[1])}
      </div>
    </>
  );
}

/** The same endings on other verbs: ik speelde · wij speelden. */
export function PastExamples({ L, T }) {
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
              <div style={{ fontSize: 28, color: C.dim, marginBottom: 14 }}>{enShort(v.en)}</div>
              {[
                ["ik", false],
                ["wij", true],
              ].map(([p, plural], r) => {
                const row = pop(f, fps, 16 + c * S(1.6) + 10 + r * 10);
                return (
                  <div key={p} style={{ fontSize: 54, fontWeight: 800, padding: "8px 0", opacity: row }}>
                    <span style={{ color: C.dim, fontWeight: 600 }}>{p} </span>
                    <PastForm id={id} plural={plural} />
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

/** Two things to watch: the stem's t stays (wachtte), and a question keeps the form (speelde jij?). */
export function PastNotes({ L, T }) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = L.question;
  const form = pastForm(q.verb, "jij");
  const cards = [
    {
      title: T.noteStemT,
      lines: L.stemT.map((id) => {
        const { stem, end } = pastParts(id);
        if (!stem.endsWith("t")) throw new Error(`${id}: the stem doesn't end in t`);
        return [
          verb(id).nl,
          <>
            {stem.slice(0, -1)}
            <span style={{ color: C.orange }}>t</span>
            <span style={{ color: C.green }}>{end}</span>
          </>,
        ];
      }),
    },
    {
      title: T.noteQuestion,
      lines: [[`Jij ${form} ${q.rest}.`, <span style={{ color: C.green }}>{`${cap(form)} jij ${q.rest}?`}</span>]],
    },
  ];
  return (
    <>
      <Heading title={T.noteTitle} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: -20 }}>
        {cards.map((c, i) => {
          const s = pop(f, fps, 14 + i * S(3.2));
          return (
            <div key={i} style={{ ...card, padding: "26px 44px", opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: C.orange, marginBottom: 10, lineHeight: 1.25 }}>{c.title}</div>
              <div style={{ display: "flex", gap: 80 }}>
              {c.lines.map(([from, to], j) => (
                <div key={j} style={{ fontSize: 54, fontWeight: 800, padding: "6px 0", whiteSpace: "nowrap" }}>
                  <span style={{ color: C.dim, fontSize: 40 }}>{from}</span> <span style={{ color: C.dim, fontWeight: 500 }}>→</span> {to}
                </div>
              ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** The thumbnail's card: Ik werkte · Jij speelde · Wij woonden. */
export function PastThumbCard({ L }) {
  return (
    <div style={{ ...card, padding: "22px 36px", background: "rgba(255,255,255,0.07)" }}>
      {L.thumbRows.map(([id, person]) => {
        const { stem, end } = pastParts(id, person === "wij");
        return (
          <div key={id} style={{ fontSize: 58, fontWeight: 800, padding: "4px 0", whiteSpace: "nowrap" }}>
            <span>{cap(person)} </span>
            {stem}
            <span style={{ ...gradientText }}>{end}</span>
          </div>
        );
      })}
    </div>
  );
}
