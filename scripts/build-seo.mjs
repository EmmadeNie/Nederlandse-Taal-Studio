#!/usr/bin/env node
/**
 * Runs after `vite build`: writes the pages search engines can read.
 *
 * Every page in Dutch and in English (/en/…), linked with hreflang and an NL/EN
 * switch that also sets the app's language (localStorage "nts-lang"):
 *
 *   /nederlandse-les/  · /en/dutch-lessons/   lessons and the contact form
 *   /reviews/          · /en/reviews/          students' reviews (in their own language)
 *   /grammatica/…      · /en/grammar/…         grammar topics: title, summary and the
 *                                              short explanation (the full one and the
 *                                              exercises stay in the app, behind the login)
 *   sitemap.xml, robots.txt
 *
 * The topics come from the public_topics() function in Supabase (anon key, the
 * same env vars as the app). SEO_TOPICS_JSON=<file> uses a saved list instead.
 * Without either, only robots.txt and the sitemap of the home page are written:
 * the build never fails over SEO.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { PLAN_FEATURES, PLAN_OFFERS, PLAN_TEXT } from "../src/data/plans.js";

const SITE = "https://mijntaalstudio.nl";
const DIST = path.resolve("dist");
const LEVELS = ["A0", "A1", "A2", "B1", "B2"];

/** The app's paths behind the login: not for search engines. */
const PRIVATE = ["/leerpad", "/dashboard", "/lesprogramma", "/leerpaden", "/bibliotheek", "/feedback", "/flashcards", "/nakijken", "/voorstellen", "/gebruikers", "/abonnement"];

function readEnvFile(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]),
  );
}

const ENV = { ...readEnvFile(".env.local"), ...readEnvFile(".env.production.local"), ...process.env };
const SUPABASE_URL = ENV.VITE_SUPABASE_URL;
const SUPABASE_KEY = ENV.VITE_SUPABASE_ANON_KEY;
const hosted = SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes("127.0.0.1") && !SUPABASE_URL.includes("localhost");

