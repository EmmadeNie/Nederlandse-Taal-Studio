/** Checking sentences: versions, reviews and the verdict (see *_sentence_reviews.sql). */
import { supabase } from "../lib/supabase";

function check({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

/** updated_at of every sentence: { id: "2026-…" }. */
export async function sentenceVersions() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const page = await supabase
      .from("content_items")
      .select("id, updated_at")
      .eq("type", "sentence")
      .order("id")
      .range(from, from + 999)
      .then(check);
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return Object.fromEntries(rows.map((r) => [r.id, r.updated_at]));
}

/** My reviews, newest first. */
export const myReviews = (profileId) =>
  supabase
    .from("sentence_reviews")
    .select("sentence_id, status, item_version, created_at")
    .eq("reviewer_id", profileId)
    .order("created_at", { ascending: false })
    .then(check);

/** scope: "all" (the whole sentence) or "marks" (only the marked words of a checked sentence). */
export const reviewSentence = ({ sentenceId, verdict, seenVersion, aspects = [], comment = "", scope = "all" }) =>
  supabase
    .rpc("review_sentence", { sentence: sentenceId, verdict, seen_version: seenVersion, what: aspects, note: comment, scope })
    .then(check);

/** Open remarks ("klopt niet" not yet handled), for the docent. */
export const openIssues = () =>
  supabase
    .from("sentence_reviews")
    .select("id, sentence_id, aspects, comment, created_at, reviewer:profiles(display_name, email)")
    .eq("status", "issue")
    .is("resolved_at", null)
    .order("created_at")
    .then(check);

export const resolveIssue = (id) =>
  supabase.from("sentence_reviews").update({ resolved_at: new Date().toISOString() }).eq("id", id).then(check);

/** Nakijklijsten: per approved proposal the sentences it added or changed (newest first). */
export const reviewBatches = () =>
  supabase
    .rpc("review_batches")
    .then(check)
    .then((rows) => rows.map((r) => ({ id: r.id, title: r.title, approvedAt: r.approved_at, ids: new Set(r.sentence_ids) })));

/**
 * The docent flags a sentence: "weghalen" (it goes, and stays out of the
 * exercises until handled) or "aanpassen", with an optional remark. It is a
 * remark like the checker's, so it shows under Opmerkingen bij zinnen.
 */
export async function flagSentence({ sentenceId, kind, comment = "" }) {
  const row = await supabase.from("content_items").select("updated_at").eq("id", sentenceId).single().then(check);
  return reviewSentence({ sentenceId, verdict: "issue", seenVersion: row.updated_at, aspects: [kind], comment });
}

/** Ids of sentences flagged "weghalen" and not handled yet. */
export const hiddenSentenceIds = () =>
  supabase
    .rpc("hidden_sentence_ids")
    .then(check)
    .then((rows) => rows.map((r) => (typeof r === "string" ? r : r.hidden_sentence_ids)));
