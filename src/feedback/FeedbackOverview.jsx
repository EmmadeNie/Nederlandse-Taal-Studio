import { useRef, useState } from "react";
import { useAllFeedback } from "./useFeedback";
import {
  deleteFeedback,
  clearAllFeedback,
  exportFeedbackJson,
  importFeedbackJson,
  CATEGORY_LABELS,
} from "./store";

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
  const fileInput = useRef(null);
  const [notice, setNotice] = useState(null);

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
    reader.onload = () => {
      try {
        const result = importFeedbackJson(String(reader.result));
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

  const handleClearAll = () => {
    if (
      window.confirm(
        "Weet je zeker dat je ALLE feedback wilt verwijderen? Dit kan niet ongedaan worden gemaakt."
      )
    ) {
      clearAllFeedback();
      setNotice({ type: "ok", text: "Alle feedback verwijderd." });
    }
  };

  return (
    <div>
      <h2>Feedback</h2>

      <div className="fb-overview-toolbar">
        <button className="fb-btn-primary" onClick={handleExport} disabled={feedback.length === 0}>
          ⬇ Exporteren ({feedback.length})
        </button>
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
        {feedback.length > 0 && (
          <button
            className="fb-btn-secondary"
            onClick={handleClearAll}
            style={{ marginLeft: "auto", color: "var(--red)" }}
          >
            Alles wissen
          </button>
        )}
      </div>

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
          grammatica-onderwerp of oefening om feedback te geven. Of importeer een
          feedbackbestand dat iemand anders heeft gedeeld.
        </div>
      ) : (
        feedback.map((f) => (
          <div key={f.id} className="fb-entry">
            <button
              className="fb-entry-delete"
              onClick={() => deleteFeedback(f.id)}
              aria-label="Feedback verwijderen"
              title="Verwijderen"
            >
              ✕
            </button>
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
