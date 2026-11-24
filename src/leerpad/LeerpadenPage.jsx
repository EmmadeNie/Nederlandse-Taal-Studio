import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/context";
import { useI18n } from "../i18n/context";
import { useUrlParams } from "../hooks/useUrlParams";
import { navigate, useRoute } from "../hooks/useRoute";
import { pathFor, slugify } from "../routes";
import LeerpadBoard from "./LeerpadBoard";
import { listStudents, setInLes } from "./api";
import { ChalkboardTeacher, EnvelopeSimple, ICONS } from "../icons";

/** Many students → a search field above the dropdown. */
const PICKER_THRESHOLD = 8;

/** The student last opened here, so /leerpaden opens on them again (this browser only). */
const LAST_STUDENT_KEY = "leerpaden.lastStudent";

const readLast = () => {
  try {
    return localStorage.getItem(LAST_STUDENT_KEY);
  } catch {
    return null;
  }
};

const writeLast = (id) => {
  try {
    localStorage.setItem(LAST_STUDENT_KEY, id);
  } catch {
    // Blocked storage: the page just opens on the first lesleerling next time.
  }
};

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

  // Lesleerlingen: the students the docent actually teaches, one click away.
  const taught = students?.filter((s) => s.in_les) ?? [];

  const current =
    students?.find((s) => s.slug === route.param) ||
    students?.find((s) => s.id === route.param || s.id === legacyStudentId) ||
    // Plain /leerpaden: back to the one last looked at, else the first lesleerling.
    (!route.param && students?.find((s) => s.id === readLast())) ||
    taught[0] ||
    students?.[0];

  useEffect(() => {
    if (current) writeLast(current.id);
  }, [current]);

  // Keep the address bar on the student shown (also turns old ?student=<id> links into paths).
  useEffect(() => {
    if (current && route.param !== current.slug) {
      navigate(pathFor("leerpaden", current.slug), { replace: true });
    }
  }, [current, route.param]);

  const choose = (s) => navigate(pathFor("leerpaden", s.slug));
  const shown = students?.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase())) ?? [];
  const options = shown.some((s) => s.id === current?.id) ? shown : [current, ...shown];
  const option = (s) => (
    <option key={s.id} value={s.id}>
      {s.name}
      {s.pending ? ` (${t("users.pending")})` : ""}
    </option>
  );
  const [savingInLes, setSavingInLes] = useState(false);
  const toggleInLes = async () => {
    const next = !current.in_les;
    const mark = (value) =>
      setStudents((rows) => rows.map((s) => (s.id === current.id ? { ...s, in_les: value } : s)));
    mark(next);
    setSavingInLes(true);
    setError(null);
    try {
      await setInLes(current.id, next);
    } catch (e) {
      mark(!next);
      setError(e.message);
    } finally {
      setSavingInLes(false);
    }
  };

  // Adding and inviting students happens on the Users page.
  const addButton = isDocent && (
    <button className="fb-btn-secondary" onClick={() => navigate(pathFor("users"))}>
      {t("lpd.addInUsers")}
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
          {taught.length > 0 ? (
            <div className="lp-taught" role="group" aria-label={t("lpd.taught")}>
              <span className="lp-taught-label">
                <ChalkboardTeacher aria-hidden="true" /> {t("lpd.taught")}
              </span>
              {taught.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="lp-taught-chip"
                  aria-pressed={s.id === current.id}
                  onClick={() => s.id !== current.id && choose(s)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          ) : (
            isDocent && <p className="lp-taught-hint dim">{t("lpd.taughtHint")}</p>
          )}
          <div className="lp-students-row">
            <div className="filters lp-filters">
              {students.length > PICKER_THRESHOLD && (
                <input
                  type="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder={t("lpd.searchStudent")}
                  aria-label={t("lpd.searchStudent")}
                />
              )}
              <select
                className="lp-student-select"
                value={current.id}
                onChange={(e) => choose(students.find((s) => s.id === e.target.value))}
                aria-label={t("lp.student")}
              >
                {taught.length > 0 ? (
                  <>
                    <optgroup label={t("lpd.taught")}>{options.filter((s) => s.in_les).map(option)}</optgroup>
                    <optgroup label={t("lpd.otherStudents")}>{options.filter((s) => !s.in_les).map(option)}</optgroup>
                  </>
                ) : (
                  options.map(option)
                )}
              </select>
            </div>
            {addButton}
          </div>

          <div className="lp-board-head">
            <h3 className="lp-board-title">{t("lpd.pathOf", { name: current.name })}</h3>
            {isDocent && (
              <button
                type="button"
                className="fb-btn-secondary lp-manage-btn lp-inles-btn"
                aria-pressed={!!current.in_les}
                disabled={savingInLes}
                onClick={toggleInLes}
                title={t(current.in_les ? "lpd.inLesOffTitle" : "lpd.inLesOnTitle")}
              >
                <ChalkboardTeacher weight={current.in_les ? "fill" : "regular"} aria-hidden="true" />{" "}
                {t(current.in_les ? "lpd.inLesOn" : "lpd.inLesOff")}
              </button>
            )}
            {current.pending && isDocent && (
              <button
                type="button"
                className="fb-btn-secondary lp-manage-btn"
                onClick={() => navigate(`${pathFor("users")}?uitnodigen=${encodeURIComponent(current.id)}`)}
              >
                <EnvelopeSimple aria-hidden="true" /> {t("lpd.inviteInUsers")}
              </button>
            )}
          </div>
          <LeerpadBoard key={`board-${current.id}`} studentId={current.id} />
        </>
      )}
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
        {/* The curriculum is not in a student's menu: from here they browse it to add lessons. */}
        <button type="button" className="fb-btn-secondary lp-browse" data-tour="browse" onClick={() => navigate(pathFor("lesprogramma"))}>
          <ICONS.lesprogramma aria-hidden="true" /> {t("lp.browse")}
        </button>
      </div>
      <LeerpadBoard studentId={profile.id} />
    </>
  );
}
