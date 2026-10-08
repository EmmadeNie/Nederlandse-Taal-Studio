import { useRef, useState } from "react";
import { useAllFeedback } from "./useFeedback";
import {
  deleteFeedback,
  exportFeedbackJson,
  importFeedbackJson,
  getLegacyLocalFeedback,
  migrateLegacyLocalFeedback,
  CATEGORY_LABELS,
} from "./store";
import { useAuth } from "../auth/context";

const ITEM_TYPE_LABELS = {
  word: "Woord",
  verb: "Werkwoord",
  sentence: "Zin",
  topic: "Grammatica",
  exercise: "Oefening",
  app: "Over de app",
  overig: "Overig",
};

function formatDate(ts) {
  return new Date(ts).toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FeedbackOverview() {
  const feedback = useAllFeedback();
  const { user, role } = useAuth();
  const isDocent = role === "docent";
  const fileInput = useRef(null);
  const [notice, setNotice] = useState(null);
  const [legacyCount, setLegacyCount] = useState(() => getLegacyLocalFeedback().length);

  const canDelete = (f) => isDocent || f.authorId === user?.id;

  const handleDelete = async (id) => {
    try {
      await deleteFeedback(id);
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    }
  };

  const handleMigrate = async () => {
    try {
      const result = await migrateLegacyLocalFeedback({ keepAuthorNames: isDocent });
      setLegacyCount(0);
      setNotice({
        type: "ok",
        text: `Overgezet: ${result.added} nieuw, ${result.skipped} overgeslagen (dubbel of ongeldig).`,
      });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    }
  };

  const handleExport = () => {
    const json = exportFeedbackJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `nl-studio-feedback-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInput.current?.click();

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await importFeedbackJson(String(reader.result));
        setNotice({
          type: "ok",
          text: `Geïmporteerd: ${result.added} nieuw, ${result.skipped} overgeslagen (dubbel of ongeldig).`,
        });
      } catch (err) {
        setNotice({ type: "error", text: err.message });
      }
      // reset so the same file can be chosen again
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h2>Feedback</h2>

      <div className="fb-overview-toolbar">
        <button className="fb-btn-primary" onClick={handleExport} disabled={feedback.length === 0}>
          ⬇ Exporteren ({feedback.length})
        </button>
        {isDocent && (
          <>
            <button className="fb-btn-secondary" onClick={handleImportClick}>
              ⬆ Importeren
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              style={{ display: "none" }}
              onChange={handleImportFile}
            />
          </>
        )}
      </div>

      {legacyCount > 0 && (
        <div className="fb-legacy">
          Er staat nog <strong>{legacyCount}</strong> feedback lokaal in deze browser
          (van vóór de accounts).
          <button className="fb-btn-primary" onClick={handleMigrate}>
            Overzetten naar je account
          </button>
        </div>
      )}

      {notice && (
        <div
          className="result-count"
          style={{
            color: notice.type === "error" ? "var(--red)" : "var(--green)",
          }}
        >
          {notice.text}
        </div>
      )}

      {feedback.length === 0 ? (
        <div className="fb-empty">
          Nog geen feedback. Klik op het 💬-knopje bij een woord, zin, werkwoord,
          grammatica-onderwerp of oefening om feedback te geven.
        </div>
      ) : (
        feedback.map((f) => (
          <div key={f.id} className="fb-entry">
            {canDelete(f) && (
              <button
                className="fb-entry-delete"
                onClick={() => handleDelete(f.id)}
                aria-label="Feedback verwijderen"
                title="Verwijderen"
              >
                ✕
              </button>
            )}
            <div className="fb-entry-header">
              {f.author && <span className="fb-author">{f.author}</span>}
              <span className="fb-category">
                {CATEGORY_LABELS[f.category] || f.category}
              </span>
              <span className="tag">
                {ITEM_TYPE_LABELS[f.itemType] || f.itemType}
              </span>
              <span className="fb-date">{formatDate(f.createdAt)}</span>
            </div>
            <div className="fb-message">{f.message}</div>
            {f.itemLabel && (
              <div className="fb-item-label">↳ {f.itemLabel}</div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
