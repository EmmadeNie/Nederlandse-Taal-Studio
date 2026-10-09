/**
 * Files attached to lessons: Supabase Storage bucket "lesson-files" plus the
 * lesson_attachments table (see *_lesson_files.sql). The docent uploads,
 * everyone logged in can download.
 */
import { supabase } from "../lib/supabase";

const BUCKET = "lesson-files";
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

// By extension, because browsers don't always report a type (e.g. .heic, .m4a).
const TYPES = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
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

/** For <input accept>. */
export const ACCEPT = Object.keys(TYPES).map((ext) => `.${ext}`).join(",");

const extension = (name) => name.split(".").pop().toLowerCase();
export const mimeFor = (file) => TYPES[extension(file.name)] || null;

export function fileIcon(mime) {
  if (mime.startsWith("image/")) return "🖼";
  if (mime.startsWith("audio/")) return "🎧";
  if (mime === "application/pdf") return "📕";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "📊";
  if (mime.includes("sheet") || mime.includes("excel")) return "📈";
  return "📄";
}

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".0", "")} MB`;
}

/** Upload one file to a lesson; returns the new attachment row. */
export async function uploadLessonFile(lessonId, file) {
  const mime = mimeFor(file);
  if (!mime) throw new Error("files.badType");
  if (file.size > MAX_FILE_BYTES) throw new Error("files.tooBig");

  const safeName = file.name.normalize("NFD").replace(/[^\w.-]+/g, "_");
  const path = `${lessonId}/${crypto.randomUUID().slice(0, 8)}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: mime, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("lesson_attachments")
    .insert({ lesson_id: lessonId, storage_path: path, file_name: file.name, mime_type: mime, size_bytes: file.size })
    .select()
    .single();
  if (error) {
    // Don't leave an orphaned file behind.
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(error.message);
  }
  return data;
}

export async function deleteLessonFile(attachment) {
  const { error } = await supabase.from("lesson_attachments").delete().eq("id", attachment.id);
  if (error) throw new Error(error.message);
  await supabase.storage.from(BUCKET).remove([attachment.storage_path]);
}

/** Remove stored files whose rows are already gone (after deleting a lesson). */
export const removeStoredFiles = (paths) =>
  paths.length ? supabase.storage.from(BUCKET).remove(paths) : Promise.resolve();

/** Short-lived download link; `download` makes the browser save it under its own name. */
export async function fileUrl(attachment, { download = false } = {}) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(attachment.storage_path, 60, download ? { download: attachment.file_name } : undefined);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