async function loadTopics() {
  if (process.env.SEO_TOPICS_JSON) return JSON.parse(readFileSync(process.env.SEO_TOPICS_JSON, "utf8"));
  const url = SUPABASE_URL;
  const key = SUPABASE_KEY;
  if (!hosted) {
    console.warn("build-seo: no hosted Supabase in the env; skipping the grammar pages.");
    return [];
  }
  try {
    const res = await fetch(`${url}/rest/v1/rpc/public_topics`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: "{}",
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return await res.json();
  } catch (e) {
    console.warn(`build-seo: could not load the topics (${e.message}); skipping the grammar pages.`);
    return [];
  }
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** The short explanation as HTML (it is HTML or Markdown), without anything that could run. */
function richHtml(text) {
  const html = /^\s*</.test(text || "") ? text : marked.parse(text || "");
  return html
    .replace(/<\s*(script|style|iframe|object|embed|form)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');
}

const plain = (html) => String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const levelOf = (t) => (LEVELS.includes(t.level) ? t.level : "A1");

const CSS = `
:root{--bg:#0f1115;--surface:#1a1d24;--surface-2:#20242c;--border:#2a2f3a;--text:#e6e8ec;--dim:#9aa3b2;--accent:#4f9cf9;--green:#2fd27a;--orange:#f08c3c}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
a{color:var(--accent)}
.wrap{max-width:760px;margin:0 auto;padding:1.25rem 1rem 3rem}
header.site{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.25rem 0 1.5rem}
.brand{display:flex;align-items:center;gap:.6rem;color:var(--text);text-decoration:none;font-weight:800;font-size:1.15rem;white-space:nowrap}
.brand img{width:34px;height:34px}
.btn{display:inline-block;padding:.6rem 1rem;border-radius:10px;background:var(--accent);color:#0b0d11;font-weight:700;text-decoration:none}
.btn.ghost{background:transparent;color:var(--text);border:1px solid var(--border)}
nav.menu{display:flex;align-items:center;gap:1rem;flex-wrap:wrap;justify-content:flex-end}
nav.menu a:not(.btn){color:var(--text);text-decoration:none;font-weight:600;font-size:.95rem}
nav.menu a:not(.btn):hover{color:var(--accent)}
.langs{display:inline-flex;border:1px solid var(--border);border-radius:8px;overflow:hidden}
.langs a{padding:.3rem .55rem;font-size:.8rem;font-weight:700;color:var(--dim)!important;text-decoration:none}
.langs a[aria-current]{background:rgba(79,156,249,.15);color:var(--accent)!important}
@media (max-width:700px){header.site{flex-direction:column;align-items:flex-start}nav.menu{justify-content:flex-start;gap:.8rem}}
.hero{padding:1rem 0 .5rem}
.hero .lead{font-size:1.2rem}
.actions{display:flex;gap:.7rem;flex-wrap:wrap;margin:1.2rem 0 1.5rem}
.video{margin:1.5rem 0;border-radius:14px;overflow:hidden;border:1px solid var(--border);aspect-ratio:16/10;background:#0b0d11}
.video video{width:100%;height:100%;display:block;object-fit:cover}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:.8rem;margin:.6rem 0}
.card{padding:1rem;border-radius:12px;background:var(--surface);border:1px solid var(--border)}
.card h3{margin:0 0 .3rem;font-size:1rem}
.card p{margin:0;color:var(--dim);font-size:.95rem}
blockquote{margin:0;padding:1rem 1.1rem;border-radius:12px;background:var(--surface);border:1px solid var(--border)}
blockquote p{margin:0 0 .5rem}
blockquote cite{color:var(--dim);font-style:normal;font-size:.9rem}
.stars{color:#f5b301;letter-spacing:.1em}
.reviews{display:grid;gap:.9rem;margin:1rem 0}
.reviews .who{display:flex;align-items:center;gap:.75rem;margin-bottom:.6rem;line-height:1.3}
.reviews .avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#0b0d11;font-weight:800;flex:none}
.faq h3{margin-top:1.2rem}
.plans{align-items:start}
.plan{position:relative}
.plan.featured{border-color:var(--accent);box-shadow:0 10px 30px rgba(0,0,0,.25)}
.plan .price{margin:.5rem 0 0;color:var(--text)}
.plan .price strong{font-size:1.8rem;letter-spacing:-.02em}
.plan .deal{margin:.3rem 0 0;color:#2fd27a;font-weight:600;font-size:.9rem}
.plan ul{list-style:none;padding:0;margin:.9rem 0 0;display:grid;gap:.4rem;font-size:.92rem}
.plan li::before{content:"✓";color:#2fd27a;font-weight:800;margin-right:.45rem}
.plan li.off{color:var(--dim)}
.plan li.off::before{content:"–";color:var(--dim)}
form.contact{display:grid;gap:.9rem;margin:1rem 0}
form.contact label{display:grid;gap:.35rem;font-weight:600;font-size:.95rem}
form.contact input,form.contact select,form.contact textarea{font:inherit;color:var(--text);background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:.65rem .75rem}
form.contact textarea{min-height:8rem;resize:vertical}
form.contact .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
form.contact button{justify-self:start;border:0;cursor:pointer;font:inherit}
.note{color:var(--dim);font-size:.9rem}
.msg{padding:.8rem 1rem;border-radius:10px}
a.yt{position:relative;display:block;max-width:480px;border-radius:14px;overflow:hidden;border:1px solid var(--border)}
a.yt img{display:block;width:100%;height:auto}
a.yt .play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:2.6rem;color:#fff;background:rgba(0,0,0,.25);text-shadow:0 4px 20px rgba(0,0,0,.6)}
a.yt:hover .play{background:rgba(0,0,0,.1)}
.msg.ok{background:rgba(47,210,122,.12);border:1px solid rgba(47,210,122,.4)}
.msg.err{background:rgba(240,90,90,.12);border:1px solid rgba(240,90,90,.4)}
nav.crumbs{font-size:.85rem;color:var(--dim);margin-bottom:.5rem}
nav.crumbs a{color:var(--dim)}
h1{font-size:2rem;line-height:1.2;margin:.2rem 0 .6rem;letter-spacing:-.02em}
h2{font-size:1.3rem;margin:2rem 0 .6rem}
h3{font-size:1.05rem;margin:1.4rem 0 .4rem}
.lead{color:var(--dim);font-size:1.1rem;margin:0 0 1.25rem}
.badge{display:inline-block;padding:.1rem .5rem;border-radius:6px;font-size:.8rem;font-weight:700;background:rgba(79,156,249,.15);color:var(--accent);margin-right:.4rem}
.rich div[data-callout]{--c:#4f9cf9;position:relative;margin:.4rem 0 .9rem;padding:1.7rem .95rem .75rem;border-radius:8px;background:color-mix(in srgb,var(--c) 11%,transparent);border:1px solid color-mix(in srgb,var(--c) 35%,transparent)}
.rich div[data-callout]::before{position:absolute;top:.45rem;left:.95rem;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:color-mix(in srgb,var(--c) 80%,var(--text))}
.rich div[data-callout="regel"]::before{content:"Regel"}
html[lang=en] .rich div[data-callout="regel"]::before{content:"Rule"}
html[lang=en] .rich div[data-callout="letop"]::before{content:"Watch out"}
html[lang=en] .rich div[data-callout="voorbeeld"]::before{content:"Example"}
.rich div[data-callout="tip"]{--c:#3fbf7f}.rich div[data-callout="tip"]::before{content:"Tip"}
.rich div[data-callout="letop"]{--c:#f08c3c}.rich div[data-callout="letop"]::before{content:"Let op"}
.rich div[data-callout="voorbeeld"]{--c:#a67cf0}.rich div[data-callout="voorbeeld"]::before{content:"Voorbeeld"}
.rich div[data-callout]>:last-child{margin-bottom:0}
.rich div[data-example]{margin:.3rem 0 .8rem;padding:.45rem .8rem;border-radius:8px;background:var(--surface-2)}
.rich div[data-example]>p{margin:0}.rich div[data-example]>p:first-child{font-weight:600}
.rich div[data-example]>p+p{color:var(--dim);font-style:italic;font-size:.9rem}
.rich table{border-collapse:collapse;width:100%;margin:.6rem 0 1rem;font-size:.95rem}
.rich th,.rich td{border:1px solid var(--border);padding:.4rem .6rem;text-align:left}
.cta{margin:2rem 0;padding:1.25rem;border-radius:14px;background:var(--surface);border:1px solid var(--border)}
.cta p{margin:0 0 .9rem}
details.en{margin-top:2rem;padding:.8rem 1rem;border-radius:10px;background:var(--surface);border:1px solid var(--border)}
details.en summary{cursor:pointer;font-weight:700}
ul.topics{list-style:none;padding:0;margin:0;display:grid;gap:.6rem}
ul.topics li a{display:block;padding:.8rem 1rem;border-radius:10px;background:var(--surface);border:1px solid var(--border);color:var(--text);text-decoration:none}
ul.topics li a:hover{border-color:var(--accent)}
ul.topics li strong{display:block}
ul.topics li span{color:var(--dim);font-size:.92rem}
footer.site{margin-top:3rem;padding-top:1.25rem;border-top:1px solid var(--border);color:var(--dim);font-size:.9rem}
footer.site a{color:var(--dim)}
`;

const YOUTUBE = "https://www.youtube.com/watch?v=RPqN1txdEV4";
const SUPERPROF = "https://www.super-prof.nl/sessions-combined-with-full-access-online-program-including-agent-practice-conversation-prepare-for-exams.html";
const YOUTUBE_THUMB = "https://i.ytimg.com/vi/RPqN1txdEV4/hqdefault.jpg";

/** Paths per language. */
const PATHS = {
  nl: { lessons: "/nederlandse-les/", reviews: "/reviews/", grammar: "/grammatica/" },
  en: { lessons: "/en/dutch-lessons/", reviews: "/en/reviews/", grammar: "/en/grammar/" },
};
const other = (lang) => (lang === "nl" ? "en" : "nl");

/** Everything the pages say, per language. */
const T = {
  nl: {
    locale: "nl_NL",
    menuLessons: "Lessen &amp; contact",
    menuPlans: "Abonnementen",
    plansAnchor: "abonnementen",
    menuReviews: "Reviews",
    login: "Inloggen",
    footer: "Nederlands taalplatform en taalapp · Online Nederlandse les en bijles NT2, van A0 tot B2, in Rotterdam en online",
    switchTo: "Switch to English",
    superprof: "Vind me op Superprof",
    // lessons
    lessonsTitle: "Nederlandse les en bijles NT2, online en in Rotterdam: lessen en contact | Taal Studio",
    lessonsDescription: "Persoonlijke Nederlandse les en bijles NT2, online of in Rotterdam, met het Taal Studio-taalplatform: eigen leerpad, uitleg en oefeningen van A0 tot B2. Proefles mogelijk, 2e les gratis.",
    h1: "Nederlandse les en bijles NT2, online en in Rotterdam",
    lead: "Taal Studio is een Nederlands taalplatform met persoonlijke lessen. Je krijgt een eigen leerpad, heldere uitleg en oefeningen op jouw niveau, van A0 tot B2. Boek een proefles, dan krijg je de 2e les gratis.",
    signup: "Maak gratis een account aan",
    contactH2: "Plan een proefles of stel je vraag",
    contactIntro: "Stuur een bericht, dan hoor je snel van me. Boek je een proefles, dan krijg je de 2e les gratis.",
    meetH2: "Maak alvast kennis",
    meetText: `Bekijk <a href="${YOUTUBE}" rel="noopener" target="_blank">mijn video op YouTube</a>: wie ik ben en hoe ik les geef.`,
    howH2: "Zo werkt Taal Studio",
    how: [
      ["Je eigen leerpad", "Je docent zet de lessen die bij jou passen op je bord: wat je nu doet, je huiswerk en wat je al beheerst."],
      ["Heldere uitleg", "Bij elke les een korte uitleg, met één klik uitgebreid, plus de werkwoorden en woordenlijsten die erbij horen."],
      ["Direct oefenen", "Invullen in hele zinnen, werkwoorden vervoegen en flashcards per niveau, met directe feedback."],
      ["Persoonlijke les", "1-op-1 Nederlandse les of bijles, online of in Rotterdam, afgestemd op jouw doel."],
    ],
    whoH2: "Voor wie?",
    who: [
      "Iedereen die <strong>Nederlands als tweede taal (NT2)</strong> leert, van beginner (A0) tot B2.",
      "Voorbereiding op het <strong>inburgeringsexamen</strong> of het <strong>Staatsexamen NT2</strong>.",
      "Expats en professionals die snel en gestructureerd Nederlands willen leren.",
      "Wie naast een cursus <strong>bijles Nederlands</strong> zoekt om gericht te oefenen.",
    ],
    saysH2: "Wat leerlingen zeggen",
    rating: (n) => `5,0 uit ${n} reviews`,
    allReviews: "Lees alle reviews",
    faqH2: "Veelgestelde vragen",
    faq: [
      ["Kan ik een proefles doen?", "Ja. In de proefles maken we kennis en kijken we samen waar je staat en wat je wilt bereiken. Ga je daarna verder, dan krijg je de 2e les gratis."],
      ["Kan ik online Nederlandse les krijgen?", "Ja. Lessen zijn online of op locatie in Rotterdam. Tussen de lessen door oefen je in de Taal Studio-app."],
      ["Voor welke niveaus is Taal Studio?", "Van A0 (beginner) tot B2. Je leerpad past zich aan je niveau aan: je begint waar je staat."],
      ["Helpt Taal Studio bij de inburgering en het Staatsexamen NT2?", "Ja. Je oefent gericht met de onderwerpen die je voor het inburgeringsexamen of het Staatsexamen NT2 nodig hebt, en je docent stemt je leerpad daarop af."],
      ["Wat is het verschil met een gewone taalapp?", "In Taal Studio werk je met een eigen leerpad dat je docent voor je samenstelt, met uitleg, oefeningen en flashcards per onderwerp. Je combineert persoonlijke (bij)les met zelf oefenen."],
    ],
    ctaText: "<strong>Zin om te beginnen?</strong> Plan een proefles, dan kijken we samen naar je niveau en je doel. De 2e les is gratis.",
    ctaButton: "Neem contact op",
    serviceName: "Nederlandse les en bijles NT2",
    serviceDescription: "Persoonlijke Nederlandse les en bijles NT2, online en in Rotterdam, met een eigen leerpad, uitleg en oefeningen in de Taal Studio-app. Van A0 tot B2.",
    offer: "Proefles; de 2e les is gratis",
    // form
    form: {
      name: "Naam", email: "E-mailadres", level: "Je niveau", choose: "Kies…", dontKnow: "Weet ik niet", message: "Bericht",
      placeholder: "Bijvoorbeeld: ik wil een proefles, ik bereid me voor op het inburgeringsexamen.",
      send: "Versturen", sending: "Versturen…", missing: "Vul je naam, e-mailadres en bericht in.",
      sent: "Dank je wel! Je bericht is verstuurd. Je hoort snel van me.", failed: "Versturen lukte niet.",
      privacy: "Je gegevens gebruik ik alleen om je bericht te beantwoorden.",
    },
    // reviews
    reviewsTitle: "Reviews van leerlingen: Nederlandse les en bijles NT2 | Taal Studio",
    reviewsDescription: (n) => `5,0 uit ${n} reviews. Leerlingen over de Nederlandse lessen en bijles NT2 bij Taal Studio: geduldig, gestructureerd en persoonlijk.`,
    reviewsH1: "Reviews van leerlingen",
    reviewsLead: (n) => `5,0 uit ${n} reviews. Wat leerlingen zeggen over de Nederlandse lessen en bijles bij Taal Studio, in hun eigen woorden.`,
    student: "Leerling",
    reviewsCta: "<strong>Zelf ervaren?</strong> Boek een proefles: de 2e les krijg je gratis.",
    reviewsCtaButton: "Plan een proefles",
    // grammar
    grammar: "Grammatica",
    grammarIndexTitle: "Nederlandse grammatica uitgelegd (A0–B2) | Taal Studio",
    grammarIndexDescription: (n) => `Heldere uitleg van ${n} onderwerpen Nederlandse grammatica, per niveau van A0 tot B2. Voor NT2, inburgering en het Staatsexamen.`,
    grammarH1: "Nederlandse grammatica uitgelegd, van A0 tot B2",
    grammarLead: (n) => `Korte, heldere uitleg van ${n} onderwerpen uit de Nederlandse grammatica, spelling en uitspraak. Voor iedereen die Nederlands leert als tweede taal (NT2), voor de inburgering of het Staatsexamen NT2.`,
    level: "Niveau",
    grammarCta: "<strong>Oefenen op jouw niveau?</strong> In Taal Studio krijg je een eigen leerpad, de volledige uitleg en oefeningen met directe feedback.",
    toApp: "Naar Taal Studio",
    topicTitle: (t, lv) => `${t} – uitleg Nederlandse grammatica (${lv}) | Taal Studio`,
    topicCta: "<strong>Wil je dit echt onder de knie krijgen?</strong> In Taal Studio vind je de volledige uitleg, en oefen je met invullen, vervoegen en flashcards op jouw niveau.",
    topicButton: "Lees verder en oefen in Taal Studio",
    otherVersion: "In English",
    more: (lv) => `Meer grammatica op niveau ${lv}`,
    resourceType: "Grammatica-uitleg",
  },
  en: {
    locale: "en_GB",
    menuLessons: "Lessons &amp; contact",
    menuPlans: "Plans",
    plansAnchor: "plans",
    menuReviews: "Reviews",
    login: "Log in",
    footer: "Dutch language platform and app · Online Dutch lessons and NT2 tutoring, A0 to B2, in Rotterdam and online",
    switchTo: "Naar het Nederlands",
    superprof: "Find me on Superprof",
    lessonsTitle: "Dutch lessons and NT2 tutoring, online and in Rotterdam: lessons and contact | Taal Studio",
    lessonsDescription: "Personal Dutch lessons and NT2 tutoring, online or in Rotterdam, with the Taal Studio language platform: your own learning path, explanations and exercises from A0 to B2. Book a trial lesson, the 2nd lesson is free.",
    h1: "Dutch lessons and NT2 tutoring, online and in Rotterdam",
    lead: "Taal Studio is a Dutch language platform with personal lessons. You get your own learning path, clear explanations and exercises at your level, from A0 to B2. Book a trial lesson and your 2nd lesson is free.",
    signup: "Create a free account",
    contactH2: "Book a trial lesson or ask a question",
    contactIntro: "Send me a message and you will hear from me soon. Book a trial lesson and your 2nd lesson is free.",
    meetH2: "Get to know me",
    meetText: `Watch <a href="${YOUTUBE}" rel="noopener" target="_blank">my video on YouTube</a>: who I am and how I teach.`,
    howH2: "How Taal Studio works",
    how: [
      ["Your own learning path", "Your teacher puts the lessons that suit you on your board: what you are working on, your homework and what you already master."],
      ["Clear explanations", "A short explanation with every lesson, the full version one click away, plus the verbs and word lists that go with it."],
      ["Practise right away", "Fill in the gaps in whole sentences, conjugate verbs and use flashcards by level, with instant feedback."],
      ["Personal lessons", "1-to-1 Dutch lessons or tutoring, online or in Rotterdam, tailored to your goal."],
    ],
    whoH2: "Who is it for?",
    who: [
      "Anyone learning <strong>Dutch as a second language (NT2)</strong>, from beginner (A0) to B2.",
      "Preparing for the <strong>civic integration exam (inburgering)</strong> or the <strong>Staatsexamen NT2</strong>.",
      "Expats and professionals who want to learn Dutch quickly and in a structured way.",
      "Anyone looking for <strong>Dutch tutoring</strong> alongside a course, to practise what they need.",
    ],
    saysH2: "What students say",
    rating: (n) => `5.0 from ${n} reviews`,
    allReviews: "Read all reviews",
    faqH2: "Frequently asked questions",
    faq: [
      ["Can I book a trial lesson?", "Yes. In the trial lesson we get to know each other and look at where you are and what you want to achieve. If you continue, your 2nd lesson is free."],
      ["Can I take Dutch lessons online?", "Yes. Lessons are online or in person in Rotterdam. Between lessons you practise in the Taal Studio app."],
      ["Which levels is Taal Studio for?", "From A0 (beginner) to B2. Your learning path matches your level: you start where you are."],
      ["Does Taal Studio help with the inburgering exam and the Staatsexamen NT2?", "Yes. You practise the topics you need for the civic integration exam or the Staatsexamen NT2, and your teacher builds your learning path around it."],
      ["How is this different from a regular language app?", "In Taal Studio you work with a learning path your teacher puts together for you, with explanations, exercises and flashcards per topic. You combine personal lessons or tutoring with practising on your own."],
    ],
    ctaText: "<strong>Ready to start?</strong> Book a trial lesson and we will look at your level and your goal together. Your 2nd lesson is free.",
    ctaButton: "Get in touch",
    serviceName: "Dutch lessons and NT2 tutoring",
    serviceDescription: "Personal Dutch lessons and NT2 tutoring, online and in Rotterdam, with your own learning path, explanations and exercises in the Taal Studio app. From A0 to B2.",
    offer: "Trial lesson; the 2nd lesson is free",
    form: {
      name: "Name", email: "E-mail address", level: "Your level", choose: "Choose…", dontKnow: "I don't know", message: "Message",
      placeholder: "For example: I would like a trial lesson, I am preparing for the inburgering exam.",
      send: "Send", sending: "Sending…", missing: "Please fill in your name, e-mail address and message.",
      sent: "Thank you! Your message has been sent. You will hear from me soon.", failed: "Sending failed.",
      privacy: "I only use your details to answer your message.",
    },
    reviewsTitle: "Student reviews: Dutch lessons and NT2 tutoring | Taal Studio",
    reviewsDescription: (n) => `5.0 from ${n} reviews. Students on the Dutch lessons and NT2 tutoring at Taal Studio: patient, structured and personal.`,
    reviewsH1: "Student reviews",
    reviewsLead: (n) => `5.0 from ${n} reviews. What students say about the Dutch lessons and tutoring at Taal Studio, in their own words.`,
    student: "Student",
    reviewsCta: "<strong>Want to try it yourself?</strong> Book a trial lesson: your 2nd lesson is free.",
    reviewsCtaButton: "Book a trial lesson",
    grammar: "Grammar",
    grammarIndexTitle: "Dutch grammar explained (A0–B2) | Taal Studio",
    grammarIndexDescription: (n) => `Clear explanations of ${n} Dutch grammar topics, by level from A0 to B2. For NT2 learners, the inburgering exam and the Staatsexamen.`,
    grammarH1: "Dutch grammar explained, from A0 to B2",
    grammarLead: (n) => `Short, clear explanations of ${n} topics in Dutch grammar, spelling and pronunciation. For anyone learning Dutch as a second language (NT2), for the inburgering exam or the Staatsexamen NT2.`,
    level: "Level",
    grammarCta: "<strong>Practise at your level?</strong> In Taal Studio you get your own learning path, the full explanations and exercises with instant feedback.",
    toApp: "Go to Taal Studio",
    topicTitle: (t, lv) => `${t} – Dutch grammar explained (${lv}) | Taal Studio`,
    topicCta: "<strong>Want to really master this?</strong> In Taal Studio you find the full explanation and practise with fill-in exercises, conjugation and flashcards at your level.",
    topicButton: "Read on and practise in Taal Studio",
    otherVersion: "In het Nederlands",
    more: (lv) => `More grammar at level ${lv}`,
    resourceType: "Grammar explanation",
  },
};

const LANG_SCRIPT = `<script>document.querySelectorAll("[data-lang]").forEach(function(a){a.addEventListener("click",function(){try{localStorage.setItem("nts-lang",a.dataset.lang)}catch(e){}})})</script>`;

function page({ lang, title, description, path: here, alt, body, jsonLd }) {
  const L = T[lang];
  const canonical = SITE + here;
  const alternates = alt
    ? `<link rel="alternate" hreflang="${lang}" href="${canonical}" />
<link rel="alternate" hreflang="${other(lang)}" href="${SITE + alt}" />
<link rel="alternate" hreflang="x-default" href="${SITE + (lang === "nl" ? here : alt)}" />`
    : "";
  const switcher = `<span class="langs" role="group" aria-label="Taal / Language">${["nl", "en"]
    .map((l) => (l === lang ? `<a aria-current="true" href="${here}" data-lang="${l}">${l.toUpperCase()}</a>` : `<a href="${alt || PATHS[l].lessons}" hreflang="${l}" lang="${l}" data-lang="${l}" title="${T[lang].switchTo}">${l.toUpperCase()}</a>`))
    .join("")}</span>`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${canonical}" />
${alternates}
<link rel="icon" type="image/svg+xml" href="/logo-icon.svg?v=4" />
<link rel="apple-touch-icon" href="/logo-icon-180.png?v=4" />
<meta name="theme-color" content="#0f1115" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Taal Studio" />
<meta property="og:locale" content="${L.locale}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${SITE}/og-image.jpg?v=2" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<style>${CSS}</style>
${jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`).join("\n")}
</head>
<body>
<div class="wrap">
<header class="site">
  <a class="brand" href="/"><img src="/logo-icon.svg?v=4" alt="" width="34" height="34" />Taal Studio</a>
  <nav class="menu"><a href="${PATHS[lang].lessons}">${L.menuLessons}</a><a href="${PATHS[lang].lessons}#${L.plansAnchor}">${L.menuPlans}</a><a href="${PATHS[lang].reviews}">${L.menuReviews}</a>${switcher}<a class="btn ghost" href="/">${L.login}</a></nav>
</header>
${body}
<footer class="site">
  <p><a href="/">Taal Studio</a> · ${L.footer} · <a href="${PATHS[lang].lessons}">${L.menuLessons}</a> · <a href="${PATHS[lang].lessons}#${L.plansAnchor}">${L.menuPlans}</a> · <a href="${PATHS[lang].reviews}">${L.menuReviews}</a> · <a href="${SUPERPROF}" rel="noopener" target="_blank">${L.superprof}</a></p>
</footer>
</div>
${LANG_SCRIPT}
</body>
</html>
`;
}

const breadcrumbs = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
});

/** A topic in a language: its texts, or null when that language is missing. */
function inLang(t, lang) {
  if (lang === "nl") return { title: t.title, summary: t.summary, short: t.short, otherTitle: t.title_en, otherSummary: t.summary_en, otherShort: t.short_en };
  if (!t.title_en || !t.short_en) return null;
  return { title: t.title_en, summary: t.summary_en, short: t.short_en, otherTitle: t.title, otherSummary: t.summary, otherShort: t.short };
}

function topicPage(t, all, lang) {
  const L = T[lang];
  const c = inLang(t, lang);
  const level = levelOf(t);
  const here = `${PATHS[lang].grammar}${t.slug}/`;
  const alt = inLang(t, other(lang)) ? `${PATHS[other(lang)].grammar}${t.slug}/` : null;
  const description = (c.summary || plain(c.short)).slice(0, 155);
  const related = all.filter((o) => o.slug !== t.slug && levelOf(o) === level && inLang(o, lang)).slice(0, 6);
  const body = `
<nav class="crumbs"><a href="/">Taal Studio</a> › <a href="${PATHS[lang].grammar}">${L.grammar}</a> › ${esc(c.title)}</nav>
<article>
  <h1>${esc(c.title)}</h1>
  <p><span class="badge">${level}</span>${c.otherTitle ? `<span lang="${other(lang)}" style="color:var(--dim)">${esc(c.otherTitle)}</span>` : ""}</p>
  ${c.summary ? `<p class="lead">${esc(c.summary)}</p>` : ""}
  <div class="rich">${richHtml(c.short)}</div>
  <div class="cta">
    <p>${L.topicCta}</p>
    <a class="btn" href="/bibliotheek/grammatica/${encodeURIComponent(t.slug)}">${L.topicButton}</a>
  </div>
  ${
    c.otherShort
      ? `<details class="en" lang="${other(lang)}"><summary>${L.otherVersion}: ${esc(c.otherTitle || c.title)}</summary>${c.otherSummary ? `<p>${esc(c.otherSummary)}</p>` : ""}<div class="rich">${richHtml(c.otherShort)}</div></details>`
      : ""
  }
</article>
${related.length ? `<h2>${L.more(level)}</h2><ul class="topics">${related.map((o) => `<li><a href="${PATHS[lang].grammar}${o.slug}/"><strong>${esc(inLang(o, lang).title)}</strong><span>${esc(inLang(o, lang).summary || "")}</span></a></li>`).join("")}</ul>` : ""}
`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: c.title,
      headline: c.title,
      description,
      url: SITE + here,
      inLanguage: lang,
      educationalLevel: level,
      learningResourceType: L.resourceType,
      teaches: t.title,
      isAccessibleForFree: true,
      dateModified: t.updated_at,
      isPartOf: { "@type": "WebSite", name: "Taal Studio", url: `${SITE}/` },
      provider: { "@type": "EducationalOrganization", name: "Taal Studio", url: `${SITE}/` },
    },
    breadcrumbs([["Taal Studio", `${SITE}/`], [L.grammar, SITE + PATHS[lang].grammar], [c.title, SITE + here]]),
  ];
  return page({ lang, title: L.topicTitle(c.title, level), description, path: here, alt, body, jsonLd });
}

