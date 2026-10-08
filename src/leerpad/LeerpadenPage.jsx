import { useEffect, useState } from "react";
import { useAuth } from "../auth/context";
import { useSetUrlParams, useUrlParams } from "../hooks/useUrlParams";
import LeerpadBoard from "./LeerpadBoard";
import { listStudents } from "./api";

/** Docent and reviewers: pick a student and see their leerpad (?student=<id>). */
export default function LeerpadenPage() {
  const { role } = useAuth();
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
        <h2>Leerpaden</h2>
        {students && <span className="result-count">{students.length} leerlingen</span>}
      </div>
      <p className="lp-intro">
        Elke leerling heeft een eigen leerpad.{" "}
        {role === "docent"
          ? "Zet lessen uit het lesprogramma erop, voeg zijpaden en extra's toe en houd notities bij. Leerlingen kunnen zelf lanes maken en stappen verslepen."
          : "Je kunt meekijken, maar niets aanpassen."}
      </p>
      {error && <div className="lp-error">{error}</div>}
      {students === null ? (
        <p className="dim">Laden…</p>
      ) : students.length === 0 ? (
        <p className="dim">
          Nog geen leerlingen. Iedereen die inlogt wordt automatisch leerling; je ziet ze dan hier.
        </p>
      ) : (
        <>
          <div className="lp-students" role="group" aria-label="Leerling">
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
  return (
    <>
      <div className="lp-page-head">
        <h2>Mijn leerpad</h2>
      </div>
      <p className="lp-intro">
        Je stappen voor de komende tijd. Sleep ze naar een andere lane als je ermee bezig of
        klaar bent, of maak je eigen lanes.
      </p>
      <LeerpadBoard studentId={user.id} />
    </>
  );
}
