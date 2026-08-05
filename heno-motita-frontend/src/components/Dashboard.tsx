import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  createManager,
  listCrews,
  listManagers,
  listStudentHistory,
} from "../api/adminApi";
import { registerStudentsBatch, updateStudentStatus } from "../api/alumnosApi";
import { updateManagerStatus } from "../api/encargadosApi";
import { createCrew, updateCrewStatus } from "../api/cuadrillasApi";
import { ApiError } from "../api/httpClient";
import FieldWorkspace from "./FieldWorkspace";
import type { Crew, Manager, StudentHistoryItem } from "../types/admin.types";
import type { CrewInput, StudentInput } from "../types/resources.types";
import type { User } from "../types/auth.types";
import {
  isValidName,
  normalizeName,
  validateManager,
} from "../utils/validators";

type Section = "overview" | "managers" | "crews" | "students" | "field";
type Status = "ACTIVE" | "INACTIVE" | "CANCELLED";

interface DashboardProps {
  accessToken: string;
  user: User;
  onUnauthorized: () => void;
}

const defaultManager = {
  name: "",
  email: "",
  password: "",
  phone: "",
  institution: "",
};
const defaultCrew: CrewInput = {
  name: "",
  description: "",
  zone: "",
  institution: "",
  managerId: "",
  startAt: "",
  endAt: "",
  studentLimit: 1,
};
const defaultStudent: StudentInput = { name: "", email: "", enrollment: "" };
const statusLabels: Record<Status, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  CANCELLED: "Cancelado",
};