function indexPage(all, lang) {
  const L = T[lang];
  const list = all.filter((t) => inLang(t, lang));
  const byLevel = LEVELS.map((lv) => [lv, list.filter((t) => levelOf(t) === lv)]).filter(([, ts]) => ts.length);
  const here = PATHS[lang].grammar;
  const body = `
<nav class="crumbs"><a href="/">Taal Studio</a> › ${L.grammar}</nav>
<h1>${L.grammarH1}</h1>
<p class="lead">${L.grammarLead(list.length)}</p>
${byLevel.map(([lv, ts]) => `<h2>${L.level} ${lv}</h2><ul class="topics">${ts.map((t) => `<li><a href="${here}${t.slug}/"><strong>${esc(inLang(t, lang).title)}</strong><span>${esc(inLang(t, lang).summary || "")}</span></a></li>`).join("")}</ul>`).join("\n")}
<div class="cta">
  <p>${L.grammarCta}</p>
  <a class="btn" href="/">${L.toApp}</a>
</div>
`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: L.grammarH1,
      url: SITE + here,
      inLanguage: lang,
      hasPart: list.map((t) => ({ "@type": "LearningResource", name: inLang(t, lang).title, url: `${SITE}${here}${t.slug}/`, educationalLevel: levelOf(t) })),
    },
    breadcrumbs([["Taal Studio", `${SITE}/`], [L.grammar, SITE + here]]),
  ];
  return page({ lang, title: L.grammarIndexTitle, description: L.grammarIndexDescription(list.length), path: here, alt: PATHS[other(lang)].grammar, body, jsonLd });
}

