import { useState } from "react";
import "./App.css";
import Dashboard from "./components/Dashboard";
import WordBrowser from "./components/WordBrowser";
import VerbBrowser from "./components/VerbBrowser";
import SentenceBrowser from "./components/SentenceBrowser";
import TopicBrowser from "./components/TopicBrowser";
import ExerciseBrowser from "./components/ExerciseBrowser";
import FeedbackOverview from "./feedback/FeedbackOverview";
import FeedbackDialog from "./feedback/FeedbackDialog";
import { useAllFeedback } from "./feedback/useFeedback";
import { getStats } from "./data";

const PAGES = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "words", label: "Woordenschat", icon: "📖" },
  { id: "verbs", label: "Werkwoorden", icon: "🔄" },
  { id: "sentences", label: "Zinnen", icon: "💬" },
  { id: "topics", label: "Grammatica", icon: "📐" },
  { id: "exercises", label: "Oefeningen", icon: "✏️" },
  { id: "feedback", label: "Feedback", icon: "📝" },
];

function App() {
  const [page, setPage] = useState("dashboard");
  const [appFeedbackOpen, setAppFeedbackOpen] = useState(false);
  const stats = getStats();
  const allFeedback = useAllFeedback();

  const badges = {
    words: stats.totalWords,
    verbs: stats.totalVerbs,
    sentences: stats.totalSentences,
    topics: stats.totalTopics,
    exercises: stats.totalExercises,
    feedback: allFeedback.length || undefined,
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>🇳🇱 NL Studio</h1>
        <p className="subtitle">Nederlandse Taal Studio</p>
        <nav>
          {PAGES.map((p) => (
            <button
              key={p.id}
              className={page === p.id ? "active" : ""}
              onClick={() => setPage(p.id)}
            >
              <span className="icon">{p.icon}</span>
              {p.label}
              {badges[p.id] !== undefined && (
                <span className="badge">{badges[p.id]}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="app-feedback-btn"
            onClick={() => setAppFeedbackOpen(true)}
          >
            💡 Feedback over de app
          </button>
        </div>
      </aside>
      <main className="main">
        {page === "dashboard" && <Dashboard />}
        {page === "words" && <WordBrowser />}
        {page === "verbs" && <VerbBrowser />}
        {page === "sentences" && <SentenceBrowser />}
        {page === "topics" && <TopicBrowser />}
        {page === "exercises" && <ExerciseBrowser />}
        {page === "feedback" && <FeedbackOverview />}
      </main>

      {appFeedbackOpen && (
        <FeedbackDialog
          itemType="app"
          itemId={null}
          itemLabel="De app in het algemeen"
          onClose={() => setAppFeedbackOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
