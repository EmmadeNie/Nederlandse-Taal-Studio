/** Load all content from the database into src/data (see setContent there). */
import { supabase } from "../lib/supabase";
import { setContent } from "./index";

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
  const [items, setRows] = await Promise.all([
    all("content_items", "id, type, data"),
    all("sets", "id, type, title, level, item_ids"),
  ]);
  setContent(items, setRows);
}
