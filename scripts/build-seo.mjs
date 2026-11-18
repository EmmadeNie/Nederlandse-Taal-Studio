#!/usr/bin/env node
/**
 * Runs after `vite build`: writes the pages search engines can read.
 *
 *   dist/grammatica/index.html            all grammar topics, by level
 *   dist/grammatica/<slug>/index.html     one topic: title, summary and the short
 *                                         explanation (the full one and the exercises
 *                                         stay in the app, behind the login)
 *   dist/sitemap.xml, dist/robots.txt
 *
 * The topics come from the public_topics() function in Supabase (anon key, the
 * same env vars as the app). SEO_TOPICS_JSON=<file> uses a saved list instead.
 * Without either, only robots.txt and the sitemap of the home page are written:
 * the build never fails over SEO.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { marked } from "marked";

const SITE = "https://mijntaalstudio.nl";
const DIST = path.resolve("dist");
const LEVELS = ["A0", "A1", "A2", "B1", "B2"];

/** The app's paths behind the login: not for search engines. */
const PRIVATE = ["/leerpad", "/dashboard", "/lesprogramma", "/leerpaden", "/bibliotheek", "/feedback", "/flashcards", "/nakijken", "/voorstellen", "/gebruikers"];

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

async function loadTopics() {
  if (process.env.SEO_TOPICS_JSON) return JSON.parse(readFileSync(process.env.SEO_TOPICS_JSON, "utf8"));
  const env = { ...readEnvFile(".env.local"), ...readEnvFile(".env.production.local"), ...process.env };
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("127.0.0.1") || url.includes("localhost")) {
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
.brand{display:flex;align-items:center;gap:.6rem;color:var(--text);text-decoration:none;font-weight:800;font-size:1.15rem}
.brand img{width:34px;height:34px}
.btn{display:inline-block;padding:.6rem 1rem;border-radius:10px;background:var(--accent);color:#0b0d11;font-weight:700;text-decoration:none}
.btn.ghost{background:transparent;color:var(--text);border:1px solid var(--border)}
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

function page({ title, description, canonical, body, jsonLd }) {
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${canonical}" />
<link rel="icon" type="image/svg+xml" href="/logo-icon.svg?v=4" />
<link rel="apple-touch-icon" href="/logo-icon-180.png?v=4" />
<meta name="theme-color" content="#0f1115" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="Taal Studio" />
<meta property="og:locale" content="nl_NL" />
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
  <a class="btn ghost" href="/">Inloggen</a>
</header>
${body}
<footer class="site">
  <p><a href="/">Taal Studio</a> · Nederlands leren op jouw niveau, van A0 tot B2 · NT2-lessen in Rotterdam en online · <a href="/grammatica/">Alle grammatica-uitleg</a></p>
</footer>
</div>
</body>
</html>
`;
}

const breadcrumbs = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
});

function topicPage(t, all) {
  const level = levelOf(t);
  const url = `${SITE}/grammatica/${t.slug}/`;
  const title = `${t.title} – uitleg Nederlandse grammatica (${level}) | Taal Studio`;
  const description = (t.summary || plain(t.short)).slice(0, 155);
  const related = all.filter((o) => o.slug !== t.slug && levelOf(o) === level).slice(0, 6);
  const body = `
<nav class="crumbs"><a href="/">Taal Studio</a> › <a href="/grammatica/">Grammatica</a> › ${esc(t.title)}</nav>
<article>
  <h1>${esc(t.title)}</h1>
  <p><span class="badge">${level}</span>${t.title_en ? `<span lang="en" style="color:var(--dim)">${esc(t.title_en)}</span>` : ""}</p>
  ${t.summary ? `<p class="lead">${esc(t.summary)}</p>` : ""}
  <div class="rich">${richHtml(t.short)}</div>
  <div class="cta">
    <p><strong>Wil je dit echt onder de knie krijgen?</strong> In Taal Studio vind je de volledige uitleg, en oefen je met invullen, vervoegen en flashcards op jouw niveau.</p>
    <a class="btn" href="/bibliotheek/grammatica/${encodeURIComponent(t.slug)}">Lees verder en oefen in Taal Studio</a>
  </div>
  ${
    t.short_en
      ? `<details class="en" lang="en"><summary>In English: ${esc(t.title_en || t.title)}</summary>${t.summary_en ? `<p>${esc(t.summary_en)}</p>` : ""}<div class="rich">${richHtml(t.short_en)}</div></details>`
      : ""
  }
</article>
${related.length ? `<h2>Meer grammatica op niveau ${level}</h2><ul class="topics">${related.map((o) => `<li><a href="/grammatica/${o.slug}/"><strong>${esc(o.title)}</strong><span>${esc(o.summary || "")}</span></a></li>`).join("")}</ul>` : ""}
`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: t.title,
      headline: t.title,
      description,
      url,
      inLanguage: "nl",
      educationalLevel: level,
      learningResourceType: "Grammatica-uitleg",
      teaches: t.title,
      isAccessibleForFree: true,
      dateModified: t.updated_at,
      isPartOf: { "@type": "WebSite", name: "Taal Studio", url: `${SITE}/` },
      provider: { "@type": "EducationalOrganization", name: "Taal Studio", url: `${SITE}/` },
    },
    breadcrumbs([["Taal Studio", `${SITE}/`], ["Grammatica", `${SITE}/grammatica/`], [t.title, url]]),
  ];
  return page({ title, description, canonical: url, body, jsonLd });
}

function indexPage(all) {
  const url = `${SITE}/grammatica/`;
  const byLevel = LEVELS.map((lv) => [lv, all.filter((t) => levelOf(t) === lv)]).filter(([, ts]) => ts.length);
  const body = `
<nav class="crumbs"><a href="/">Taal Studio</a> › Grammatica</nav>
<h1>Nederlandse grammatica uitgelegd, van A0 tot B2</h1>
<p class="lead">Korte, heldere uitleg van ${all.length} onderwerpen uit de Nederlandse grammatica, spelling en uitspraak. Voor iedereen die Nederlands leert als tweede taal (NT2), voor de inburgering of het Staatsexamen NT2.</p>
${byLevel.map(([lv, ts]) => `<h2>Niveau ${lv}</h2><ul class="topics">${ts.map((t) => `<li><a href="/grammatica/${t.slug}/"><strong>${esc(t.title)}</strong><span>${esc(t.summary || "")}</span></a></li>`).join("")}</ul>`).join("\n")}
<div class="cta">
  <p><strong>Oefenen op jouw niveau?</strong> In Taal Studio krijg je een eigen leerpad, de volledige uitleg en oefeningen met directe feedback.</p>
  <a class="btn" href="/">Naar Taal Studio</a>
</div>
`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Nederlandse grammatica uitgelegd (A0–B2)",
      url,
      inLanguage: "nl",
      hasPart: all.map((t) => ({ "@type": "LearningResource", name: t.title, url: `${SITE}/grammatica/${t.slug}/`, educationalLevel: levelOf(t) })),
    },
    breadcrumbs([["Taal Studio", `${SITE}/`], ["Grammatica", url]]),
  ];
  return page({
    title: "Nederlandse grammatica uitgelegd (A0–B2) | Taal Studio",
    description: `Heldere uitleg van ${all.length} onderwerpen Nederlandse grammatica, per niveau van A0 tot B2. Voor NT2, inburgering en het Staatsexamen.`,
    canonical: url,
    body,
    jsonLd,
  });
}

const write = (rel, content) => {
  const file = path.join(DIST, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
};

if (!existsSync(DIST)) throw new Error("build-seo: run vite build first (no dist/)");
const topics = (await loadTopics()).filter((t) => t.slug && /^[a-z0-9-]+$/.test(t.slug));

const today = new Date().toISOString().slice(0, 10);
const urls = [{ loc: `${SITE}/`, lastmod: today, priority: "1.0" }];
if (topics.length) {
  write("grammatica/index.html", indexPage(topics));
  urls.push({ loc: `${SITE}/grammatica/`, lastmod: today, priority: "0.9" });
  for (const t of topics) {
    write(`grammatica/${t.slug}/index.html`, topicPage(t, topics));
    urls.push({ loc: `${SITE}/grammatica/${t.slug}/`, lastmod: (t.updated_at || today).slice(0, 10), priority: "0.7" });
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
  `# Taal Studio. The home page and the grammar pages are public; the app behind the login is not.
User-agent: *
Allow: /
${PRIVATE.map((p) => `Disallow: ${p}`).join("\n")}

Sitemap: ${SITE}/sitemap.xml
`,
);

console.log(`build-seo: ${topics.length} grammar pages, sitemap with ${urls.length} URLs, robots.txt`);
