import { useState } from "react";
import "./App.css";
import Dashboard from "./components/Dashboard";
import WordBrowser from "./components/WordBrowser";
import VerbBrowser from "./components/VerbBrowser";
import SentenceBrowser from "./components/SentenceBrowser";
import TopicBrowser from "./components/TopicBrowser";
import ExerciseBrowser from "./components/ExerciseBrowser";
import { getStats } from "./data";

const PAGES = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "words", label: "Woordenschat", icon: "📖" },
  { id: "verbs", label: "Werkwoorden", icon: "🔄" },
  { id: "sentences", label: "Zinnen", icon: "💬" },
  { id: "topics", label: "Grammatica", icon: "📐" },
  { id: "exercises", label: "Oefeningen", icon: "✏️" },
];

function App() {
  const [page, setPage] = useState("dashboard");
  const stats = getStats();

  const badges = {
    words: stats.totalWords,
    verbs: stats.totalVerbs,
    sentences: stats.totalSentences,
    topics: stats.totalTopics,
    exercises: stats.totalExercises,
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
      </aside>
      <main className="main">
        {page === "dashboard" && <Dashboard />}
        {page === "words" && <WordBrowser />}
        {page === "verbs" && <VerbBrowser />}
        {page === "sentences" && <SentenceBrowser />}
        {page === "topics" && <TopicBrowser />}
        {page === "exercises" && <ExerciseBrowser />}
      </main>
    </div>
  );
}

export default App;
