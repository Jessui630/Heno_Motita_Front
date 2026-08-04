import { useState } from 'react'
import type { FormEvent } from 'react'
import { loginStudentWithToken } from '../api/authApi'
import { ApiError } from '../api/httpClient'
import type { LoginResponse } from '../types/auth.types'

interface StudentTokenLoginProps {
  onAuthenticated: (response: LoginResponse) => void
  onBack: () => void
}

const tokenPattern = /^HM-[A-Z0-9]{4}-[A-Z0-9]{4}$/

function StudentTokenLogin({ onAuthenticated, onBack }: StudentTokenLoginProps) {
  const [token, setToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedToken = token.trim().toUpperCase()
    setError('')

    if (!tokenPattern.test(normalizedToken)) {
      setError('Ingresa un token válido con el formato HM-XXXX-XXXX.')
      return
    }

    setSubmitting(true)

    try {
      const response = await loginStudentWithToken(normalizedToken)

      if (response.user.role !== 'STUDENT') {
        setError('El token no corresponde a una cuenta de alumno.')
        return
      }

      onAuthenticated(response)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'No fue posible validar el token.')
    } finally {
      setSubmitting(false)
    }
  }

  return <form className="login-form" onSubmit={(event) => void handleSubmit(event)}><div><p className="eyebrow">Acceso de alumnos</p><h2>Ingresa con tu token</h2><p className="form-description">Usa el token de acceso proporcionado para tu registro en la cuadrilla.</p></div><label>Token de alumno<input type="text" value={token} onChange={(event) => setToken(event.target.value.toUpperCase())} placeholder="HM-L2Z8-HA7S" autoComplete="one-time-code" autoCapitalize="characters" spellCheck="false" maxLength={12} aria-describedby="student-token-format" required /></label><p id="student-token-format" className="field-help">Formato requerido: HM-XXXX-XXXX.</p>{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" disabled={submitting}>{submitting ? 'Validando token...' : 'Entrar como alumno'}</button><button type="button" className="secondary-button" onClick={onBack}>Volver al acceso general</button></form>
}

export default StudentTokenLogin
