// Checks the student's board against a saved snapshot and, with --restore,
// puts changed rows back.
//   npm run check-board -- snapshots/board-....json [--restore]
// Without a file it only takes and saves a fresh snapshot.
import { readFileSync } from "node:fs";
import { docentClient, findStudent, snapshot, saveSnapshot, compare, restore } from "./guard.mjs";

const [file] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const doRestore = process.argv.includes("--restore");

const client = await docentClient();
const student = await findStudent(client);

if (!file) {
  const snap = await snapshot(client, student.id);
  console.log(`${student.display_name}: ${snap.lanes.length} lanes, ${snap.steps.length} steps. Saved to ${saveSnapshot(snap)}`);
  process.exit(0);
}

const before = JSON.parse(readFileSync(file, "utf8"));
if (before.studentId !== student.id) throw new Error("This snapshot belongs to another student.");
const diffs = compare(before, await snapshot(client, student.id));
if (!diffs.length) {
  console.log(`✓ ${student.display_name}'s board is exactly as in ${file}`);
  process.exit(0);
}
for (const d of diffs) console.log(`✗ ${d.table} ${d.id}: ${d.kind}`);
if (!doRestore) {
  console.log("Run again with --restore to put the changed rows back.");
  process.exit(1);
}
const left = await restore(client, diffs);
const after = compare(before, await snapshot(client, student.id));
console.log(after.length ? `Still different after restoring: ${after.length} rows` : "✓ Restored.");
for (const d of left) console.log(`  needs a person: ${d.table} ${d.id} was ${d.kind}`);
process.exit(after.length ? 1 : 0);
