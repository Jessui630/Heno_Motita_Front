import { useState } from 'react'
import type { FormEvent } from 'react'
import { activateStudent } from '../api/alumnosApi'
import { login } from '../api/authApi'
import { ApiError } from '../api/httpClient'
import type { LoginResponse } from '../types/auth.types'

interface StudentTokenLoginProps {
  onAuthenticated: (response: LoginResponse) => void
  onBack: () => void
}

function StudentTokenLogin({ onAuthenticated, onBack }: StudentTokenLoginProps) {
  const [email, setEmail] = useState('')
  const [activationCode, setActivationCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSubmitting(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      await activateStudent(normalizedEmail, activationCode.trim().toUpperCase(), password)
      const response = await login(normalizedEmail, password)

      if (response.user.role !== 'STUDENT') {
        setError('La cuenta activada no corresponde a un alumno.')
        return
      }

      onAuthenticated(response)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'No fue posible activar la cuenta.')
    } finally {
      setSubmitting(false)
    }
  }

  return <form className="login-form" onSubmit={(event) => void handleSubmit(event)}><div><p className="eyebrow">Acceso de alumnos</p><h2>Activa tu cuenta</h2><p className="form-description">Ingresa el correo y el código de activación que recibiste al registrarte en la cuadrilla.</p></div><label>Correo electrónico<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={160} required /></label><label>Código de activación<input type="text" value={activationCode} onChange={(event) => setActivationCode(event.target.value.toUpperCase())} autoComplete="one-time-code" autoCapitalize="characters" spellCheck="false" maxLength={32} required /></label><label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} maxLength={30} required /></label><label>Confirmar contraseña<input type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} autoComplete="new-password" minLength={8} maxLength={30} required /></label>{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" disabled={submitting}>{submitting ? 'Activando cuenta...' : 'Activar y entrar'}</button><button type="button" className="secondary-button" onClick={onBack}>Ya tengo contraseña</button></form>
}

export default StudentTokenLogin
