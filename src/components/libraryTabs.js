/**
 * The tabs of the Bibliotheek (Library). Each tab keeps its old page id, so
 * existing deep links such as ?page=topics&topic=… still open the right tab.
 */
export const LIBRARY_TABS = [
  { id: "words", icon: "📖" },
  { id: "verbs", icon: "🔄" },
  { id: "sentences", icon: "💬" },
  { id: "topics", icon: "📐" },
  { id: "exercises", icon: "✏️" },
];

export const LIBRARY_TAB_IDS = new Set(LIBRARY_TABS.map((t) => t.id));
