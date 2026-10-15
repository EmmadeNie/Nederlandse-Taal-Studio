/** Load all content from the database into src/data (see setContent there). */
import { supabase } from "../lib/supabase";
import { setContent, setHiddenSentences, setVocabularies } from "./index";

const PAGE = 1000; // PostgREST returns at most this many rows per request

async function all(table, columns) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

export async function loadContent() {
  const [items, setRows, vocab] = await Promise.all([
    all("content_items", "id, type, data"),
    all("sets", "id, type, title, level, item_ids"),
    all("vocabularies", "id, kind, value"),
  ]);
  setVocabularies(vocab);
  setContent(items, setRows);
  // Flagged "weghalen": out of the exercises (a failure here only means nothing is hidden).
  const hidden = await supabase.rpc("hidden_sentence_ids");
  if (!hidden.error) setHiddenSentences(hidden.data.map((r) => (typeof r === "string" ? r : r.hidden_sentence_ids)));
}
