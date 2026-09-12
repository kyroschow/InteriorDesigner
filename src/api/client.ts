/**
 * The only way screens talk to the backend (server/). Paths, methods and bodies
 * follow docs/design; types live in src/types/interior.ts.
 *
 * Requests go to VITE_API_BASE_URL + /api/v1. Leave the base URL blank to go
 * through the Vite dev proxy (API_PROXY_TARGET): the server sends no CORS
 * headers, so the browser has to stay same-origin.
 */
import type {
  ApiErrorBody,
  ApiErrorDetail,
  Asset,
  CreateGenerationRequest,
  CreateGenerationResponse,
  CreateProjectRequest,
  FurnitureResponse,
  Generation,
  Layout,
  ObjectType,
  Project,
  ReplaceConfigurationRequest,
  ReplaceRoomsRequest,
  RoomType,
  RulesResponse,
  UpdateProjectRequest,
  UpdateRoomNoteRequest,
} from '@/types/interior'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: ApiErrorDetail[] = [],
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const isConflict = (err: unknown): err is ApiError => err instanceof ApiError && err.status === 409
export const isAbort = (err: unknown) => err instanceof DOMException && err.name === 'AbortError'

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
const BASE_URL = `${API_ORIGIN}/api/v1`

/** Absolute href for server-issued paths such as `Asset.downloadUrl`. */
export const apiHref = (path: string) => (path.startsWith('/') ? `${API_ORIGIN}${path}` : path)

interface RequestOptions {
  json?: unknown
  form?: FormData
  headers?: Record<string, string>
  signal?: AbortSignal
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  let body: BodyInit | undefined
  if (options.form) body = options.form
  else if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.json)
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { method, headers, body, signal: options.signal })
  } catch (err) {
    if (isAbort(err)) throw err
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check that the backend is running and try again.')
  }

  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new ApiError(response.status, 'BAD_RESPONSE', `The server sent a response that could not be read (HTTP ${response.status}).`)
    }
  }
  if (!response.ok) {
    const error = (data as ApiErrorBody | null)?.error
    throw new ApiError(response.status, error?.code ?? `HTTP_${response.status}`, error?.message || response.statusText || 'Request failed.', error?.details ?? [])
  }
  return data as T
}

const project = (id: string) => `/projects/${encodeURIComponent(id)}`

export interface FurnitureQuery {
  roomType?: RoomType
  objectType?: ObjectType
  color?: string
  maxPriceMinor?: number
  maxWidthM?: number
  maxDepthM?: number
  maxHeightM?: number
}

export const api = {
  createProject: (body: CreateProjectRequest) => request<Project>('POST', '/projects', { json: body }),

  getProject: (id: string, signal?: AbortSignal) => request<Project>('GET', project(id), { signal }),

  updateProject: (id: string, body: UpdateProjectRequest) => request<Project>('PATCH', project(id), { json: body }),

  uploadFloorPlan: (id: string, expectedRevision: number, file: File) => {
    const form = new FormData()
    form.set('expectedRevision', String(expectedRevision))
    form.set('file', file)
    return request<Asset>('POST', `${project(id)}/floor-plan`, { form })
  },

  replaceRooms: (id: string, body: ReplaceRoomsRequest) => request<Project>('PUT', `${project(id)}/rooms`, { json: body }),

  replaceConfiguration: (id: string, body: ReplaceConfigurationRequest) => request<Project>('PUT', `${project(id)}/configuration`, { json: body }),

  updateRoomNote: (id: string, roomId: string, body: UpdateRoomNoteRequest) =>
    request<Project>('PATCH', `${project(id)}/rooms/${encodeURIComponent(roomId)}/note`, { json: body }),

  createGeneration: (id: string, body: CreateGenerationRequest, idempotencyKey: string) =>
    request<CreateGenerationResponse>('POST', `${project(id)}/generations`, { json: body, headers: { 'Idempotency-Key': idempotencyKey } }),

  getGeneration: (id: string, generationId: string, signal?: AbortSignal) =>
    request<Generation>('GET', `${project(id)}/generations/${encodeURIComponent(generationId)}`, { signal }),

  getLayout: (id: string, layoutId: string, signal?: AbortSignal) => request<Layout>('GET', `${project(id)}/layouts/${encodeURIComponent(layoutId)}`, { signal }),

  getFurniture: (query: FurnitureQuery = {}, signal?: AbortSignal) => {
    const params = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
    const qs = params.toString()
    return request<FurnitureResponse>('GET', `/furniture${qs ? `?${qs}` : ''}`, { signal })
  },

  getRules: (signal?: AbortSignal) => request<RulesResponse>('GET', '/rules', { signal }),
}
