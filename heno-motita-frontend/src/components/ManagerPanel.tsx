import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { listCrewStudents, registerStudentsBatch } from "../api/alumnosApi";
import { ApiError } from "../api/httpClient";
import { listManagerCurrentCrews } from "../api/portalApi";
import type { Student, StudentInput } from "../types/resources.types";
import type { User } from "../types/auth.types";
import { isValidName, normalizeName } from "../utils/validators";
import FieldWorkspace from "./FieldWorkspace";
import PortalDashboard from "./PortalDashboard";

type Section = "overview" | "students" | "field";

interface ManagerPanelProps {
  accessToken: string;
  user: User;
  onUnauthorized: () => void;
}

const emptyStudent: StudentInput = { name: "", email: "", enrollment: "" };

function ManagerPanel({
  accessToken,
  user,
  onUnauthorized,
}: ManagerPanelProps) {
  const [section, setSection] = useState<Section>("overview");

  return (
    <section className="manager-panel">
      <nav className="dashboard-nav" aria-label="Módulos de encargado">
        {(["overview", "students", "field"] as Section[]).map((item) => (
          <button
            key={item}
            className={section === item ? "active" : ""}
            type="button"
            onClick={() => setSection(item)}
          >
            {
              {
                overview: "Resumen",
                students: "Alumnos",
                field: "Árboles y observaciones",
              }[item]
            }
          </button>
        ))}
      </nav>
      {section === "overview" && (
        <PortalDashboard
          accessToken={accessToken}
          user={user}
          onUnauthorized={onUnauthorized}
        />
      )}
      {section === "students" && (
        <ManagerStudents
          accessToken={accessToken}
          onUnauthorized={onUnauthorized}
        />
      )}
      {section === "field" && (
        <FieldWorkspace
          accessToken={accessToken}
          user={user}
          onUnauthorized={onUnauthorized}
        />
      )}
    </section>
  );
}

function ManagerStudents({
  accessToken,
  onUnauthorized,
}: Pick<ManagerPanelProps, "accessToken" | "onUnauthorized">) {
  const [crews, setCrews] = useState<
    Array<{ id: string; name: string; zone: string }>
  >([]);
  const [crewId, setCrewId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadStudents = useCallback(
    async (selectedCrewId: string) => {
      if (!selectedCrewId) return setStudents([]);
      const data = await listCrewStudents(accessToken, selectedCrewId);
      setStudents(data.students);
    },
    [accessToken],
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await listManagerCurrentCrews(accessToken);
        const assignedCrews = data.crews.map(({ crew }) => ({
          id: crew.id,
          name: crew.name,
          zone: crew.zone,
        }));
        setCrews(assignedCrews);
        const firstCrewId = assignedCrews[0]?.id ?? "";
        setCrewId(firstCrewId);
        await loadStudents(firstCrewId);
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401)
          onUnauthorized();
        else
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : "No fue posible cargar tus cuadrillas.",
          );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [accessToken, loadStudents, onUnauthorized]);

  async function changeCrew(value: string) {
    setCrewId(value);
    setLoading(true);
    setError("");
    try {
      await loadStudents(value);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No fue posible cargar los alumnos.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function registerStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const student = {
      name: studentForm.name.trim(),
      email: studentForm.email.trim().toLowerCase(),
      enrollment: studentForm.enrollment.trim(),
    };
    if (
      !crewId ||
      !isValidName(student.name, 3, 80) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email) ||
      !/^[A-Za-z0-9]+$/.test(student.enrollment)
    ) {
      setError(
        "Completa nombre de 3 a 80 letras, correo válido y matrícula alfanumérica.",
      );
      return;
    }
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await registerStudentsBatch(accessToken, crewId, [
        student,
      ]);
      const credential = response.credentials[0];
      setStudentForm(emptyStudent);
      setShowForm(false);
      await loadStudents(crewId);
      setNotice(
        credential
          ? `${response.message} Código de activación: ${credential.activationCode}`
          : response.message,
      );
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401)
        onUnauthorized();
      else
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "No fue posible registrar al alumno.",
        );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="manager-students">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Gestión de cuadrilla</p>
          <h2>Alumnos</h2>
        </div>
        <button
          type="button"
          className="dashboard-create-button"
          onClick={() => setShowForm(true)}
          disabled={!crewId}
        >
          Registrar alumno
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <label className="crew-selector">
        Cuadrilla
        <select
          value={crewId}
          onChange={(event) => void changeCrew(event.target.value)}
          disabled={loading || !crews.length}
        >
          <option value="">
            {crews.length
              ? "Selecciona una cuadrilla"
              : "No tienes cuadrillas asignadas"}
          </option>
          {crews.map((crew) => (
            <option key={crew.id} value={crew.id}>
              {crew.name} · {crew.zone}
            </option>
          ))}
        </select>
      </label>
      {showForm && (
        <form
          className="compact-form manager-student-form"
          onSubmit={(event) => void registerStudent(event)}
        >
          <h3>Nuevo alumno</h3>
          <button
            type="button"
            className="field-modal-close"
            aria-label="Cerrar formulario de alumno"
            onClick={() => setShowForm(false)}
          >
            ×
          </button>
          <label>
            Nombre
            <input
              value={studentForm.name}
              onChange={(event) =>
                setStudentForm({
                  ...studentForm,
                  name: normalizeName(event.target.value, 80),
                })
              }
              minLength={3}
              maxLength={80}
              autoComplete="name"
              required
            />
          </label>
          <label>
            Correo
            <input
              type="email"
              value={studentForm.email}
              onChange={(event) =>
                setStudentForm({ ...studentForm, email: event.target.value })
              }
              maxLength={40}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Matrícula
            <input
              value={studentForm.enrollment}
              onChange={(event) =>
                setStudentForm({
                  ...studentForm,
                  enrollment: event.target.value
                    .replace(/[^A-Za-z0-9]/g, "")
                    .slice(0, 60),
                })
              }
              minLength={1}
              maxLength={60}
              required
            />
          </label>
          <button disabled={submitting}>
            {submitting ? "Registrando..." : "Registrar alumno"}
          </button>
        </form>
      )}
      <div className="record-table">
        <h3>Alumnos registrados</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Matrícula</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4}>Cargando alumnos...</td>
                </tr>
              ) : students.length ? (
                students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.enrollment}</td>
                    <td>
                      {
                        {
                          ACTIVE: "Activo",
                          INACTIVE: "Inactivo",
                          CANCELLED: "Cancelado",
                        }[student.status]
                      }
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    No hay alumnos registrados en esta cuadrilla.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default ManagerPanel;
