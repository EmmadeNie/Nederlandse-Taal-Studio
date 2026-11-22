// Instagram carousel (4:5, light): perfectum or imperfectum? After the grammar
// topic "Perfectum of imperfectum?" (topic.perfectum-of-imperfectum). One Still
// per slide; every verb form comes from the app's data (lessons.js), [aux]
// [part] and [v] in a sentence are filled in from there.
import { AbsoluteFill } from "remotion";
import { LogoMark, fontFamily } from "./Demo";
import { perfectParts } from "./lessons";
import { Rich } from "./LessonReel";

export const CAROUSEL_SIZE = { width: 1080, height: 1350 };

// The light palette of the stickers (Sticker.jsx), with darker accents for contrast on white.
export const L = {
  bg: "#f3f4f7",
  card: "#ffffff",
  line: "#e3e6eb",
  text: "#0b0d11",
  dim: "#5b6472",
  perfect: "#2f7fe0", // perfectum: blue
  past: "#1a9e58", // imperfectum: green
  accent: "#e07a22",
};

// The sentences, each with the tense it shows.
const S = {
  bothPerfect: { verb: "word.werken", person: "ik", text: "Ik [aux] [part].", tense: "perfect" },
  bothPast: { verb: "word.werken", person: "ik", text: "Ik [v].", tense: "past" },
  perfect1: { verb: "word.werken", person: "ik", text: "Gisteren [aux] ik [part].", tense: "perfect" },
  perfect2: { verb: "word.gaan", person: "ik", text: "Ik [aux] naar huis [part].", tense: "perfect" },
  past1: { verb: "word.zijn", person: "hij", text: "Het [v] koud.", tense: "past" },
  past2: { verb: "word.werken", person: "ik", text: "Vroeger [v] ik in een winkel.", tense: "past" },
  storyPast: { verb: "word.zijn", person: "ik", text: "Ik [v] moe,", tense: "past" },
  storyPerfect: { verb: "word.gaan", person: "ik", text: "dus ik [aux] vroeg naar bed [part].", tense: "perfect" },
  tipPast: { verb: "word.werken", person: "ik", text: "Gisteren [v] ik.", tense: "past" },
  tipPerfect: { verb: "word.werken", person: "ik", text: "Gisteren [aux] ik [part].", tense: "perfect" },
};

const TEXT = {
  en: {
    level: "A2",
    cover: { kicker: "Talking about the past", title: ["Perfectum", "or imperfectum?"], sub: "Two ways to say what happened in Dutch", swipe: "Swipe →" },
    both: { title: "Both are the past", sub: "Both can mean “I worked”", note: "The difference is what you want to tell." },
    perfect: { label: "Perfectum", title: "What happened?", rule: "*hebben / zijn* + past participle", use: "An event: what you did or what happened. The most common way to tell what you did." },
    past: { label: "Imperfectum", title: "What was it like?", rule: "stem + *te / de* (regular verbs)", use: "Background, habits and stories: how things were, what you used to do." },
    story: { title: "Together in a story", sub: "Background and event can go together", tags: ["background", "event"], en: "I was tired, so I went to bed early." },
    tip: { title: "*Gisteren* works with both", sub: "A time word doesn't decide the tense", note: "The difference in use is a guide, not a hard rule." },
    quiz: {
      title: "Your turn!",
      sub: "*Perfectum* or *imperfectum*? Drop your answers in the comments 👇",
      items: [
        ["Vroeger ___ ik in Utrecht.", "(wonen)", "I used to live in Utrecht."],
        ["Gisteren ___ ik een fiets ___.", "(kopen)", "Yesterday I bought a bike."],
      ],
    },
    end: { title: "Learn both, step by step", lines: ["Full lessons + extra practice on YouTube", "Practise in the app"], links: ["youtube.com/@mijntaalstudio", "mijntaalstudio.nl"], follow: "Follow for more Dutch grammar" },
  },
};

export const CAROUSEL_SLIDES = ["cover", "both", "perfect", "past", "story", "tip", "quiz", "end"];

