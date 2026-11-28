// YouTube texts for the long inversie video with Emma's voice (node inversie/youtube.mjs, from demo/):
// the title, the description with chapters and the sentences, and a caption track (.srt)
// with what Emma says and its English. Times come from inversionTimeline.json.
import { mkdirSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";

const TL = JSON.parse(readFileSync("remotion/inversionTimeline.json", "utf8"));
const at = Object.fromEntries(TL.scenes.map((t) => [t.id, t]));
const OUT = "out/lessons";
const SITE = "https://mijntaalstudio.nl";

const title = "Dutch inversion (inversie): Morgen werk ik thuis | Dutch grammar A2 | Taal Studio";
const lead =
  "Dutch inversion (inversie, A2): why does everyone get it wrong? Because it feels like the exception, but you use it almost more often than not. The rule: the verb is always in position 2. Start your sentence with a time, a place, another part of the sentence, daarom/toen/dan, a question word or a whole subclause, and the subject moves behind the verb. With a short quiz at the end.";

// Chapters must be 10 s or longer: "watch out" goes with "when".
const CHAPTERS = [
  ["mistake1", "Why everyone gets it wrong"],
  ["rule", "The golden rule"],
  ["time", "When to use inversion"],
  ["quiz1", "Quiz"],
];

// What Emma says per clip, in the order of the scenes' vo lists, with the English.
const SAID = {
  mistake1: [["Morgen ik werk thuis…?", "(wrong)"], ["Morgen werk ik thuis.", "I'm working from home tomorrow."]],
  mistake2: [["Gisteren ik heb pizza gegeten…?", "(wrong)"], ["Gisteren heb ik pizza gegeten.", "I ate pizza yesterday."]],
  mistake3: [["Omdat het koud is, ik draag een jas…?", "(wrong)"], ["Omdat het koud is, draag ik een jas.", "Because it's cold, I'm wearing a coat."]],
  why: [["Ik werk morgen thuis.", "I'm working from home tomorrow. (the normal order)"]],
  rule: [["Ik werk morgen thuis.", "subject + verb"], ["Morgen werk ik thuis.", "verb + subject"]],
  switch: [["Ik werk…", ""], ["werk ik!", "switch the subject and the verb"]],
  time: [["Vanavond kook ik.", "Tonight I'm cooking."]],
  place: [["In Utrecht woont mijn zus.", "My sister lives in Utrecht."]],
  other: [["Die film heb ik al gezien.", "I've already seen that film."]],
  linker: [["Daarom blijf ik thuis.", "That's why I'm staying home."]],
  question: [["Waar woon jij?", "Where do you live?"], ["Jij woont…", ""], ["woon jij.", "the -t drops: woont → woon jij"]],
  clause: [["Als het regent, blijf ik thuis.", "If it rains, I stay home."]],
  clause2: [["Omdat ik moe ben, ga ik vroeg slapen.", "Because I'm tired, I'm going to bed early."]],
  beware: [["Ik blijf thuis, want ik ben moe.", "I'm staying home, because I'm tired. (no inversion after want)"]],
};
const QUIZ = { quiz1: ["Vandaag werk ik thuis.", "Today I'm working from home."], quiz2: ["Toen ik klein was, woonde ik in Spanje.", "When I was little, I lived in Spain."] };
const C = JSON.parse(readFileSync("remotion/inversion.json", "utf8"));

const time = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const description = [
  lead,
  "",
  `📖 Explanation on the site: ${SITE}/en/grammar/inversie/`,
  "💬 Turn on captions (CC) for the English of what Emma says.",
  "",
  "Chapters",
  ...CHAPTERS.map(([id, name]) => `${time(at[id].start)} ${name}`),
  "",
  "Sentences in this video",
  ...["time", "place", "other", "linker", "question", "clause", "clause2", "beware"].map((id) => `${SAID[id][0][0]} – ${SAID[id][0][1]}`),
  "",
  "Taal Studio · Learn Dutch at your level",
  SITE,
  "",
].join("\n");

const stamp = (s) => {
  const ms = Math.round(s * 1000);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
const cues = [];
for (const [id, said] of Object.entries(SAID)) {
  const t = at[id];
  const end = t.start + t.dur - 0.2;
  said.forEach(([nl, en], i) => {
    const from = t.start + t.voice[i][0];
    const to = i + 1 < said.length ? t.start + t.voice[i + 1][0] : end;
    cues.push({ from, to, lines: [nl, en].filter(Boolean) });
  });
}
for (const [id, [nl, en]] of Object.entries(QUIZ)) {
  const t = at[id];
  const reveal = C.scenes.find((s) => s.id === id).reveal;
  cues.push({ from: t.start + reveal, to: t.start + t.dur - 0.2, lines: [nl, en] });
}
cues.sort((a, b) => a.from - b.from);
const srt = cues.map((c, i) => `${i + 1}\n${stamp(c.from)} --> ${stamp(c.to)}\n${c.lines.join("\n")}\n`).join("\n");

mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/lesson_inversie_desktop_voice_title_EN.txt`, `${title}\n`);
writeFileSync(`${OUT}/lesson_inversie_desktop_voice_description_EN.txt`, description);
writeFileSync(`${OUT}/lesson_inversie_desktop_voice_captions_EN.srt`, srt);
console.log(`${OUT}/lesson_inversie_desktop_voice_{title,description,captions}_EN`);
