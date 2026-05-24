const BASE = 'http://127.0.0.1:8777'

let authToken = ''

export function setAuthToken(token: string): void {
  authToken = token
}

export function getAuthToken(): string {
  return authToken
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  if (res.status === 204) return undefined as T
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Request failed')
  }
  return res.json() as Promise<T>
}

// --- Auth ---
export type ServerUser = { username: string; role: string }

export async function login(username: string, password: string): Promise<{ token: string; username: string; role: string }> {
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
}

export async function getMe(): Promise<ServerUser> {
  return request('/api/auth/me')
}

// --- Annotations ---
export type ServerAnnotation = {
  id: number
  snapshot_id: string
  user_id: number
  role: string
  content: string
  created_at: string
}

export async function fetchAnnotations(snapshotId?: string): Promise<ServerAnnotation[]> {
  const qs = snapshotId ? `?snapshot_id=${encodeURIComponent(snapshotId)}` : ''
  return request(`/api/annotations${qs}`)
}

export async function createAnnotation(snapshotId: string, content: string): Promise<ServerAnnotation> {
  return request('/api/annotations', {
    method: 'POST',
    body: JSON.stringify({ snapshot_id: snapshotId, content }),
  })
}

export async function deleteAnnotation(id: number): Promise<void> {
  return request(`/api/annotations/${id}`, { method: 'DELETE' })
}

// --- AI ---
export type ServerBriefing = { source: string; markdown: string }

export async function generateServerBriefing(markdownInput: string, mode: string, template: string, language: string, model?: string): Promise<ServerBriefing> {
  return request('/api/ai/briefing', {
    method: 'POST',
    body: JSON.stringify({ mode, markdown_input: markdownInput, template, language, model }),
  })
}

// --- Telemetry ---
export type ServerSensorReading = {
  node_id: string
  water_level: number
  flow_rate: number
  timestamp: number
  unit: string
}

export type ServerWeatherForecast = {
  location: string
  precipitation_mm: number
  wind_speed: number
  pressure: number
  valid_from: number
  valid_to: number
}

export type ServerTelemetry = {
  basin_id: string
  fetched_at: number
  source: string
  sensors: ServerSensorReading[]
  forecast: ServerWeatherForecast[]
}

export async function fetchTelemetry(basinId: string): Promise<ServerTelemetry> {
  return request(`/api/telemetry/${basinId}`)
}
