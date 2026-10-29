import { emit } from './eventBus.js'

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message ?? `Request failed (${status})`)
    this.status = status
    // Laravel-style validation errors: { field: [messages] }
    this.errors = body?.errors ?? {}
    this.retryAfterSeconds = body?.retryAfterSeconds ?? null
  }
}

// Round-trip time of recent API calls (paper, Table 6: Response Time, target < 500 ms).
// `serverMs` is the server's own share, read from its Server-Timing header.
const MAX_TIMINGS = 200
const timings = []

export function apiTimings() {
  return [...timings]
}

function serverDuration(response) {
  const match = /dur=([\d.]+)/.exec(response.headers.get('Server-Timing') ?? '')
  return match ? Number(match[1]) : null
}

async function request(method, path, body) {
  const started = performance.now()
  const response = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const data = await response.json().catch(() => null)

  timings.push({
    method,
    path,
    status: response.status,
    ms: Math.round((performance.now() - started) * 10) / 10,
    serverMs: serverDuration(response),
    at: new Date().toISOString(),
  })
  if (timings.length > MAX_TIMINGS) timings.shift()

  if (!response.ok) {
    // Session expired or never existed: let AuthContext clear the user so the
    // route guard sends them to /login.
    if (response.status === 401) emit('unauthenticated')
    throw new ApiError(response.status, data)
  }

  return data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body = {}) => request('POST', path, body),
  put: (path, body = {}) => request('PUT', path, body),
  patch: (path, body = {}) => request('PATCH', path, body),
  delete: (path, body) => request('DELETE', path, body),
}

export function toQuery(params) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}