function Dashboard({ accessToken, user, onUnauthorized }: DashboardProps) {
  const [section, setSection] = useState<Section>("overview");
  const [managers, setManagers] = useState<Manager[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [students, setStudents] = useState<StudentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [managerForm, setManagerForm] = useState(defaultManager);
  const [showManagerForm, setManagerFormOpen] = useState(false);
  const [creatingManager, setCreatingManager] = useState(false);
  const [crewForm, setCrewForm] = useState(defaultCrew);
  const [showCrewForm, setCrewFormOpen] = useState(false);
  const [creatingCrew, setCreatingCrew] = useState(false);
  const [studentForm, setStudentForm] = useState(defaultStudent);
  const [studentCrewId, setStudentCrewId] = useState("");
  const [showStudentForm, setStudentFormOpen] = useState(false);
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [managerData, crewData, studentData] = await Promise.all([
        listManagers(accessToken),
        listCrews(accessToken),
        listStudentHistory(accessToken),
      ]);
      setManagers(managerData.managers);
      setCrews(crewData.crews);
      setStudents(studentData.students);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401)
        return onUnauthorized();
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No fue posible cargar la información.",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, onUnauthorized]);

  useEffect(() => {
    if (user.role === "SUPER_ADMIN") void loadData();
    else setLoading(false);
  }, [loadData, user.role]);

  async function handleCreateManager(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingManager(true);
    setError("");
    setNotice("");
    const validationError = validateManager(managerForm);
    if (validationError) {
      setError(validationError);
      setCreatingManager(false);
      return;
    }
    try {
      const response = await createManager(accessToken, {
        ...managerForm,
        name: managerForm.name.trim(),
        email: managerForm.email.trim().toLowerCase(),
        phone: managerForm.phone.trim(),
        institution: managerForm.institution.trim(),
      });
      setManagers((current) => [response.manager, ...current]);
      setManagerForm(defaultManager);
      setManagerFormOpen(false);
      setNotice(response.message);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401)
        return onUnauthorized();
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No fue posible crear el encargado.",
      );
    } finally {
      setCreatingManager(false);
    }
  }

  async function handleCreateCrew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingCrew(true);
    setError("");
    setNotice("");
    const crew = {
      ...crewForm,
      name: crewForm.name.trim(),
      description: crewForm.description.trim(),
      zone: crewForm.zone.trim(),
      institution: crewForm.institution.trim(),
    };
    if (
      !isValidName(crew.name, 3, 80) ||
      !crew.zone ||
      !crew.institution ||
      !crew.managerId ||
      !crew.startAt ||
      !crew.endAt
    ) {
      setError(
        "Completa los campos obligatorios; el nombre debe contener de 3 a 80 letras.",
      );
      setCreatingCrew(false);
      return;
    }
    if (new Date(crew.endAt) <= new Date(crew.startAt)) {
      setError("La fecha de término debe ser posterior a la fecha de inicio.");
      setCreatingCrew(false);
      return;
    }
    try {
      const response = await createCrew(accessToken, {
        ...crew,
        startAt: new Date(`${crew.startAt}T00:00:00.000Z`).toISOString(),
        endAt: new Date(`${crew.endAt}T00:00:00.000Z`).toISOString(),
      });
      const manager = managers.find((item) => item.id === crew.managerId);
      setCrews((current) => [
        { ...response.crew, manager: response.crew.manager ?? manager },
        ...current,
      ]);
      setCrewForm(defaultCrew);
      setCrewFormOpen(false);
      setNotice(response.message);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401)
        return onUnauthorized();
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No fue posible crear la cuadrilla.",
      );
    } finally {
      setCreatingCrew(false);
    }
  }

  async function handleCreateStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingStudent(true);
    setError("");
    setNotice("");
    const student = {
      name: studentForm.name.trim(),
      email: studentForm.email.trim().toLowerCase(),
      enrollment: studentForm.enrollment.trim(),
    };
    if (
      !studentCrewId ||
      !isValidName(student.name, 3, 80) ||
      !student.enrollment ||
      !/^[A-Za-z0-9]+$/.test(student.enrollment) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)
    ) {
      setError(
        "Completa una cuadrilla, nombre de 3 a 80 letras, correo válido y matrícula alfanumérica.",
      );
      setCreatingStudent(false);
      return;
    }
    try {
      const response = await registerStudentsBatch(accessToken, studentCrewId, [
        student,
      ]);
      const history = await listStudentHistory(accessToken);
      setStudents(history.students);
      setStudentForm(defaultStudent);
      setStudentCrewId("");
      setStudentFormOpen(false);
      setNotice(`${response.message} El código de activación se envió al correo del alumno.`);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401)
        return onUnauthorized();
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No fue posible registrar al alumno.",
      );
    } finally {
      setCreatingStudent(false);
    }
  }

  async function changeManagerStatus(managerId: string, status: Status) {
    setUpdatingStatus(managerId);
    setError("");
    setNotice("");
    try {
      const response = await updateManagerStatus(
        accessToken,
        managerId,
        status,
      );
      setManagers((current) =>
        current.map((manager) =>
          manager.id === managerId ? response.manager : manager,
        ),
      );
      setNotice(response.message);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401)
        return onUnauthorized();
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No fue posible actualizar el estado del encargado.",
      );
    } finally {
      setUpdatingStatus("");
    }
  }

  async function changeCrewStatus(crewId: string, status: Status) {
    setUpdatingStatus(crewId);
    setError("");
    setNotice("");
    try {
      const response = await updateCrewStatus(accessToken, crewId, status);
      setCrews((current) =>
        current.map((crew) =>
          crew.id === crewId ? { ...crew, ...response.crew } : crew,
        ),
      );
      setNotice(response.message);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401)
        return onUnauthorized();
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No fue posible actualizar el estado de la cuadrilla.",
      );
    } finally {
      setUpdatingStatus("");
    }
  }

  async function changeStudentStatus(studentId: string, status: Status) {
    setUpdatingStatus(studentId);
    setError("");
    setNotice("");
    try {
      const response = await updateStudentStatus(
        accessToken,
        studentId,
        status,
      );
      setStudents((current) =>
        current.map((item) =>
          item.student.id === studentId
            ? { ...item, student: { ...item.student, ...response.student } }
            : item,
        ),
      );
      setNotice(response.message);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401)
        return onUnauthorized();
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No fue posible actualizar el estado del alumno.",
      );
    } finally {
      setUpdatingStatus("");
    }
  }

  if (user.role !== "SUPER_ADMIN")
    return (
      <section className="restricted-panel">
        <h2>Sesión verificada</h2>
        <p>
          Tu rol es {user.role}. Las operaciones disponibles se habilitarán
          según los permisos asignados por la API.
        </p>
      </section>
    );

  const openManagerForm = (value: boolean) => {
    if (value) setManagerFormOpen(true);
  };
  const openCrewForm = (value: boolean) => {
    if (value) setCrewFormOpen(true);
  };
  const openStudentForm = (value: boolean) => {
    if (value) setStudentFormOpen(true);
  };
  const setShowManagerForm = openManagerForm;
  const setShowCrewForm = openCrewForm;
  const setShowStudentForm = openStudentForm;

  return (
    <section className="dashboard">
      <nav className="dashboard-nav" aria-label="Módulos administrativos">
        {(
          ["overview", "managers", "crews", "students", "field"] as Section[]
        ).map((item) => (
          <button
            key={item}
            className={section === item ? "active" : ""}
            type="button"
            onClick={() => setSection(item)}
          >
            {
              {
                overview: "Resumen",
                managers: "Encargados",
                crews: "Cuadrillas",
                students: "Alumnos",
                field: "Árboles y observaciones",
              }[item]
            }
          </button>
        ))}
      </nav>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h2>
            {section === "overview"
              ? "Vista general"
              : {
                  managers: "Encargados",
                  crews: "Cuadrillas",
                  students: "Historial de alumnos",
                  field: "Árboles y observaciones",
                }[section]}
          </h2>
        </div>
        <div className="dashboard-actions">
          {section === "managers" && (
            <button
              type="button"
              className="dashboard-create-button"
              onClick={() => setManagerFormOpen(true)}
            >
              Registrar encargado
            </button>
          )}
          {section === "crews" && (
            <button
              type="button"
              className="dashboard-create-button"
              onClick={() => setCrewFormOpen(true)}
              disabled={!managers.length}
            >
              Registrar cuadrilla
            </button>
          )}
          {section === "students" && (
            <button
              type="button"
              className="dashboard-create-button"
              onClick={() => setStudentFormOpen(true)}
              disabled={!crews.length}
            >
              Registrar alumno
            </button>
          )}
          <button
            type="button"
            className="refresh-button"
            onClick={() => void loadData()}
            disabled={loading}
          >
            Actualizar
          </button>
        </div>
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
      {section === "field" && (
        <FieldWorkspace
          accessToken={accessToken}
          user={user}
          onUnauthorized={onUnauthorized}
        />
      )}
      {loading ? (
        <p>Cargando información protegida...</p>
      ) : (
        <DashboardContent
          section={section}
          managers={managers}
          crews={crews}
          students={students}
          managerForm={managerForm}
          setManagerForm={setManagerForm}
          showManagerForm={showManagerForm}
          setShowManagerForm={setShowManagerForm}
          creatingManager={creatingManager}
          onCreateManager={handleCreateManager}
          crewForm={crewForm}
          setCrewForm={setCrewForm}
          showCrewForm={showCrewForm}
          setShowCrewForm={setShowCrewForm}
          creatingCrew={creatingCrew}
          onCreateCrew={handleCreateCrew}
          studentForm={studentForm}
          setStudentForm={setStudentForm}
          studentCrewId={studentCrewId}
          setStudentCrewId={setStudentCrewId}
          showStudentForm={showStudentForm}
          setShowStudentForm={setShowStudentForm}
          creatingStudent={creatingStudent}
          onCreateStudent={handleCreateStudent}
          updatingStatus={updatingStatus}
          onManagerStatusChange={changeManagerStatus}
          onCrewStatusChange={changeCrewStatus}
          onStudentStatusChange={changeStudentStatus}
        />
      )}
      {(showManagerForm || showCrewForm || showStudentForm) && (
        <button
          type="button"
          className={`modal-close ${showManagerForm ? "modal-close-manager" : showCrewForm ? "modal-close-crew" : "modal-close-student"}`}
          aria-label="Cerrar formulario"
          onClick={() => {
            setManagerFormOpen(false);
            setCrewFormOpen(false);
            setStudentFormOpen(false);
          }}
        >
          ×
        </button>
      )}
    </section>
  );
}

