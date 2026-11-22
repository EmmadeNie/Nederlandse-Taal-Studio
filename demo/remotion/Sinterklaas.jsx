// Instagram carousel (4:5, light): Sinterklaas in 7 words. Dutch culture for
// learners in November/December. Same frame and palette as the perfectum
// carousel (Carousel.jsx); Dutch words inside English text are *italic*.
import { LogoMark } from "./Demo";
import { Rich } from "./LessonReel";
import { L, card, chip, Frame, Title, big } from "./Carousel";

export const RED = "#c8102e";
export const GOLD = "#a8761a";

export const WORDS = [
  {
    nl: "Sinterklaas",
    en: "Saint Nicholas, or *de Sint* for short",
    about: "He arrives by steamboat (*de stoomboot*) from Spain in mid-November, and the whole country watches.",
    ex: ["Sinterklaas komt met de stoomboot.", "Sinterklaas comes by steamboat."],
  },
  {
    art: "de",
    nl: "pakjesavond",
    en: "“gifts or parcels evening”",
    about: "5 December: the evening the presents arrive. For many Dutch children it's bigger than Christmas.",
    ex: ["Vanavond is het pakjesavond!", "Tonight is the night of presents!"],
  },
  {
    nl: "je schoen zetten",
    en: "to put out your shoe",
    about: "Children leave a shoe by the fireplace, with a carrot for Sinterklaas's horse. In the morning there's a small treat in it.",
    ex: ["Mag ik vanavond mijn schoen zetten?", "Can I put out my shoe tonight?"],
  },
  {
    art: "de",
    nl: "pepernoten",
    en: "small spiced biscuits",
    about: "Cinnamon, cloves and nutmeg. The round crunchy ones are officially *kruidnoten*, but almost everyone calls them *pepernoten*.",
    ex: ["Wie wil er pepernoten?", "Who wants some pepernoten?"],
  },
  {
    art: "de",
    nl: "chocoladeletter",
    en: "a chocolate letter",
    about: "A big letter made of chocolate, usually the first letter of your name.",
    ex: ["Mijn chocoladeletter is de E van Emma.", "My chocolate letter is the E for Emma."],
  },
  {
    art: "de",
    nl: "surprise",
    en: "a disguised homemade gift",
    about: "Adults and children draw names (*lootjes\u00a0trekken*) and build a creative package that hides the real present.",
    ex: ["Wat een mooie surprise!", "What a lovely surprise!"],
  },
  {
    art: "het",
    nl: "gedicht",
    en: "a poem",
    about: "Every present comes with a funny rhyming poem that teases the receiver a little. It's always signed “Sint”.",
    ex: ["Lees je gedicht maar voor!", "Go on, read your poem out loud!"],
  },
];

const T = {
  cover: { kicker: "Dutch culture", title: ["Sinterklaas", "in 7 words"], sub: "The Dutch December holiday, explained", swipe: "Swipe →" },
  quiz: {
    title: "Your turn!",
    sub: "Fill in the Sinterklaas word. Answers in the comments 👇",
    items: [
      ["Op 5 december is het ___.", "the evening of presents"],
      ["Ik zet vanavond mijn ___.", "with a carrot for the horse"],
      ["Wil je nog een ___?", "a small spiced biscuit"],
    ],
  },
  end: { title: "Learn Dutch, step by step", lines: ["Full lessons on YouTube", "Practise in the app"], links: ["youtube.com/@mijntaalstudio", "mijntaalstudio.nl"], follow: "Follow for more Dutch words & culture" },
};

export const SINTERKLAAS_SLIDES = ["cover", ...WORDS.map((_, i) => `word-${i}`), "quiz", "end"];

