/**
 * The tabs of the Bibliotheek (Library). Each tab keeps its old page id, so
 * existing deep links such as ?page=topics&topic=… still open the right tab.
 */
export const LIBRARY_TABS = [{ id: "words" }, { id: "verbs" }, { id: "sentences" }, { id: "topics" }, { id: "exercises" }, { id: "sets" }];

export const LIBRARY_TAB_IDS = new Set(LIBRARY_TABS.map((t) => t.id));
