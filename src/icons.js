/**
 * The app's icons (Phosphor, https://phosphoricons.com). One icon per concept,
 * so the same thing looks the same everywhere. Size and weight come from the
 * IconContext in main.jsx (1.15em, regular); active nav items use weight="fill".
 */
import {
  ArrowElbowDownRight,
  ArrowSquareOut,
  ArrowsClockwise,
  Books,
  CaretLeft,
  CaretRight,
  Cards,
  ChalkboardTeacher,
  ChartLineDown,
  ChatCircleDots,
  ChatText,
  Check,
  CheckCircle,
  CheckSquare,
  DotsSixVertical,
  DownloadSimple,
  EnvelopeSimple,
  Eye,
  File,
  FileAudio,
  FileDoc,
  FileImage,
  FilePdf,
  FilePpt,
  FileText,
  FileXls,
  Footprints,
  Kanban,
  Lightbulb,
  LinkBreak,
  LinkSimple,
  ListChecks,
  MapTrifold,
  Note,
  Notebook,
  Package,
  Paperclip,
  Path,
  PencilSimple,
  PencilSimpleLine,
  Signpost,
  SquaresFour,
  Student,
  TextAa,
  TextT,
  Translate,
  UploadSimple,
  Users,
  Warning,
  X,
} from "@phosphor-icons/react";

/** Concepts of the app (menu, library tabs, cards). */
export const ICONS = {
  leerpad: Path,
  leerpaden: MapTrifold,
  lesprogramma: Kanban,
  les: Notebook,
  stap: Footprints,
  zijpad: Signpost,
  library: Books,
  words: TextAa,
  verbs: ArrowsClockwise,
  sentences: ChatText,
  topics: TextT,
  exercises: PencilSimpleLine,
  dashboard: SquaresFour,
  feedback: ChatCircleDots,
  users: Users,
  leerling: Student,
  docent: ChalkboardTeacher,
  bestand: Paperclip,
  link: LinkSimple,
  uitnodiging: EnvelopeSimple,
  notitie: Note,
  taal: Translate,
};

/** Actions and states. */
export {
  ArrowElbowDownRight,
  ArrowSquareOut,
  CaretLeft,
  CaretRight,
  ChartLineDown,
  Check,
  CheckCircle,
  CheckSquare,
  DotsSixVertical,
  DownloadSimple,
  EnvelopeSimple,
  Eye,
  Lightbulb,
  LinkBreak,
  LinkSimple,
  Note,
  Package,
  Paperclip,
  PencilSimple,
  UploadSimple,
  Warning,
  X,
};

/** Exercise types in the library. */
export const EXERCISE_ICONS = {
  "fill-in": PencilSimpleLine,
  "multiple-choice": ListChecks,
  translate: Translate,
  flashcards: Cards,
};

/** File type icon for an attachment. */
export function fileIconFor(mime) {
  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("audio/")) return FileAudio;
  if (mime === "application/pdf") return FilePdf;
  if (mime.includes("presentation") || mime.includes("powerpoint")) return FilePpt;
  if (mime.includes("sheet") || mime.includes("excel")) return FileXls;
  if (mime.includes("word")) return FileDoc;
  if (mime === "text/plain" || mime === "text/csv") return FileText;
  return File;
}
