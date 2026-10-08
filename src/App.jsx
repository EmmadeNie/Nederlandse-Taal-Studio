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
import { useAuth } from "./auth/context";
import { useI18n } from "./i18n/context";
import LanguageToggle from "./i18n/LanguageToggle";
import LoginPage from "./auth/LoginPage";
import NameSetup from "./auth/NameSetup";
import UserManagement from "./users/UserManagement";
import LesprogrammaPage from "./leerpad/LesprogrammaPage";
import LeerpadenPage, { MijnLeerpadPage } from "./leerpad/LeerpadenPage";
import { isSupabaseConfigured } from "./lib/supabase";

const PAGES = [
  { id: "leerpad", icon: "🧭", roles: ["leerling"] },
  { id: "dashboard", icon: "📊" },
  { id: "lesprogramma", icon: "🗂️", roles: ["docent", "reviewer"] },
  { id: "leerpaden", icon: "🧭", roles: ["docent", "reviewer"] },
  { id: "words", icon: "📖" },
  { id: "verbs", icon: "🔄" },
  { id: "sentences", icon: "💬" },
  { id: "topics", icon: "📐" },
  { id: "exercises", icon: "✏️" },
  { id: "feedback", icon: "📝" },
  { id: "users", icon: "👥", roles: ["docent"] },
];

// Pages that show a full-width board instead of a reading column.
const BOARD_PAGES = new Set(["lesprogramma", "leerpaden", "leerpad"]);

function SetupNeeded() {
  const { t } = useI18n();
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1>{t("setup.title")}</h1>
        <p className="dim">{t("setup.body")}</p>
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
  const { session, profile, loading, signOut } = useAuth();
  const { t } = useI18n();
  if (loading) return <div className="auth-screen dim">{t("common.loading")}</div>;
  if (!session) return <LoginPage />;
  if (!profile) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <p className="auth-error">{t("app.profileError")}</p>
          <button className="fb-link" onClick={signOut}>
            {t("app.signOut")}
          </button>
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
  const { t } = useI18n();
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
              {t(`nav.${p.id}`)}
              {badges[p.id] !== undefined && (
                <span className="badge">{badges[p.id]}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-row">
              <div>
                <div className="sidebar-user-name">{profile.display_name}</div>
                <div className="sidebar-user-meta">
                  {t(`role.${role}`)} ·{" "}
                  <button className="fb-link" onClick={signOut}>
                    {t("app.signOut")}
                  </button>
                </div>
              </div>
              <LanguageToggle />
            </div>
          </div>
          <button
            className="app-feedback-btn"
            onClick={() => setAppFeedbackOpen(true)}
          >
            {t("app.feedbackButton")}
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
          itemLabel={t("app.feedbackLabel")}
          onClose={() => setAppFeedbackOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
