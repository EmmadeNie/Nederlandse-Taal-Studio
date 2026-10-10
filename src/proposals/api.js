/** Proposals in the database, and the content export for ChatGPT. */
import { supabase } from "../lib/supabase";
import { touchedIds } from "./changeset";
import { GRAMMAR_TAGS, TAGS, THEMES } from "../data";

const FIELDS = "id, title, summary, changes, decisions, status, created_at";

function check({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

export const listProposals = () =>
  supabase.from("content_proposals").select(FIELDS).order("created_at", { ascending: false }).then(check);

export const countOpenProposals = () =>
  supabase
    .from("content_proposals")
    .select("id", { count: "exact", head: true })
    .eq("status", "open")
    .then(({ count, error }) => {
      if (error) throw new Error(error.message);
      return count || 0;
    });

export const createProposal = ({ title, summary, changes }) =>
  supabase.from("content_proposals").insert({ title, summary, changes }).select(FIELDS).single().then(check);

/** Record the verdict on change `index`; the proposal is done when every change has one. */
export async function saveDecision(proposal, index, decision) {
  const decisions = { ...proposal.decisions, [index]: { ...decision, at: new Date().toISOString() } };
  const status = proposal.changes.every((_, i) => decisions[i]) ? "done" : "open";
  return supabase
    .from("content_proposals")
    .update({ decisions, status, updated_at: new Date().toISOString() })
    .eq("id", proposal.id)
    .select(FIELDS)
    .single()
    .then(check);
}

/** Undo a rejection so the change can be reviewed again. */
export async function clearDecision(proposal, index) {
  // eslint-disable-next-line no-unused-vars -- drop this one
  const { [index]: _, ...decisions } = proposal.decisions || {};
  return supabase
    .from("content_proposals")
    .update({ decisions, status: "open", updated_at: new Date().toISOString() })
    .eq("id", proposal.id)
    .select(FIELDS)
    .single()
    .then(check);
}

export const deleteProposal = (id) => supabase.from("content_proposals").delete().eq("id", id).then(check);

/** Current versions (updated_at) of everything a proposal touches: { "word.x": "…", "set:id": "…" }. */
export async function fetchVersions(changes) {
  const items = [...new Set(changes.flatMap((c) => touchedIds(c).items))];
  const sets = [...new Set(changes.flatMap((c) => touchedIds(c).sets))];
  const versions = {};
  if (items.length) {
    const rows = await supabase.from("content_items").select("id, updated_at").in("id", items).then(check);
    rows.forEach((r) => (versions[r.id] = r.updated_at));
  }
  if (sets.length) {
    const rows = await supabase.from("sets").select("id, updated_at").in("id", sets).then(check);
    rows.forEach((r) => (versions[`set:${r.id}`] = r.updated_at));
  }
  return versions;
}

/**
 * All content as one JSON file for ChatGPT: items with their fields and
 * updatedAt (the baseVersion for a change), and the sets.
 */
export async function exportContent() {
  const all = async (table, columns) => {
    const out = [];
    for (let from = 0; ; from += 1000) {
      const rows = await supabase.from(table).select(columns).order("id").range(from, from + 999).then(check);
      out.push(...rows);
      if (rows.length < 1000) return out;
    }
  };
  const [items, sets] = await Promise.all([
    all("content_items", "id, type, data, updated_at"),
    all("sets", "id, type, title, level, item_ids, updated_at"),
  ]);
  const byType = (type) =>
    items.filter((r) => r.type === type).map((r) => ({ id: r.id, updatedAt: r.updated_at, ...r.data }));
  return {
    exportedAt: new Date().toISOString(),
    note: "Taal Studio content. Use updatedAt as baseVersion when you propose an update or delete.",
    words: byType("word"),
    sentences: byType("sentence"),
    topics: byType("topic"),
    exercises: byType("exercise"),
    sets: sets.map((s) => ({ id: s.id, type: s.type, title: s.title, level: s.level, itemIds: s.item_ids, updatedAt: s.updated_at })),
    // Allowed values; a new one needs a "vocab.add" first.
    vocabularies: { themes: [...THEMES], tags: [...TAGS], grammarTags: [...GRAMMAR_TAGS] },
  };
}