/** A sentence with its verb forms in the tense's colour. */
function Sentence({ s }) {
  const color = s.tense === "perfect" ? L.perfect : L.past;
  return perfectParts(s).map((p, i) =>
    p.text ? (
      <span key={i}>{p.text}</span>
    ) : (
      <span key={i} style={{ color, fontWeight: 800 }}>
        {p.aux ?? p.part ?? p.past}
      </span>
    ),
  );
}

export const card = { background: L.card, border: `2px solid ${L.line}`, borderRadius: 36, boxShadow: "0 10px 30px rgba(11,13,17,0.06)" };
export const chip = (color) => ({ display: "inline-block", fontSize: 30, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "#fff", background: color, borderRadius: 999, padding: "10px 26px" });

export function Frame({ n, total, children }) {
  return (
    <AbsoluteFill style={{ background: L.bg, fontFamily, color: L.text }}>
      <div style={{ position: "absolute", left: 80, right: 80, top: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 32, fontWeight: 800 }}>
          <LogoMark size={64} delay={-60} />
          Taal Studio
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: L.dim }}>
          {n} / {total}
        </div>
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, top: 170, bottom: 110, display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</div>
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 56, fontSize: 26, fontWeight: 700, color: L.dim }}>@mijntaalstudio</div>
    </AbsoluteFill>
  );
}

export function Title({ title, sub }) {
  return (
    <div style={{ marginBottom: 50 }}>
      <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>
        <Rich text={title} />
      </div>
      {sub && (
        <div style={{ fontSize: 40, fontWeight: 500, color: L.dim, marginTop: 18, lineHeight: 1.3 }}>
          <Rich text={sub} />
        </div>
      )}
    </div>
  );
}

export const big = { fontSize: 60, fontWeight: 700, lineHeight: 1.25 };