export function SinterklaasSlide({ slide }) {
  const n = SINTERKLAAS_SLIDES.indexOf(slide) + 1;
  const total = SINTERKLAAS_SLIDES.length;
  const F = ({ children }) => (
    <Frame n={n} total={total}>
      {children}
    </Frame>
  );

  if (slide === "cover")
    return (
      <F>
        <span style={{ ...chip(RED), alignSelf: "flex-start", marginBottom: 40 }}>{T.cover.kicker}</span>
        <div style={{ fontSize: 128, fontWeight: 800, letterSpacing: -3.5, lineHeight: 1 }}>
          <div style={{ color: RED }}>{T.cover.title[0]}</div>
          <div>{T.cover.title[1]}</div>
        </div>
        <div style={{ fontSize: 46, fontWeight: 500, color: L.dim, marginTop: 40, lineHeight: 1.3 }}>{T.cover.sub}</div>
        <div style={{ ...card, marginTop: 64, padding: "36px 40px", display: "flex", flexWrap: "wrap", gap: 16 }}>
          {WORDS.map((w) => (
            <span key={w.nl} style={{ fontSize: 38, fontWeight: 700, padding: "10px 24px", borderRadius: 999, background: "#fbeef0", color: RED }}>
              {w.nl}
            </span>
          ))}
        </div>
        <div style={{ alignSelf: "flex-end", marginTop: 50, fontSize: 40, fontWeight: 800, color: RED }}>{T.cover.swipe}</div>
      </F>
    );

  if (slide.startsWith("word-")) {
    const i = Number(slide.slice(5));
    const w = WORDS[i];
    return (
      <F>
        <div style={{ fontSize: 30, fontWeight: 800, color: GOLD, letterSpacing: 1, textTransform: "uppercase", marginBottom: 18 }}>
          Word {i + 1} of {WORDS.length}
        </div>
        <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: -3, lineHeight: 1.05 }}>
          {w.art && <span style={{ color: L.dim, fontWeight: 700 }}>{w.art} </span>}
          <span style={{ color: RED }}>{w.nl}</span>
        </div>
        <div style={{ fontSize: 46, fontWeight: 600, color: L.dim, marginTop: 20, lineHeight: 1.25 }}>
          <Rich text={w.en} />
        </div>
        <div style={{ fontSize: 42, lineHeight: 1.4, marginTop: 50 }}>
          <Rich text={w.about} />
        </div>
        <div style={{ ...card, marginTop: 56, padding: "34px 44px", borderLeft: `10px solid ${RED}` }}>
          <div style={{ ...big, fontSize: 54 }}>{w.ex[0]}</div>
          <div style={{ fontSize: 36, color: L.dim, marginTop: 12, fontStyle: "italic" }}>{w.ex[1]}</div>
        </div>
      </F>
    );
  }

  if (slide === "quiz")
    return (
      <F>
        <Title title={T.quiz.title} sub={T.quiz.sub} />
        {T.quiz.items.map(([q, hint], i) => {
          // Keep the blank and the punctuation after it on one line.
          const [before, after] = q.split("___");
          return (
            <div key={i} style={{ ...card, padding: "28px 44px", marginBottom: 24 }}>
              <div style={{ ...big, fontSize: 46 }}>
                <span style={{ color: L.dim, marginRight: 14 }}>{i + 1}.</span>
                {before}
                <span style={{ whiteSpace: "nowrap" }}>
                  <span style={{ display: "inline-block", width: 120, borderBottom: `6px solid ${RED}`, margin: "0 6px" }} />
                  {after}
                </span>
              </div>
              <div style={{ fontSize: 34, fontWeight: 700, color: GOLD, marginTop: 8 }}>💡 {hint}</div>
            </div>
          );
        })}
      </F>
    );

  // end
  return (
    <F>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <LogoMark size={150} delay={-60} />
        <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2, marginTop: 40, lineHeight: 1.1 }}>{T.end.title}</div>
        {T.end.lines.map((line, i) => (
          <div key={i} style={{ ...card, width: "100%", padding: "30px 40px", marginTop: i ? 24 : 56 }}>
            <div style={{ fontSize: 38, fontWeight: 700 }}>{line}</div>
            <div style={{ fontSize: 46, fontWeight: 800, color: i ? L.past : L.perfect, marginTop: 8 }}>{T.end.links[i]}</div>
          </div>
        ))}
        <div style={{ fontSize: 38, fontWeight: 700, color: RED, marginTop: 50 }}>{T.end.follow}</div>
      </div>
    </F>
  );
}
