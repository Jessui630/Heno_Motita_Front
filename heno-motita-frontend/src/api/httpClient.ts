const apiUrl = (import.meta.env.VITE_API_URL ?? 'https://heno-motita.onrender.com/api/v1').replace(/\/$/, '')

interface RequestOptions extends RequestInit {
  timeoutMs?: number
}

function normalizeUnicode(value: unknown): unknown {
  if (typeof value === 'string') return value.normalize('NFC')
  if (Array.isArray(value)) return value.map(normalizeUnicode)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeUnicode(item)]))
  }
  return value
}

function normalizeJsonBody(body: BodyInit | null | undefined): BodyInit | null | undefined {
  if (typeof body !== 'string') return body

  try {
    return JSON.stringify(normalizeUnicode(JSON.parse(body)))
  } catch {
    return body
  }
}

async function readJson(response: Response): Promise<{ message?: string } | null> {
  const bytes = await response.arrayBuffer()

  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as { message?: string }
  } catch {
    try {
      return JSON.parse(new TextDecoder('windows-1252').decode(bytes)) as { message?: string }
    } catch {
      return null
    }
  }
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController()
  const { timeoutMs = 15_000, ...fetchOptions } = options
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  const headers = new Headers(fetchOptions.headers)

  if (headers.get('Content-Type')?.startsWith('application/json')) {
    headers.set('Content-Type', 'application/json; charset=UTF-8')
  }
  headers.set('Accept', 'application/json; charset=UTF-8')

  let response: Response

  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers,
      body: normalizeJsonBody(fetchOptions.body),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('La API tardó demasiado en responder. Intenta nuevamente.', 408)
    }
    throw new ApiError('No fue posible conectar con la API.', 0)
  } finally {
    window.clearTimeout(timeout)
  }

  const body = await readJson(response)

  if (!response.ok) {
    throw new ApiError(body?.message ?? 'No fue posible completar la solicitud.', response.status)
  }

  return body as T
}

export { apiUrl }
