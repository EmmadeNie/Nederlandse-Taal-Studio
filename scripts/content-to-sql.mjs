#!/usr/bin/env node
/**
 * One-off: turn the content in src/data/*.json into SQL for the content_items
 * and sets tables (see supabase/migrations/*_content_tables.sql).
 *
 *   node scripts/content-to-sql.mjs > content.sql
 *
 * Run the output once per database (local: psql, live: the Supabase SQL
 * editor). Safe to run twice: existing ids are left alone.
 *
 * Sets come from the `sets` field on items: sentence sets keep the order of
 * the file (a dialogue), word sets are alphabetical (you can reorder later).
 */
import { readFileSync } from "node:fs";

const read = (name) => JSON.parse(readFileSync(new URL(`../src/data/${name}`, import.meta.url), "utf8"));

const files = {
  word: ["words.json", "words-thema.json", "words-verbs.json"],
  sentence: ["sentences.json"],
  topic: ["topics.json"],
  exercise: ["exercises.json"],
};

const items = new Map(); // id → { type, data }, first one wins (as the app did)
const setMembers = new Map(); // set id → { type, ids: [] }

for (const [type, names] of Object.entries(files)) {
  for (const name of names) {
    for (const raw of read(name)) {
      if (items.has(raw.id)) continue;
      const { id, sets = [], ...data } = raw;
      items.set(id, { type, data });
      for (const set of sets) {
        if (!setMembers.has(set)) setMembers.set(set, { type, ids: [] });
        const s = setMembers.get(set);
        if (s.type !== type) throw new Error(`Set ${set} mixes ${s.type} and ${type}`);
        s.ids.push(id);
      }
    }
  }
}

// $json$…$json$ quoting: no escaping needed as long as the text has no "$json$".
const dollar = (text) => {
  if (text.includes("$json$")) throw new Error("Text contains $json$");
  return `$json$${text}$json$`;
};
const lit = (text) => `'${text.replace(/'/g, "''")}'`;

const title = (slug) => slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");

const out = ["begin;", ""];
out.push("insert into public.content_items (id, type, data) values");
out.push(
  [...items]
    .map(([id, { type, data }]) => `  (${lit(id)}, ${lit(type)}, ${dollar(JSON.stringify(data))}::jsonb)`)
    .join(",\n") + "\non conflict (id) do nothing;"
);
out.push("");

for (const [id, { type, ids }] of setMembers) {
  const ordered =
    type === "word"
      ? [...ids].sort((a, b) => items.get(a).data.nl.localeCompare(items.get(b).data.nl, "nl"))
      : ids;
  out.push(
    `insert into public.sets (id, type, title, item_ids) values (${lit(id)}, ${lit(type)}, ${lit(title(id))}, ` +
      `array[${ordered.map(lit).join(", ")}]::text[]) on conflict (id) do nothing;`
  );
}

out.push("", "commit;", "");
out.push(`-- ${items.size} items, ${setMembers.size} sets`);
process.stdout.write(out.join("\n") + "\n");
