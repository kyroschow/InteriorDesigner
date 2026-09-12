/**
 * Mock backend persistence. One JSON document in localStorage (isolated per
 * browser origin); falls back to memory where storage is unavailable (tests,
 * private mode, quota). Re-read on every request so two tabs don't diverge.
 * Delete the `interior-api-mock-v2` key to reset the demo.
 */
import type { Asset, Finding, Generation, Layout, ProjectMode, RoomEdit, RoomTransform, SavedConfiguration, UnitSystem } from '@/types/interior'

export interface StoredProject {
  id: string
  name: string
  unitSystem: UnitSystem
  mode: ProjectMode
  revision: number
  floorPlanAssetId: string | null
  rooms: RoomEdit[]
  roomTransforms: RoomTransform[]
  configuration: SavedConfiguration
  configurationFindings: Finding[]
  activeLayoutId: string | null
  latestGenerationId: string | null
  createdAt: string
  updatedAt: string
}

export interface GenerationOutcome {
  status: 'succeeded' | 'failed'
  layout: Layout | null
  error: Generation['error']
  issues: Finding[]
  /** Per-room input fingerprints the layout satisfies; a mismatch later marks that room stale. */
  roomSignatures: Record<string, string>
}

export interface StoredGeneration {
  /** Queued snapshot; status/stage are derived from the clock until the job is settled. */
  record: Generation
  idempotencyKey: string
  payload: string
  startedMs: number
  finishMs: number
  resolved: boolean
  /** Computed at submission from the frozen inputs, revealed when the job reaches its terminal time. */
  outcome: GenerationOutcome
}

export interface MockState {
  schemaVersion: 2
  projects: Record<string, StoredProject>
  assets: Record<string, Asset>
  generations: Record<string, StoredGeneration>
  layouts: Record<string, Layout>
  layoutMeta: Record<string, { roomSignatures: Record<string, string> }>
  /** `${projectId}:${Idempotency-Key}` -> generation id */
  idempotency: Record<string, string>
}

export const STORAGE_KEY = 'interior-api-mock-v2'

const empty = (): MockState => ({
  schemaVersion: 2,
  projects: {},
  assets: {},
  generations: {},
  layouts: {},
  layoutMeta: {},
  idempotency: {},
})

let memory: MockState | null = null
let clock: () => number = () => Date.now()

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function loadState(): MockState {
  const s = storage()
  if (s) {
    try {
      const raw = s.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as MockState
        if (parsed.schemaVersion === 2) return (memory = parsed)
      }
    } catch {
      // Corrupt entry: fall through to whatever we last had in memory.
    }
  }
  return (memory ??= empty())
}

export function saveState(state: MockState): void {
  memory = state
  const s = storage()
  if (!s) return
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Quota exceeded: keep serving from memory for this session.
  }
}

export function resetMockState(): void {
  memory = empty()
  storage()?.removeItem(STORAGE_KEY)
}

/** Tests drive generation progress without sleeping. */
export function setMockClock(next: () => number): void {
  clock = next
}

export const nowMs = () => clock()
export const nowIso = () => new Date(clock()).toISOString()
export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
