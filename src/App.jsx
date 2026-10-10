import { useContentVersion } from "./data/useContent";
import Brand from "./components/Brand";
import { useEffect, useState } from "react";
import ContentGate from "./components/ContentGate";
import "./App.css";
import Dashboard from "./components/Dashboard";
import Library from "./components/Library";
import { LIBRARY_TAB_IDS } from "./components/libraryTabs";
import FeedbackOverview from "./feedback/FeedbackOverview";
import FeedbackDialog from "./feedback/FeedbackDialog";
import { useAllFeedback } from "./feedback/useFeedback";
import { getStats } from "./data";
import { navigate, useRoute } from "./hooks/useRoute";
import { PATHS } from "./routes";
import { ICONS, Lightbulb } from "./icons";
import { useAuth } from "./auth/context";
import { useI18n } from "./i18n/context";
import LanguageToggle from "./i18n/LanguageToggle";
import { FeedbackModeToggle, ThemeToggle } from "./prefs/PrefsToggles";
import { usePrefs } from "./prefs/context";
import LoginPage from "./auth/LoginPage";
import NameSetup from "./auth/NameSetup";
import InviteClaim from "./auth/InviteClaim";
import UserManagement from "./users/UserManagement";
import LesprogrammaPage from "./leerpad/LesprogrammaPage";
import LeerpadenPage, { MijnLeerpadPage } from "./leerpad/LeerpadenPage";
import { isSupabaseConfigured } from "./lib/supabase";

const PAGES = [
  { id: "leerpad", roles: ["leerling"] },
  { id: "dashboard", roles: ["docent", "reviewer"] },
  { id: "lesprogramma" },
  { id: "leerpaden", roles: ["docent", "reviewer"] },
  { id: "library" },
  { id: "feedback" },
  { id: "users", roles: ["docent"] },
];

// Pages that show a full-width board instead of a reading column.
const BOARD_PAGES = new Set(["lesprogramma", "leerpaden", "leerpad"]);

/** Menu icon; the active page gets the filled variant. */
function NavIcon({ id, active }) {
  const Icon = ICONS[id];
  return <Icon weight={active ? "fill" : "regular"} size={20} aria-hidden="true" />;
}

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

/** Auth gate: setup → loading → login → name → the app. The language switch sits top right on every screen. */
function App() {
  return (
    <>
      <div className="lang-corner">
        <FeedbackModeToggle />
        <ThemeToggle />
        <LanguageToggle />
      </div>
      {isSupabaseConfigured ? <AuthGate /> : <SetupNeeded />}
    </>
  );
}

function AuthGate() {
  const { session, profile, loading, signOut } = useAuth();
  const { t } = useI18n();
  const { pathname } = useRoute();
  const inviteCode = pathname.match(/^\/uitnodiging\/([a-z0-9]+)\/?$/i)?.[1];
  if (loading) return <div className="auth-screen dim">{t("common.loading")}</div>;
  if (!session) return <LoginPage invited={Boolean(inviteCode)} />;
  // Before the name screen: a claimed invite already brings the name the docent entered.
  if (inviteCode) return <InviteClaim code={inviteCode} />;
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
  return (
    <ContentGate>
      <Studio />
    </ContentGate>
  );
}

function Studio() {
  useContentVersion(); // counts follow edits
  const route = useRoute();
  const [appFeedbackOpen, setAppFeedbackOpen] = useState(false);
  const { feedbackMode } = usePrefs();
  const stats = getStats();
  const allFeedback = useAllFeedback();
  const { profile, role, signOut } = useAuth();
  const { t } = useI18n();
  const pages = PAGES.filter((p) => !p.roles || p.roles.includes(role));
  const validPages = new Set(pages.map((p) => p.id));

  // The path is the source of truth for the active page (see src/routes.js).
  // Students start on their leerpad; the dashboard is a content-review tool for staff.
  const homePage = role === "leerling" ? "leerpad" : "dashboard";
  const allowed = (id) =>
    validPages.has(id) || (validPages.has("library") && LIBRARY_TAB_IDS.has(id));
  const page = route.page && allowed(route.page) ? route.page : homePage;
  const navId = LIBRARY_TAB_IDS.has(page) ? "library" : page;

  // "/" or a page this role can't open: show the home page under its own path.
  useEffect(() => {
    if (page !== route.page) navigate(PATHS[page], { replace: true });
  }, [page, route.page]);

  // Clicking a nav item drops the previous page's filters.
  const setPage = (id) => navigate(PATHS[id === "library" ? "words" : id]);

  const libraryCounts = {
    words: stats.totalWords,
    verbs: stats.totalVerbs,
    sentences: stats.totalSentences,
    topics: stats.totalTopics,
    exercises: stats.totalExercises,
  };
  const badges = {
    feedback: allFeedback.length || undefined,
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <Brand tagline />
        <nav>
          {pages.map((p) => (
            <button
              key={p.id}
              className={navId === p.id ? "active" : ""}
              onClick={() => setPage(p.id)}
            >
              <span className="icon">
                <NavIcon id={p.id} active={navId === p.id} />
              </span>
              {t(`nav.${p.id}`)}
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
              {t(`role.${role}`)} ·{" "}
              <button className="fb-link" onClick={signOut}>
                {t("app.signOut")}
              </button>
            </div>
          </div>
          {feedbackMode && (
            <button
              className="app-feedback-btn"
              onClick={() => setAppFeedbackOpen(true)}
            >
              <Lightbulb /> {t("app.feedbackButton")}
            </button>
          )}
        </div>
      </aside>
      <main className={BOARD_PAGES.has(page) ? "main main-board" : "main"}>
        {page === "dashboard" && <Dashboard />}
        {LIBRARY_TAB_IDS.has(page) && (
          <Library tab={page} onTab={setPage} counts={libraryCounts} />
        )}
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