/** All students' recommendations, word for word, in their own language, first names only. */
const ALL_REVIEWS = [
  { name: "Bence", lang: "en", text: "Perfect! Emma offers fun and personalized lessons. She’s attentive to my needs and improves her methods using my feedback." },
  { name: "Ana Catalina", lang: "en", text: "Together with Emma I was able to take my dutch from A0 to A2 in one month as preparation for my Inburgeringsexamen. She’s an amazing teacher, very structured, patient and kind. Great in both online and in-person lessons. She has many kinds of interactive materials for learning which makes it very easy to follow and don’t get overwhelmed with a new language." },
  { name: null, lang: "nl", text: "Ik heb veel van Emma geleerd. Mijn gesprek vaardigheden zijn enorm verbeterd." },
  { name: "Mason", lang: "en", text: "With Emma’s help, I have been able to quickly progress my Dutch learning and begin passing my NT2 exams. We throughly covered all the necessary grammer topics at my own pace, slowing down when I needed more time. She is able to give good explanations of these topics. Emma provides good feedback on which areas need improvement. I definitely recommend Emma for your Dutch lessons!" },
  { name: "Isaac", lang: "en", text: "Emma has a very patient and structured teaching style. She takes time to understand your level, explains concepts in simple terms, and uses practical examples that make the lessons easy to follow. I especially appreciated how she adapted her approach to fit my pace and made sure I was confident before moving on." },
  { name: "Lara", lang: "nl", text: "Met Emma wandel ik altijd in het park. Over het afgelopen jaar heeft zij mij enorm geholpen met Nederlands praten. Inmiddels geniet ik van onze Nederlandse gesprekken en verheug ik me buiten het park steeds meer Nederlands te praten. Met Emma is het altijd gezellig en ze is super geduldig." },
  { name: "Marija", lang: "en", text: "With Emma learning Dutch is a lot of fun. She is very patient and explains concepts in an easy manner. From time to time she sends me fun songs and video’s that help out with the homework I have. On whatsapp she also sends me voice fragments of things I am having difficulty pronouncing. Her approach is just great and her online board is very clear and gives a great overview." },
];

