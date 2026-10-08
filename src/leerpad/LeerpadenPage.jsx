import { useEffect, useState } from "react";
import { useAuth } from "../auth/context";
import { useI18n } from "../i18n/context";
import { useSetUrlParams, useUrlParams } from "../hooks/useUrlParams";
import LeerpadBoard from "./LeerpadBoard";
import { listStudents } from "./api";

/** Docent and reviewers: pick a student and see their leerpad (?student=<id>). */
export default function LeerpadenPage() {
  const { role } = useAuth();
  const { t } = useI18n();
  const { student: studentParam } = useUrlParams();
  const setUrlParams = useSetUrlParams();
  const [students, setStudents] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    listStudents()
      .then(setStudents)
      .catch((e) => {
        setError(e.message);
        setStudents([]);
      });
  }, []);

  const current = students?.find((s) => s.id === studentParam) || students?.[0];

  return (
    <>
      <div className="lp-page-head">
        <h2>{t("nav.leerpaden")}</h2>
        {students && <span className="result-count">{t("lpd.students", { n: students.length })}</span>}
      </div>
      <p className="lp-intro">
        {t("lpd.intro")} {role === "docent" ? t("lpd.introDocent") : t("lpd.introReviewer")}
      </p>
      {error && <div className="lp-error">{error}</div>}
      {students === null ? (
        <p className="dim">{t("common.loading")}</p>
      ) : students.length === 0 ? (
        <p className="dim">
          {t("lpd.none")}
        </p>
      ) : (
        <>
          <div className="lp-students" role="group" aria-label={t("lp.student")}>
            {students.map((s) => (
              <button
                key={s.id}
                className={s.id === current.id ? "active" : ""}
                aria-pressed={s.id === current.id}
                onClick={() => setUrlParams({ student: s.id })}
              >
                {s.display_name || s.email}
              </button>
            ))}
          </div>
          <LeerpadBoard key={current.id} studentId={current.id} />
        </>
      )}
    </>
  );
}

/** A student's own leerpad. */
export function MijnLeerpadPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  return (
    <>
      <div className="lp-page-head">
        <h2>{t("nav.leerpad")}</h2>
      </div>
      <p className="lp-intro">
        {t("mine.intro")}
      </p>
      <LeerpadBoard studentId={user.id} />
    </>
  );
}
