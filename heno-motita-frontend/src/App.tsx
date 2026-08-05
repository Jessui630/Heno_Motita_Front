import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getCurrentUser, login } from "./api/authApi";
import { ApiError } from "./api/httpClient";
import Dashboard from "./components/Dashboard";
import ManagerPanel from "./components/ManagerPanel";
import StudentTokenLogin from "./components/StudentTokenLogin";
import StudentPanel from "./components/StudentPanel";
import type { LoginResponse, User } from "./types/auth.types";
import { validateLogin } from "./utils/validators";
import "./App.css";

const sessionKey = "heno-motita-access-token";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [studentLoginView, setStudentLoginView] = useState(
    () => window.location.hash === "#alumnos",
  );

  const accessToken = sessionStorage.getItem(sessionKey);

  useEffect(() => {
    const token = sessionStorage.getItem(sessionKey);

    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser(token)
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => sessionStorage.removeItem(sessionKey))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function updateView() {
      setStudentLoginView(window.location.hash === "#alumnos");
    }

    window.addEventListener("hashchange", updateView);
    return () => window.removeEventListener("hashchange", updateView);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const validationError = validateLogin(email, password);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const response = await login(email, password);
      sessionStorage.setItem(sessionKey, response.accessToken);
      setUser(response.user);
      setPassword("");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No fue posible conectar con la API.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(sessionKey);
    setUser(null);
    setEmail("");
    setPassword("");
  }

  function handleStudentAuthenticated(response: LoginResponse) {
    sessionStorage.setItem(sessionKey, response.accessToken);
    setUser(response.user);
    window.location.hash = "";
  }

  function openStudentLogin() {
    window.location.hash = "alumnos";
  }

  function openGeneralLogin() {
    window.location.hash = "";
  }

  if (loading) {
    return (
      <main className="app-shell">
        <p>Validando sesión...</p>
      </main>
    );
  }

  return (
    <main className={user ? "app-shell app-shell-authenticated" : "app-shell"}>
      {!user && (
        <section className="brand-panel">
          <p className="eyebrow">Monitoreo ambiental</p>
          <h1>Heno Motita</h1>
          <p>
            Gestión de cuadrillas y observaciones Hawksworth para el monitoreo
            de líquenes.
          </p>
        </section>
      )}

      <section className="content-panel">
        {user && accessToken ? (
          <>
            <div className="session-summary">
              <h2>Bienvenido, {user.name}</h2>
              <button
                type="button"
                className="secondary-button logout-button"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </div>
            {user.role === "SUPER_ADMIN" && (
              <Dashboard
                accessToken={accessToken}
                user={user}
                onUnauthorized={handleLogout}
              />
            )}
            {user.role === "CREW_MANAGER" && (
              <ManagerPanel
                accessToken={accessToken}
                user={user}
                onUnauthorized={handleLogout}
              />
            )}
            {user.role === "STUDENT" && (
              <StudentPanel
                accessToken={accessToken}
                user={user}
                onUnauthorized={handleLogout}
              />
            )}
          </>
        ) : studentLoginView ? (
          <StudentTokenLogin
            onAuthenticated={handleStudentAuthenticated}
            onBack={openGeneralLogin}
          />
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div>
              <p className="eyebrow">Acceso al sistema</p>
              <h2>Iniciar sesión</h2>
              <p className="form-description">
                Ingresa con las credenciales proporcionadas por la
                administración.
              </p>
            </div>
            <label>
              Correo electrónico
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                maxLength={40}
                required
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                minLength={8}
                maxLength={30}
                required
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" disabled={submitting}>
              {submitting ? "Validando acceso..." : "Entrar al sistema"}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={openStudentLogin}
            >
              Activar cuenta de alumno
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default App;