function reviewsPage(lang) {
  const L = T[lang];
  const here = PATHS[lang].reviews;
  const colours = ["#4f9cf9", "#2fd27a", "#f08c3c"];
  const body = `
<nav class="crumbs"><a href="/">Taal Studio</a> › Reviews</nav>
<h1>${L.reviewsH1}</h1>
<p class="lead"><span class="stars">★★★★★</span> ${L.reviewsLead(ALL_REVIEWS.length)}</p>
<p><a href="${SUPERPROF}" rel="noopener" target="_blank">${L.superprof}</a></p>
<div class="reviews">
${ALL_REVIEWS.map((r, i) => {
    const name = r.name ?? L.student;
    return `  <blockquote lang="${r.lang}">
    <div class="who"><span class="avatar" style="background:${colours[i % 3]}">${esc(name[0])}</span><span><strong>${esc(name)}</strong><br /><span class="stars">★★★★★</span></span></div>
    <p>${esc(r.text)}</p>
  </blockquote>`;
  }).join("\n")}
</div>
<div class="cta">
  <p>${L.reviewsCta}</p>
  <a class="btn" href="${PATHS[lang].lessons}#contact">${L.reviewsCtaButton}</a>
</div>
`;
  return page({
    lang,
    title: L.reviewsTitle,
    description: L.reviewsDescription(ALL_REVIEWS.length),
    path: here,
    alt: PATHS[other(lang)].reviews,
    body,
    jsonLd: [breadcrumbs([["Taal Studio", `${SITE}/`], ["Reviews", SITE + here]])],
  });
}

