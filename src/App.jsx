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
import { useUrlParams, useSetUrlParams } from "./hooks/useUrlParams";
import { useAuth, ROLE_LABELS } from "./auth/context";
import LoginPage from "./auth/LoginPage";
import NameSetup from "./auth/NameSetup";
import UserManagement from "./users/UserManagement";
import LesprogrammaPage from "./leerpad/LesprogrammaPage";
import LeerpadenPage, { MijnLeerpadPage } from "./leerpad/LeerpadenPage";
import { isSupabaseConfigured } from "./lib/supabase";

const PAGES = [
  { id: "leerpad", label: "Mijn leerpad", icon: "🧭", roles: ["leerling"] },
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "lesprogramma", label: "Lesprogramma", icon: "🗂️", roles: ["docent", "reviewer"] },
  { id: "leerpaden", label: "Leerpaden", icon: "🧭", roles: ["docent", "reviewer"] },
  { id: "words", label: "Woordenschat", icon: "📖" },
  { id: "verbs", label: "Werkwoorden", icon: "🔄" },
  { id: "sentences", label: "Zinnen", icon: "💬" },
  { id: "topics", label: "Grammatica", icon: "📐" },
  { id: "exercises", label: "Oefeningen", icon: "✏️" },
  { id: "feedback", label: "Feedback", icon: "📝" },
  { id: "users", label: "Gebruikers", icon: "👥", roles: ["docent"] },
];

// Pages that show a full-width board instead of a reading column.
const BOARD_PAGES = new Set(["lesprogramma", "leerpaden", "leerpad"]);

function SetupNeeded() {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1>Supabase niet geconfigureerd</h1>
        <p className="dim">
          Kopieer <code>.env.example</code> naar <code>.env.local</code>, vul de
          Supabase URL en anon key in en herstart <code>npm run dev</code>.
        </p>
      </div>
    </div>
  );
}

/** Auth gate: setup → loading → login → name → the app. */
function App() {
  if (!isSupabaseConfigured) return <SetupNeeded />;
  return <AuthGate />;
}

function AuthGate() {
  const { session, profile, loading } = useAuth();
  if (loading) return <div className="auth-screen dim">Laden…</div>;
  if (!session) return <LoginPage />;
  if (!profile) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <p className="auth-error">Je profiel kon niet worden geladen.</p>
        </div>
      </div>
    );
  }
  if (!profile.display_name) return <NameSetup />;
  return <Studio />;
}

function Studio() {
  const urlParams = useUrlParams();
  const setUrlParams = useSetUrlParams();
  const [appFeedbackOpen, setAppFeedbackOpen] = useState(false);
  const stats = getStats();
  const allFeedback = useAllFeedback();
  const { profile, role, signOut } = useAuth();
  const pages = PAGES.filter((p) => !p.roles || p.roles.includes(role));
  const validPages = new Set(pages.map((p) => p.id));

  // The URL is the source of truth for the active page.
  const homePage = role === "leerling" ? "leerpad" : "dashboard";
  const page = validPages.has(urlParams.page) ? urlParams.page : homePage;
  // Clicking a nav item clears any deep-link filters from the previous page.
  const setPage = (id) =>
    setUrlParams(
      {
        page: id,
        topic: null,
        grammar: null,
        level: null,
        theme: null,
        tense: null,
        search: null,
        type: null,
        sort: null,
        student: null,
      },
      { push: true }
    );

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
          {pages.map((p) => (
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
          <div className="sidebar-user">
            <div className="sidebar-user-name">{profile.display_name}</div>
            <div className="sidebar-user-meta">
              {ROLE_LABELS[role]} ·{" "}
              <button className="fb-link" onClick={signOut}>
                Uitloggen
              </button>
            </div>
          </div>
          <button
            className="app-feedback-btn"
            onClick={() => setAppFeedbackOpen(true)}
          >
            💡 Feedback over de app
          </button>
        </div>
      </aside>
      <main className={BOARD_PAGES.has(page) ? "main main-board" : "main"}>
        {page === "dashboard" && <Dashboard />}
        {page === "words" && <WordBrowser />}
        {page === "verbs" && <VerbBrowser />}
        {page === "sentences" && <SentenceBrowser />}
        {page === "topics" && <TopicBrowser />}
        {page === "exercises" && <ExerciseBrowser />}
        {page === "feedback" && <FeedbackOverview />}
        {page === "users" && <UserManagement />}
        {page === "lesprogramma" && <LesprogrammaPage />}
        {page === "leerpaden" && <LeerpadenPage />}
        {page === "leerpad" && <MijnLeerpadPage />}
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
