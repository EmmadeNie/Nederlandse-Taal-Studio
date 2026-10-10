/**
 * Paths of the app. Internal page ids stay English (they are also used as
 * translation keys); the paths people see and share are Dutch.
 *
 *   /leerpad                         my leerpad (students)
 *   /dashboard
 *   /lesprogramma
 *   /leerpaden, /leerpaden/<leerling>
 *   /bibliotheek/<tab>, /bibliotheek/grammatica/<onderwerp>
 *   /feedback, /gebruikers
 *
 * Filters stay in the query string, e.g. /bibliotheek/zinnen?level=A2.
 */

export const PATHS = {
  leerpad: "/leerpad",
  dashboard: "/dashboard",
  lesprogramma: "/lesprogramma",
  leerpaden: "/leerpaden",
  words: "/bibliotheek/woorden",
  verbs: "/bibliotheek/werkwoorden",
  sentences: "/bibliotheek/zinnen",
  topics: "/bibliotheek/grammatica",
  exercises: "/bibliotheek/oefeningen",
  sets: "/bibliotheek/sets",
  feedback: "/feedback",
  users: "/gebruikers",
};

const PAGE_BY_PATH = Object.fromEntries(Object.entries(PATHS).map(([page, path]) => [path, page]));

/**
 * "/bibliotheek/grammatica/perfectum" → { page: "topics", param: "perfectum" }.
 * Returns null for "/" and unknown paths.
 */
export function resolvePath(pathname) {
  const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts.length === 0) return null;
  if (parts[0] === "bibliotheek") {
    if (parts.length === 1) return { page: "words", param: null };
    const page = PAGE_BY_PATH[`/bibliotheek/${parts[1]}`];
    return page ? { page, param: parts[2] ?? null } : null;
  }
  const page = PAGE_BY_PATH[`/${parts[0]}`];
  return page ? { page, param: parts[1] ?? null } : null;
}

export function pathFor(page, param) {
  const base = PATHS[page] || "/";
  return param ? `${base}/${encodeURIComponent(param)}` : base;
}

/** Grammar topics have ids like "topic.perfectum"; their path uses "perfectum". */
export const topicSlug = (topicId) => topicId.replace(/^topic\./, "");
export const topicIdFromSlug = (slug) => `topic.${slug}`;

/** "Dimitrios Papadópoulos" → "dimitrios-papadopoulos" */
export function slugify(text) {
  return (text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Old links used ?page=…; turn them into paths once at startup so links on
 * Trello cards keep working. ?page=topics&topic=topic.x → /bibliotheek/grammatica/x
 */
export function migrateLegacyUrl() {
  const url = new URL(window.location.href);
  const page = url.searchParams.get("page");
  if (!page) return;
  let path = page === "library" ? PATHS.words : PATHS[page] || "/";
  const topic = url.searchParams.get("topic");
  if (page === "topics" && topic) path = pathFor("topics", topicSlug(topic));
  url.searchParams.delete("page");
  url.searchParams.delete("topic");
  // ?student=<id> keeps working as a query param; the leerpaden page understands both.
  const qs = url.searchParams.toString();
  window.history.replaceState(null, "", path + (qs ? `?${qs}` : "") + url.hash);
}