/** The plans of the app, from the same list as the app's Mijn abonnement page. */
function plansSection(lang) {
  const P = PLAN_TEXT[lang];
  const card = (o) => `  <div class="card plan${o.featured ? " featured" : ""}">
    <h3>Taal Studio ${esc(P.name[o.id])}</h3>
    <p>${esc(P.tagline[o.id])}</p>
    <p class="price"><strong>${P.price(o.price)}</strong> ${esc(P.perMonth)}</p>
${o.freeWithLessons ? `    <p class="deal">${esc(P.freeWith(o.freeWithLessons))} · ${esc(P.viaDocent)}</p>\n` : ""}    <ul>
${PLAN_FEATURES.map((f) => `      <li${o.features.includes(f) ? "" : ' class="off"'}>${esc(P.feature[f])}</li>`).join("\n")}
    </ul>
  </div>`;
  return `<h2 id="${T[lang].plansAnchor}">${esc(P.title)}</h2>
<p>${esc(P.intro)}</p>
<div class="grid plans">
${PLAN_OFFERS.map(card).join("\n")}
</div>`;
}

/** The contact form (mails the docent through the `contact` edge function). */
function contactForm(lang) {
  const F = T[lang].form;
  const endpoint = hosted ? `${SUPABASE_URL}/functions/v1/contact` : "";
  return `
<form class="contact" id="contact-form" novalidate>
  <label>${F.name}<input name="name" autocomplete="name" required maxlength="100" /></label>
  <label>${F.email}<input name="email" type="email" autocomplete="email" required maxlength="200" /></label>
  <label>${F.level}
    <select name="level">
      <option value="">${F.choose}</option>
      <option>A0</option><option>A1</option><option>A2</option><option>B1</option><option>B2</option>
      <option value="weet ik niet">${F.dontKnow}</option>
    </select>
  </label>
  <label>${F.message}<textarea name="message" required maxlength="3000" placeholder="${esc(F.placeholder)}"></textarea></label>
  <input type="hidden" name="lang" value="${lang}" />
  <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off" /></label>
  <button class="btn" type="submit">${F.send}</button>
  <div id="status" role="status" aria-live="polite"></div>
</form>
<p class="note">${F.privacy}</p>
<script>
(() => {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("status");
  const endpoint = ${JSON.stringify(endpoint)};
  const key = ${JSON.stringify(hosted ? SUPABASE_KEY : "")};
  const F = ${JSON.stringify({ sending: F.sending, missing: F.missing, sent: F.sent, failed: F.failed })};
  const show = (cls, text) => { status.className = "msg " + cls; status.textContent = text; };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!data.name || !data.email || !data.message) return show("err", F.missing);
    const button = form.querySelector("button");
    button.disabled = true;
    show("", F.sending);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", apikey: key }, body: JSON.stringify(data) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.sent) throw new Error(out.error || F.failed);
      form.reset();
      show("ok", F.sent);
    } catch (err) {
      show("err", err.message);
    } finally {
      button.disabled = false;
    }
  });
})();
</script>`;
}

