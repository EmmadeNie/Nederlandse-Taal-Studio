import { useRef, useState } from "react";
import { useI18n } from "../i18n/context";
import {
  ACCEPT,
  MAX_FILE_BYTES,
  deleteLessonFile,
  fileIcon,
  fileUrl,
  formatSize,
  mimeFor,
  uploadLessonFile,
} from "./files";

/**
 * The files of a lesson. Everyone can open/download them; the docent
 * (canEdit) can upload and delete. onChange receives the new list.
 */
export default function LessonFiles({ lessonId, attachments = [], canEdit, onChange }) {
  const { t } = useI18n();
  const input = useRef(null);
  const [uploading, setUploading] = useState(0);
  const [errors, setErrors] = useState([]);

  const sorted = [...attachments].sort((a, b) => a.created_at.localeCompare(b.created_at));

  const upload = async (fileList) => {
    const files = [...fileList];
    const problems = [];
    const ok = files.filter((file) => {
      if (!mimeFor(file)) problems.push(t("files.badType", { name: file.name }));
      else if (file.size > MAX_FILE_BYTES) problems.push(t("files.tooBig", { name: file.name }));
      else return true;
      return false;
    });
    setErrors(problems);
    setUploading(ok.length);
    let list = attachments;
    for (const file of ok) {
      try {
        const row = await uploadLessonFile(lessonId, file);
        list = [...list, row];
        onChange(list);
      } catch (e) {
        problems.push(`${file.name}: ${t(e.message)}`);
        setErrors([...problems]);
      }
      setUploading((n) => n - 1);
    }
  };

  const open = async (attachment, download) => {
    // Open the tab right away (inside the click) so pop-up blockers allow it.
    const tab = download ? null : window.open("", "_blank");
    try {
      const url = await fileUrl(attachment, { download });
      if (tab) tab.location.replace(url);
      else window.location.assign(url);
    } catch (e) {
      tab?.close();
      setErrors([t(e.message)]);
    }
  };

  const remove = async (attachment) => {
    if (!window.confirm(t("files.confirmDelete", { name: attachment.file_name }))) return;
    try {
      await deleteLessonFile(attachment);
      onChange(attachments.filter((a) => a.id !== attachment.id));
    } catch (e) {
      setErrors([t(e.message)]);
    }
  };

  return (
    <div className="lp-files">
      {sorted.length === 0 && !canEdit && <p className="dim lp-empty">{t("files.none")}</p>}
      {sorted.length > 0 && (
        <ul className="lp-links lp-file-list">
          {sorted.map((a) => (
            <li key={a.id}>
              <button type="button" className="lp-file-name" onClick={() => open(a, false)}>
                <span aria-hidden="true">{fileIcon(a.mime_type)}</span> {a.file_name}
              </button>
              <span className="dim lp-file-size">{formatSize(a.size_bytes)}</span>
              <button
                type="button"
                className="board-icon-btn"
                title={t("files.download")}
                aria-label={t("files.downloadAria", { name: a.file_name })}
                onClick={() => open(a, true)}
              >
                ⬇
              </button>
              {canEdit && (
                <button
                  type="button"
                  className="board-icon-btn"
                  title={t("fb.delete")}
                  aria-label={t("files.delete", { name: a.file_name })}
                  onClick={() => remove(a)}
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit && (
        <div className="lp-file-upload">
          <button
            type="button"
            className="fb-btn-secondary"
            disabled={uploading > 0}
            onClick={() => input.current?.click()}
          >
            {uploading > 0 ? t("files.uploading", { n: uploading }) : t("files.upload")}
          </button>
          <span className="dim">{t("files.hint")}</span>
          <input
            ref={input}
            type="file"
            multiple
            accept={ACCEPT}
            hidden
            onChange={(e) => {
              upload(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}
      {errors.map((msg, i) => (
        <div key={i} className="auth-error">
          {msg}
        </div>
      ))}
    </div>
  );
}
