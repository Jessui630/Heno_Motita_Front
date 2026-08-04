const apiUrl = (import.meta.env.VITE_API_URL ?? 'https://heno-motita.onrender.com/api/v1').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 15_000)

  let response: Response

  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('La API tardó demasiado en responder. Intenta nuevamente.', 408)
    }
    throw new ApiError('No fue posible conectar con la API.', 0)
  } finally {
    window.clearTimeout(timeout)
  }

  const body = await response.json().catch(() => null) as { message?: string } | null

  if (!response.ok) {
    throw new ApiError(body?.message ?? 'No fue posible completar la solicitud.', response.status)
  }

  return body as T
}

export { apiUrl }