function lessonsPage(lang) {
  const L = T[lang];
  const here = PATHS[lang].lessons;
  const body = `
<section class="hero">
  <h1>${L.h1}</h1>
  <p class="lead">${L.lead}</p>
  <div class="actions"><a class="btn" href="/" data-lang="${lang}">${L.signup}</a><a class="btn ghost" href="/" data-lang="${lang}">${L.login}</a></div>
</section>

<section id="contact">
  <h2>${L.contactH2}</h2>
  <p>${L.contactIntro}</p>
  ${contactForm(lang)}
</section>

<h2>${L.meetH2}</h2>
<a class="yt" href="${YOUTUBE}" rel="noopener" target="_blank">
  <img src="${YOUTUBE_THUMB}" alt="Video: Do you want to learn Dutch?" width="480" height="360" loading="lazy" />
  <span class="play" aria-hidden="true">▶</span>
</a>
<p>${L.meetText}</p>

<h2>${L.howH2}</h2>
<div class="grid">
${L.how.map(([h, p]) => `  <div class="card"><h3>${h}</h3><p>${p}</p></div>`).join("\n")}
</div>

${plansSection(lang)}

<h2>${L.whoH2}</h2>
<ul>
${L.who.map((w) => `  <li>${w}</li>`).join("\n")}
</ul>

<h2>${L.saysH2}</h2>
<p><span class="stars">★★★★★</span> ${L.rating(ALL_REVIEWS.length)} · <a href="${PATHS[lang].reviews}">${L.allReviews}</a> · <a href="${SUPERPROF}" rel="noopener" target="_blank">${L.superprof}</a></p>

<h2>${L.faqH2}</h2>
<div class="faq">
${L.faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("\n")}
</div>

<div class="cta">
  <p>${L.ctaText}</p>
  <a class="btn" href="#contact">${L.ctaButton}</a>
</div>
`;
  const url = SITE + here;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: L.serviceName,
      serviceType: L.serviceName,
      description: L.serviceDescription,
      url,
      inLanguage: lang,
      areaServed: [{ "@type": "City", name: "Rotterdam" }, { "@type": "Country", name: "Nederland" }],
      provider: { "@type": "EducationalOrganization", "@id": `${SITE}/#org`, name: "Taal Studio", url: `${SITE}/` },
      offers: { "@type": "Offer", description: L.offer },
    },
    { "@context": "https://schema.org", "@type": "ContactPage", name: L.lessonsTitle, url, about: { "@id": `${SITE}/#org` } },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: lang,
      mainEntity: L.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
    breadcrumbs([["Taal Studio", `${SITE}/`], [L.serviceName, url]]),
  ];
  return page({ lang, title: L.lessonsTitle, description: L.lessonsDescription, path: here, alt: PATHS[other(lang)].lessons, body, jsonLd });
}

