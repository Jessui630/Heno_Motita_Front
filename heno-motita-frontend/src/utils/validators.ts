import type { CreateManagerInput } from '../types/admin.types'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/

export function validateLogin(email: string, password: string): string | null {
  if (!emailPattern.test(email.trim()) || email.length > 40) {
    return 'Ingresa un correo electrónico válido de hasta 40 caracteres.'
  }

  if (password.length < 8 || password.length > 30) {
    return 'La contraseña debe tener entre 8 y 30 caracteres.'
  }

  return null
}

export function validateManager(manager: CreateManagerInput): string | null {
  const name = manager.name.trim()
  const institution = manager.institution.trim()
  const phone = manager.phone.trim()

  if (name.length < 3 || name.length > 120) {
    return 'El nombre debe tener entre 3 y 120 caracteres.'
  }

  if (!emailPattern.test(manager.email.trim()) || manager.email.length > 40) {
    return 'Ingresa un correo electrónico válido de hasta 40 caracteres.'
  }

  if (manager.password.length < 8 || manager.password.length > 30 || !strongPasswordPattern.test(manager.password)) {
    return 'La contraseña debe tener entre 8 y 30 caracteres e incluir mayúscula, minúscula, número y carácter especial.'
  }

  if (phone && !/^\d{10}$/.test(phone)) {
    return 'El teléfono debe contener exactamente 10 dígitos numéricos.'
  }

  if (institution.length < 2 || institution.length > 160) {
    return 'La institución debe tener entre 2 y 160 caracteres.'
  }

  return null
}
