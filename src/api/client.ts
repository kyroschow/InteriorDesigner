/**
 * The only way screens talk to the backend. Paths, methods and bodies follow
 * docs/design; types live in src/types/interior.ts.
 *
 * VITE_API_MODE=live sends real fetch requests to VITE_API_BASE_URL + /api/v1
 * (no fallback to mock data). Anything else uses the in-browser mock server,
 * which is lazy-loaded so it never ships in the live code path.
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

export const API_MODE: 'mock' | 'live' = import.meta.env.VITE_API_MODE === 'live' ? 'live' : 'mock'
const BASE_URL = `${(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')}/api/v1`

type Transport = (input: string, init: RequestInit) => Promise<Response>
let transport: Promise<Transport> | null = null

function getTransport(): Promise<Transport> {
  transport ??= API_MODE === 'live' ? Promise.resolve((input, init) => fetch(input, init)) : import('./mock/server').then((m) => m.mockFetch)
  return transport
}

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

  const send = await getTransport()
  let response: Response
  try {
    response = await send(`${BASE_URL}${path}`, { method, headers, body, signal: options.signal })
  } catch (err) {
    if (isAbort(err)) throw err
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your connection and try again.')
  }

  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new ApiError(response.status, 'BAD_RESPONSE', 'The server sent a response that could not be read.')
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
  objectType?: string
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

  getRules: (roomType?: RoomType, signal?: AbortSignal) => request<RulesResponse>('GET', `/rules${roomType ? `?roomType=${roomType}` : ''}`, { signal }),
}