interface ContentProps {
  section: Section;
  managers: Manager[];
  crews: Crew[];
  students: StudentHistoryItem[];
  managerForm: typeof defaultManager;
  setManagerForm: (value: typeof defaultManager) => void;
  showManagerForm: boolean;
  setShowManagerForm: (value: boolean) => void;
  creatingManager: boolean;
  onCreateManager: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  crewForm: CrewInput;
  setCrewForm: (value: CrewInput) => void;
  showCrewForm: boolean;
  setShowCrewForm: (value: boolean) => void;
  creatingCrew: boolean;
  onCreateCrew: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  studentForm: StudentInput;
  setStudentForm: (value: StudentInput) => void;
  studentCrewId: string;
  setStudentCrewId: (value: string) => void;
  showStudentForm: boolean;
  setShowStudentForm: (value: boolean) => void;
  creatingStudent: boolean;
  onCreateStudent: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  updatingStatus: string;
  onManagerStatusChange: (id: string, status: Status) => Promise<void>;
  onCrewStatusChange: (id: string, status: Status) => Promise<void>;
  onStudentStatusChange: (id: string, status: Status) => Promise<void>;
}

function DashboardContent(props: ContentProps) {
  const {
    section,
    managers,
    crews,
    students,
    managerForm,
    setManagerForm,
    showManagerForm,
    setShowManagerForm,
    creatingManager,
    onCreateManager,
    crewForm,
    setCrewForm,
    showCrewForm,
    setShowCrewForm,
    creatingCrew,
    onCreateCrew,
    studentForm,
    setStudentForm,
    studentCrewId,
    setStudentCrewId,
    showStudentForm,
    setShowStudentForm,
    creatingStudent,
    onCreateStudent,
    updatingStatus,
    onManagerStatusChange,
    onCrewStatusChange,
    onStudentStatusChange,
  } = props;
  if (section === "field") return null;
  if (section === "overview")
    return (
      <div className="metrics">
        <Metric label="Encargados" value={managers.length} />
        <Metric label="Cuadrillas" value={crews.length} />
        <Metric label="Alumnos" value={students.length} />
      </div>
    );
  if (section === "managers")
    return (
      <div className="manager-section">
        <button
          type="button"
          className="manager-create-button"
          onClick={() => setShowManagerForm(!showManagerForm)}
        >
          {showManagerForm ? "Cancelar registro" : "Registrar encargado"}
        </button>
        {showManagerForm && (
          <form
            className="compact-form manager-form"
            onSubmit={(event) => void onCreateManager(event)}
          >
            <h3>Nuevo encargado</h3>
            <label>
              Nombre
              <input
                type="text"
                value={managerForm.name}
                onChange={(event) =>
                  setManagerForm({
                    ...managerForm,
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
                value={managerForm.email}
                onChange={(event) =>
                  setManagerForm({ ...managerForm, email: event.target.value })
                }
                maxLength={40}
                autoComplete="email"
                required
              />
            </label>
            <label>
              Contraseña temporal
              <input
                type="password"
                value={managerForm.password}
                onChange={(event) =>
                  setManagerForm({
                    ...managerForm,
                    password: event.target.value,
                  })
                }
                minLength={8}
                maxLength={30}
                autoComplete="new-password"
                aria-describedby="password-rules"
                required
              />
            </label>
            <p id="password-rules" className="field-help">
              8 a 30 caracteres, con mayúscula, minúscula, número y carácter
              especial.
            </p>
            <label>
              Teléfono (opcional)
              <input
                type="tel"
                value={managerForm.phone}
                onChange={(event) =>
                  setManagerForm({
                    ...managerForm,
                    phone: event.target.value.replace(/\D/g, "").slice(0, 10),
                  })
                }
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                autoComplete="tel"
              />
            </label>
            <label>
              Institución
              <input
                type="text"
                value={managerForm.institution}
                onChange={(event) =>
                  setManagerForm({
                    ...managerForm,
                    institution: event.target.value,
                  })
                }
                minLength={2}
                maxLength={160}
                autoComplete="organization"
                required
              />
            </label>
            <button disabled={creatingManager}>
              {creatingManager ? "Creando..." : "Crear encargado"}
            </button>
          </form>
        )}
        <RecordTable
          title="Encargados"
          headers={["Nombre", "Correo", "Estado"]}
          rows={managers.map((manager) => [
            manager.name,
            manager.email,
            <StatusSelect
              key={manager.id}
              status={manager.status}
              disabled={updatingStatus === manager.id}
              onChange={(status) =>
                void onManagerStatusChange(manager.id, status)
              }
            />,
          ])}
        />
      </div>
    );
  if (section === "crews")
    return (
      <div className="crew-section">
        <button
          type="button"
          className="crew-create-button"
          onClick={() => setShowCrewForm(!showCrewForm)}
          disabled={!managers.length}
        >
          {showCrewForm ? "Cancelar registro" : "Registrar cuadrilla"}
        </button>
        {!managers.length && (
          <p className="field-help">
            Registra al menos un encargado antes de crear una cuadrilla.
          </p>
        )}
        {showCrewForm && (
          <form
            className="compact-form crew-form"
            onSubmit={(event) => void onCreateCrew(event)}
          >
            <h3>Nueva cuadrilla</h3>
            <label>
              Nombre
              <input
                type="text"
                value={crewForm.name}
                onChange={(event) =>
                  setCrewForm({
                    ...crewForm,
                    name: normalizeName(event.target.value, 80),
                  })
                }
                minLength={3}
                maxLength={80}
                required
              />
            </label>
            <label>
              Zona
              <input
                type="text"
                value={crewForm.zone}
                onChange={(event) =>
                  setCrewForm({ ...crewForm, zone: event.target.value })
                }
                minLength={2}
                maxLength={160}
                required
              />
            </label>
            <label>
              Institución
              <input
                type="text"
                value={crewForm.institution}
                onChange={(event) =>
                  setCrewForm({ ...crewForm, institution: event.target.value })
                }
                minLength={2}
                maxLength={160}
                required
              />
            </label>
            <label>
              Encargado asignado
              <select
                value={crewForm.managerId}
                onChange={(event) =>
                  setCrewForm({ ...crewForm, managerId: event.target.value })
                }
                required
              >
                <option value="">Selecciona un encargado</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} ({manager.email})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Fecha de inicio
              <input
                type="date"
                value={crewForm.startAt}
                onChange={(event) =>
                  setCrewForm({ ...crewForm, startAt: event.target.value })
                }
                required
              />
            </label>
            <label>
              Fecha de término
              <input
                type="date"
                value={crewForm.endAt}
                onChange={(event) =>
                  setCrewForm({ ...crewForm, endAt: event.target.value })
                }
                min={crewForm.startAt || undefined}
                required
              />
            </label>
            <label>
              Límite de alumnos
              <input
                type="number"
                value={crewForm.studentLimit}
                onChange={(event) =>
                  setCrewForm({
                    ...crewForm,
                    studentLimit: Number(event.target.value),
                  })
                }
                min="1"
                required
              />
            </label>
            <label className="crew-description">
              Descripción (opcional)
              <textarea
                value={crewForm.description}
                onChange={(event) =>
                  setCrewForm({ ...crewForm, description: event.target.value })
                }
                maxLength={1000}
              />
            </label>
            <button disabled={creatingCrew}>
              {creatingCrew ? "Registrando..." : "Crear cuadrilla"}
            </button>
          </form>
        )}
        <RecordTable
          title="Cuadrillas"
          headers={["Nombre", "Zona", "Encargado", "Estado"]}
          rows={crews.map((crew) => [
            crew.name,
            crew.zone,
            crew.manager?.name ?? "Sin asignar",
            <StatusSelect
              key={crew.id}
              status={crew.status}
              disabled={updatingStatus === crew.id}
              onChange={(status) => void onCrewStatusChange(crew.id, status)}
            />,
          ])}
        />
      </div>
    );
  return (
    <div className="student-section">
      <button
        type="button"
        className="student-create-button"
        onClick={() => setShowStudentForm(!showStudentForm)}
        disabled={!crews.length}
      >
        {showStudentForm ? "Cancelar registro" : "Registrar alumno"}
      </button>
      {!crews.length && (
        <p className="field-help">
          Registra una cuadrilla antes de dar de alta alumnos.
        </p>
      )}
      {showStudentForm && (
        <form
          className="compact-form student-form"
          onSubmit={(event) => void onCreateStudent(event)}
        >
          <h3>Nuevo alumno</h3>
          <label>
            Cuadrilla
            <select
              value={studentCrewId}
              onChange={(event) => setStudentCrewId(event.target.value)}
              required
            >
              <option value="">Selecciona una cuadrilla</option>
              {crews.map((crew) => (
                <option key={crew.id} value={crew.id}>
                  {crew.name} · {crew.zone}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nombre
            <input
              type="text"
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
              type="text"
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
          <button disabled={creatingStudent}>
            {creatingStudent ? "Registrando..." : "Registrar alumno"}
          </button>
        </form>
      )}
      <RecordTable
        title="Alumnos"
        headers={["Nombre", "Correo", "Matrícula", "Membresías", "Estado"]}
        rows={students.map((item) => [
          item.student.name,
          item.student.email,
          item.student.enrollment ?? "Sin matrícula",
          String(item.totalMemberships),
          <StatusSelect
            key={item.student.id}
            status={item.student.status}
            disabled={updatingStatus === item.student.id}
            onChange={(status) =>
              void onStudentStatusChange(item.student.id, status)
            }
          />,
        ])}
      />
    </div>
  );
}

function StatusSelect({
  status,
  disabled,
  onChange,
}: {
  status: Status;
  disabled: boolean;
  onChange: (status: Status) => void;
}) {
  return (
    <select
      className="status-select"
      aria-label="Cambiar estado"
      value={status}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as Status)}
    >
      {(Object.keys(statusLabels) as Status[]).map((value) => (
        <option key={value} value={value}>
          {statusLabels[value]}
        </option>
      ))}
    </select>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
function RecordTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="record-table">
      <h3>{title}</h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={index}>
                  {row.map((value, valueIndex) => (
                    <td key={valueIndex}>{value}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length}>No hay registros para mostrar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
