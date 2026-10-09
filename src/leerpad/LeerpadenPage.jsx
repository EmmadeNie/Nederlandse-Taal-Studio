import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/context";
import { useI18n } from "../i18n/context";
import { useUrlParams } from "../hooks/useUrlParams";
import { navigate, useRoute } from "../hooks/useRoute";
import { pathFor, slugify } from "../routes";
import LeerpadBoard from "./LeerpadBoard";
import { AddStudentDialog, PendingStudentPanel } from "./StudentPanels";
import { listStudents } from "./api";
import { EnvelopeSimple } from "../icons";

/** Many students → a searchable list instead of a row of buttons. */
const PICKER_THRESHOLD = 8;

/**
 * Each student gets a readable path segment from their name
 * (/leerpaden/dimitrios); a name used twice gets a bit of the id appended.
 */
function withSlugs(students) {
  const base = students.map(
    (s) => slugify(s.display_name || (s.email || "").split("@")[0]) || s.id.slice(0, 8)
  );
  return students.map((s, i) => ({
    ...s,
    name: s.display_name || s.email || "?",
    pending: !s.user_id,
    slug: base.filter((b) => b === base[i]).length > 1 ? `${base[i]}-${s.id.slice(0, 4)}` : base[i],
  }));
}

/**
 * Docent and reviewers: pick a student and see their leerpad (/leerpaden/<leerling>).
 * The docent can also prepare a leerling who has no account yet.
 */
export default function LeerpadenPage() {
  const { role } = useAuth();
  const { t } = useI18n();
  const route = useRoute();
  const { student: legacyStudentId } = useUrlParams();
  const isDocent = role === "docent";
  const [students, setStudents] = useState(null);
  const [filter, setFilter] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    () =>
      listStudents()
        .then((rows) => setStudents(withSlugs(rows)))
        .catch((e) => {
          setError(e.message);
          setStudents([]);
        }),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const current =
    students?.find((s) => s.slug === route.param) ||
    students?.find((s) => s.id === route.param || s.id === legacyStudentId) ||
    students?.[0];

  // Keep the address bar on the student shown (also turns old ?student=<id> links into paths).
  useEffect(() => {
    if (current && route.param !== current.slug) {
      navigate(pathFor("leerpaden", current.slug), { replace: true });
    }
  }, [current, route.param]);

  const choose = (s) => navigate(pathFor("leerpaden", s.slug));
  const shown = students?.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase())) ?? [];
  // Accounts that could belong to a prepared leerling (they signed up with another email).
  const accounts = students?.filter((s) => !s.pending && s.id !== current?.id) ?? [];

  const created = async (profile) => {
    setAdding(false);
    const rows = withSlugs(await listStudents());
    setStudents(rows);
    const fresh = rows.find((s) => s.id === profile.id);
    if (fresh) choose(fresh);
  };

  const addButton = isDocent && (
    <button className="fb-btn-secondary" onClick={() => setAdding(true)}>
      {t("students.addButton")}
    </button>
  );

  return (
    <>
      <div className="lp-page-head">
        <h2>{t("nav.leerpaden")}</h2>
        {students && <span className="result-count">{t("lpd.students", { n: students.length })}</span>}
      </div>
      <p className="lp-intro">
        {t("lpd.intro")} {isDocent ? t("lpd.introDocent") : t("lpd.introReviewer")}
      </p>
      {error && <div className="lp-error">{error}</div>}
      {students === null ? (
        <p className="dim">{t("common.loading")}</p>
      ) : students.length === 0 ? (
        <div className="lp-students-row">
          <p className="dim">{t("lpd.none")}</p>
          {addButton}
        </div>
      ) : (
        <>
          <div className="lp-students-row">
            {students.length > PICKER_THRESHOLD ? (
              <div className="filters lp-filters">
                <input
                  type="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder={t("lpd.searchStudent")}
                  aria-label={t("lpd.searchStudent")}
                />
                <select
                  value={current.id}
                  onChange={(e) => choose(students.find((s) => s.id === e.target.value))}
                  aria-label={t("lp.student")}
                >
                  {(shown.some((s) => s.id === current.id) ? shown : [current, ...shown]).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.pending ? ` (${t("users.pending")})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="lp-students" role="group" aria-label={t("lp.student")}>
                {students.map((s) => (
                  <button
                    key={s.id}
                    className={s.id === current.id ? "active" : ""}
                    aria-pressed={s.id === current.id}
                    title={s.pending ? t("users.pending") : undefined}
                    onClick={() => choose(s)}
                  >
                    {s.name}
                    {s.pending && <> <EnvelopeSimple aria-label={t("users.pending")} /></>}
                  </button>
                ))}
              </div>
            )}
            {addButton}
          </div>

          <h3 className="lp-board-title">{t("lpd.pathOf", { name: current.name })}</h3>
          {current.pending && (
            <PendingStudentPanel
              key={`pending-${current.id}`}
              student={current}
              accounts={accounts}
              isDocent={isDocent}
              onChanged={load}
              onDeleted={async () => {
                await load();
                navigate(pathFor("leerpaden"), { replace: true });
              }}
            />
          )}
          <LeerpadBoard key={`board-${current.id}`} studentId={current.id} />
        </>
      )}
      {adding && <AddStudentDialog onClose={() => setAdding(false)} onCreated={created} />}
    </>
  );
}

/** A student's own leerpad. */
export function MijnLeerpadPage() {
  const { profile } = useAuth();
  const { t } = useI18n();
  return (
    <>
      <div className="lp-page-head">
        <h2>{t("nav.leerpad")}</h2>
      </div>
      <p className="lp-intro">{t("mine.intro")}</p>
      <LeerpadBoard studentId={profile.id} />
    </>
  );
}