export function CarouselSlide({ slide, lang = "en" }) {
  const T = TEXT[lang];
  const n = CAROUSEL_SLIDES.indexOf(slide) + 1;
  const total = CAROUSEL_SLIDES.length;
  const F = ({ children }) => (
    <Frame n={n} total={total}>
      {children}
    </Frame>
  );

  if (slide === "cover")
    return (
      <F>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
          <span style={chip(L.accent)}>{T.level}</span>
          <span style={{ fontSize: 36, fontWeight: 700, color: L.dim }}>{T.cover.kicker}</span>
        </div>
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -3.5, lineHeight: 1 }}>
          <div style={{ color: L.perfect }}>{T.cover.title[0]}</div>
          <div>
            {T.cover.title[1].split(" ")[0]} <span style={{ color: L.past }}>{T.cover.title[1].split(" ").slice(1).join(" ")}</span>
          </div>
        </div>
        <div style={{ fontSize: 46, fontWeight: 500, color: L.dim, marginTop: 44, lineHeight: 1.3 }}>{T.cover.sub}</div>
        <div style={{ ...card, marginTop: 70, padding: "34px 44px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={big}>
            <Sentence s={S.bothPerfect} />
          </div>
          <div style={big}>
            <Sentence s={S.bothPast} />
          </div>
        </div>
        <div style={{ alignSelf: "flex-end", marginTop: 50, fontSize: 40, fontWeight: 800, color: L.accent }}>{T.cover.swipe}</div>
      </F>
    );

  if (slide === "both")
    return (
      <F>
        <Title title={T.both.title} sub={T.both.sub} />
        {[
          [T.perfect.label, S.bothPerfect, L.perfect],
          [T.past.label, S.bothPast, L.past],
        ].map(([label, s, color]) => (
          <div key={label} style={{ ...card, padding: "34px 44px", marginBottom: 28 }}>
            <span style={chip(color)}>{label}</span>
            <div style={{ ...big, fontSize: 76, marginTop: 20 }}>
              <Sentence s={s} />
            </div>
          </div>
        ))}
        <div style={{ fontSize: 44, fontWeight: 700, marginTop: 24, lineHeight: 1.3 }}>{T.both.note}</div>
      </F>
    );

  if (slide === "perfect" || slide === "past") {
    const t = T[slide];
    const color = slide === "perfect" ? L.perfect : L.past;
    const ex = slide === "perfect" ? [S.perfect1, S.perfect2] : [S.past1, S.past2];
    return (
      <F>
        <span style={{ ...chip(color), alignSelf: "flex-start", marginBottom: 26 }}>{t.label}</span>
        <Title title={t.title} />
        <div style={{ fontSize: 42, fontWeight: 800, color, padding: "22px 34px", borderRadius: 24, border: `3px solid ${color}`, alignSelf: "flex-start", marginTop: -20, marginBottom: 40 }}>
          <Rich text={t.rule} />
        </div>
        <div style={{ ...card, padding: "30px 44px", display: "flex", flexDirection: "column", gap: 16 }}>
          {ex.map((s, i) => (
            <div key={i} style={big}>
              <Sentence s={s} />
            </div>
          ))}
        </div>
        <div style={{ fontSize: 40, color: L.dim, marginTop: 40, lineHeight: 1.35 }}>{t.use}</div>
      </F>
    );
  }

  if (slide === "story")
    return (
      <F>
        <Title title={T.story.title} sub={T.story.sub} />
        <div style={{ ...card, padding: "40px 44px" }}>
          {[
            [S.storyPast, T.story.tags[0], L.past, T.past.label],
            [S.storyPerfect, T.story.tags[1], L.perfect, T.perfect.label],
          ].map(([s, tag, color, label], i) => (
            <div key={i} style={{ padding: "16px 0", borderTop: i ? `2px solid ${L.line}` : "none" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 1 }}>
                {tag} · {label}
              </div>
              <div style={{ ...big, fontSize: 64, marginTop: 6 }}>
                <Sentence s={s} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 40, color: L.dim, marginTop: 36, fontStyle: "italic" }}>{T.story.en}</div>
      </F>
    );

  if (slide === "tip")
    return (
      <F>
        <Title title={T.tip.title} sub={T.tip.sub} />
        <div style={{ ...card, padding: "34px 44px", display: "flex", flexDirection: "column", gap: 18 }}>
          {[
            [S.tipPast, L.past, T.past.label],
            [S.tipPerfect, L.perfect, T.perfect.label],
          ].map(([s, color, label], i) => (
            <div key={i} style={{ padding: "8px 0", borderTop: i ? `2px solid ${L.line}` : "none" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 1 }}>✓ {label}</div>
              <div style={{ ...big, fontSize: 64, marginTop: 4 }}>
                <Sentence s={s} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 42, fontWeight: 600, marginTop: 44, lineHeight: 1.35 }}>💡 {T.tip.note}</div>
      </F>
    );

  if (slide === "quiz")
    return (
      <F>
        <Title title={T.quiz.title} sub={T.quiz.sub} />
        {T.quiz.items.map(([q, hint, en], i) => (
          <div key={i} style={{ ...card, padding: "34px 44px", marginBottom: 28 }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: L.dim }}>{i + 1}</div>
            <div style={{ ...big, fontSize: 52 }}>
              {q.split("___").map((piece, k, all) => (
                <span key={k}>
                  {piece}
                  {k < all.length - 1 && <span style={{ display: "inline-block", width: 110, borderBottom: `6px solid ${L.accent}`, margin: "0 8px" }} />}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 38, fontWeight: 800, color: L.accent, marginTop: 10 }}>{hint}</div>
            <div style={{ fontSize: 34, color: L.dim, marginTop: 8 }}>{en}</div>
          </div>
        ))}
      </F>
    );

  // end
  return (
    <F>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <LogoMark size={150} delay={-60} />
        <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -2, marginTop: 40, lineHeight: 1.1 }}>{T.end.title}</div>
        {T.end.lines.map((line, i) => (
          <div key={i} style={{ ...card, width: "100%", padding: "30px 40px", marginTop: i ? 24 : 56 }}>
            <div style={{ fontSize: 38, fontWeight: 700 }}>{line}</div>
            <div style={{ fontSize: 46, fontWeight: 800, color: i ? L.past : L.perfect, marginTop: 8 }}>{T.end.links[i]}</div>
          </div>
        ))}
        <div style={{ fontSize: 38, fontWeight: 700, color: L.accent, marginTop: 50 }}>{T.end.follow}</div>
      </div>
    </F>
  );
}