const write = (rel, content) => {
  const file = path.join(DIST, rel.replace(/^\//, ""));
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
};

if (!existsSync(DIST)) throw new Error("build-seo: run vite build first (no dist/)");
const topics = (await loadTopics()).filter((t) => t.slug && /^[a-z0-9-]+$/.test(t.slug));

const today = new Date().toISOString().slice(0, 10);
const urls = [{ loc: `${SITE}/`, lastmod: today, priority: "1.0" }];
const add = (p, priority, lastmod = today) => urls.push({ loc: SITE + p, lastmod, priority });
let grammarPages = 0;

for (const lang of ["nl", "en"]) {
  write(`${PATHS[lang].lessons}index.html`, lessonsPage(lang));
  add(PATHS[lang].lessons, "0.9");
  write(`${PATHS[lang].reviews}index.html`, reviewsPage(lang));
  add(PATHS[lang].reviews, "0.6");
  if (topics.length) {
    write(`${PATHS[lang].grammar}index.html`, indexPage(topics, lang));
    add(PATHS[lang].grammar, "0.7");
    for (const t of topics) {
      if (!inLang(t, lang)) continue;
      write(`${PATHS[lang].grammar}${t.slug}/index.html`, topicPage(t, topics, lang));
      add(`${PATHS[lang].grammar}${t.slug}/`, "0.6", (t.updated_at || today).slice(0, 10));
      grammarPages++;
    }
  }
}

write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`,
);

write(
  "robots.txt",
  `# Taal Studio. The home page and the public pages are open; the app behind the login is not.
User-agent: *
Allow: /
${PRIVATE.map((p) => `Disallow: ${p}`).join("\n")}

Sitemap: ${SITE}/sitemap.xml
`,
);

console.log(`build-seo: lessons & contact and reviews in NL and EN, ${grammarPages} grammar pages, sitemap with ${urls.length} URLs, robots.txt`);
