import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getCurrentUser, login } from './api/authApi'
import { ApiError, apiUrl } from './api/httpClient'
import Dashboard from './components/Dashboard'
import FieldWorkspace from './components/FieldWorkspace'
import PortalDashboard from './components/PortalDashboard'
import type { User } from './types/auth.types'
import { validateLogin } from './utils/validators'
import './App.css'

const sessionKey = 'heno-motita-access-token'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const accessToken = sessionStorage.getItem(sessionKey)

  useEffect(() => {
    const token = sessionStorage.getItem(sessionKey)

    if (!token) {
      setLoading(false)
      return
    }

    getCurrentUser(token)
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => sessionStorage.removeItem(sessionKey))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const validationError = validateLogin(email, password)

    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)

    try {
      const response = await login(email, password)
      sessionStorage.setItem(sessionKey, response.accessToken)
      setUser(response.user)
      setPassword('')
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'No fue posible conectar con la API.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(sessionKey)
    setUser(null)
    setEmail('')
    setPassword('')
  }

  if (loading) {
    return <main className="app-shell"><p>Validando sesión...</p></main>
  }

  return (
    <main className="app-shell">
      <section className="brand-panel">
        <p className="eyebrow">Monitoreo ambiental</p>
        <h1>Heno Motita</h1>
        <p>Gestión de cuadrillas y observaciones Hawksworth para el monitoreo de líquenes.</p>
        <p className="api-status"><span /> API configurada</p>
      </section>

      <section className="content-panel">
        {user && accessToken ? (
          <>
            <div className="session-card">
            <p className="eyebrow">Sesión activa</p>
            <h2>Bienvenido, {user.name}</h2>
            <dl>
              <div><dt>Correo</dt><dd>{user.email}</dd></div>
              <div><dt>Rol</dt><dd>{user.role}</dd></div>
              <div><dt>Estado</dt><dd>{user.status}</dd></div>
            </dl>
            <button type="button" className="secondary-button" onClick={handleLogout}>Cerrar sesión</button>
            </div>
            <Dashboard accessToken={accessToken} user={user} onUnauthorized={handleLogout} />
            <PortalDashboard accessToken={accessToken} user={user} onUnauthorized={handleLogout} />
            <FieldWorkspace accessToken={accessToken} user={user} onUnauthorized={handleLogout} />
          </>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div>
              <p className="eyebrow">Acceso al sistema</p>
              <h2>Iniciar sesión</h2>
              <p className="form-description">Ingresa con las credenciales proporcionadas por la administración.</p>
            </div>
            <label>
              Correo electrónico
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={40} required />
            </label>
            <label>
              Contraseña
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" minLength={8} maxLength={12} required />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" disabled={submitting}>{submitting ? 'Validando acceso...' : 'Entrar al sistema'}</button>
          </form>
        )}
        <p className="endpoint">Conectado a <code>{apiUrl}</code></p>
      </section>
    </main>
  )
}

export default App
