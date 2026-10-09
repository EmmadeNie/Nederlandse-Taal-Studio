#!/usr/bin/env node
/**
 * One-off import: copy the uploaded files (attachments) of the Trello board
 * into the matching lessons of the lesprogramma.
 *
 * A lesson knows its Trello card (lessons.trello_card_id), so every file lands
 * on the right lesson. Safe to run twice: files that were already imported
 * are skipped. First shows what it would do, then asks before uploading.
 *
 *   node scripts/import-trello-attachments.mjs [boardShortLink]
 *
 * Asks for (hidden input, nothing is stored):
 *   - Trello API key and token  (trello.com/power-ups/admin → your app → API key)
 *   - Supabase secret key       (Project Settings → API Keys → secret key)
 */
import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://lgmzoihdwgkboixrylkd.supabase.co";
const BOARD = process.argv[2] || "u2fkTCop"; // "Dimitrios | van B naar Beter"
const BUCKET = "lesson-files";
const MAX_BYTES = 20 * 1024 * 1024;

// Same list as src/leerpad/files.js (by extension).
const TYPES = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  csv: "text/csv",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  webm: "audio/webm",
};

/** Ask a question; hidden input for secrets. */
function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => {
        if (s.includes(question)) rl.output.write(s);
        else rl.output.write("*".repeat(Math.min(s.length, 1)));
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

const fmt = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

async function main() {
  console.log(`\nTrello-bijlagen → lesprogramma (bord ${BOARD})\n`);
  const key = await ask("Trello API key: ", { hidden: true });
  const token = await ask("Trello token: ", { hidden: true });
  const secret = await ask("Supabase secret key (sb_secret_…): ", { hidden: true });
  if (!key || !token || !secret) throw new Error("Niet alle sleutels ingevuld.");

  // 1. Cards with uploaded files
  const res = await fetch(
    `https://api.trello.com/1/boards/${BOARD}/cards?fields=name&attachments=true&attachment_fields=id,name,fileName,url,mimeType,bytes,isUpload&key=${key}&token=${token}`
  );
  if (!res.ok) throw new Error(`Trello: ${res.status} ${await res.text()}`);
  const cards = (await res.json()).filter((c) => c.attachments?.some((a) => a.isUpload));

  // 2. Matching lessons
  const supabase = createClient(SUPABASE_URL, secret, { auth: { persistSession: false } });
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("id, title, trello_card_id, attachments:lesson_attachments(storage_path)")
    .in("trello_card_id", cards.map((c) => c.id));
  if (error) throw new Error(`Supabase: ${error.message}`);
  const lessonFor = new Map(lessons.map((l) => [l.trello_card_id, l]));

  // 3. Plan
  const plan = [];
  for (const card of cards) {
    const lesson = lessonFor.get(card.id);
    for (const a of card.attachments.filter((x) => x.isUpload)) {
      const name = a.fileName || a.name;
      const mime = TYPES[name.split(".").pop().toLowerCase()];
      const safeName = name.normalize("NFD").replace(/[^\w.-]+/g, "_");
      const path = lesson && `${lesson.id}/trello-${a.id}-${safeName}`;
      let status = "upload";
      if (!lesson) status = "geen les gevonden";
      else if (!mime) status = "bestandstype niet toegestaan";
      else if (a.bytes > MAX_BYTES) status = "te groot (> 20 MB)";
      else if (lesson.attachments.some((x) => x.storage_path === path)) status = "al geïmporteerd";
      plan.push({ card, lesson, a, name, mime, path, status });
    }
  }

  console.log(`${cards.length} kaarten met bestanden, ${plan.length} bestanden:\n`);
  for (const p of plan) {
    const mark = p.status === "upload" ? "→" : "·";
    console.log(`  ${mark} ${p.card.name}  /  ${p.name} (${fmt(p.a.bytes)})${p.status === "upload" ? "" : `  [${p.status}]`}`);
  }
  const todo = plan.filter((p) => p.status === "upload");
  console.log(`\nTe uploaden: ${todo.length}. Overgeslagen: ${plan.length - todo.length}.`);
  if (!todo.length) return;

  if ((await ask("\nUploaden naar de LIVE app? Typ ja en Enter: ")).toLowerCase() !== "ja") {
    console.log("Niets gewijzigd.");
    return;
  }

  // 4. Download from Trello, upload to Supabase, register on the lesson
  let ok = 0;
  for (const p of todo) {
    process.stdout.write(`  ${p.name} … `);
    try {
      const file = await fetch(p.a.url, {
        headers: { Authorization: `OAuth oauth_consumer_key="${key}", oauth_token="${token}"` },
      });
      if (!file.ok) throw new Error(`download ${file.status}`);
      const body = Buffer.from(await file.arrayBuffer());
      const up = await supabase.storage.from(BUCKET).upload(p.path, body, { contentType: p.mime, upsert: false });
      if (up.error && !/exists/i.test(up.error.message)) throw new Error(up.error.message);
      const row = await supabase.from("lesson_attachments").insert({
        lesson_id: p.lesson.id,
        storage_path: p.path,
        file_name: p.name,
        mime_type: p.mime,
        size_bytes: body.length,
        uploaded_by: null,
      });
      if (row.error) throw new Error(row.error.message);
      ok++;
      console.log("ok");
    } catch (e) {
      console.log(`MISLUKT: ${e.message}`);
    }
  }
  console.log(`\nKlaar: ${ok} van ${todo.length} bestanden geïmporteerd.`);
  console.log("Je kunt de Trello-token en de Supabase-sleutel nu intrekken.\n");
}

main().catch((e) => {
  console.error(`\nFout: ${e.message}\n`);
  process.exit(1);
});
