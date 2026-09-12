import type { EngineReport } from '../rules/engine.ts'
import type { Floor, PlacedObject, ProjectRecord, RoomDefinition, RoomTransform, Configuration } from '../domain/types.ts'
import type { Database } from './database.ts'

export type GenerationScope = { kind: 'home' } | { kind: 'room'; roomId: string }
export type GenerationStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'stale'
export type GenerationStage = 'selecting' | 'placing' | 'validating'

export interface GenerationSnapshot {
  rooms: RoomDefinition[]
  roomTransforms: RoomTransform[]
  configuration: Configuration
  /** Placements outside the scope that a room run must keep unchanged. */
  retained: PlacedObject[]
}

export interface GenerationIssue {
  code: string
  message: string
  roomId?: string
  requirementId?: string
  instanceIds?: string[]
  ruleId?: string
  suggestion?: string
}

export interface TurnSummary {
  turn: number
  tool: string
  pass?: boolean
  violations?: number
  score?: number
  note?: string
  /** First few violations / argument errors, for progress displays. */
  details?: string[]
  latencyMs: number
}

export interface GenerationRecord {
  id: string
  projectId: string
  status: GenerationStatus
  stage: GenerationStage | null
  scope: GenerationScope
  inputRevision: number
  inputConfigurationRevision: number
  catalogVersion: string
  snapshot: GenerationSnapshot
  progress: { turn: number; maxTurns: number; turns: TurnSummary[] }
  issues: GenerationIssue[]
  errorCode: string | null
  layoutId: string | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
}

export interface LayoutRecord {
  id: string
  projectId: string
  generationId: string
  activated: boolean
  inputRevision: number
  inputConfigurationRevision: number
  catalogVersion: string
  scope: GenerationScope
  scene: Floor
  placements: PlacedObject[]
  totalPriceMinor: number
  currency: 'USD'
  engineReport: EngineReport
  rationale: string
  planner: string
  createdAt: string
}

export interface AssetRecord {
  id: string
  projectId: string
  name: string
  mimeType: string
  sizeBytes: number
  sha256: string
  storagePath: string
  createdAt: string
}

type Row = Record<string, unknown>

export class Store {
  constructor(readonly db: Database) {}

  tx<T>(fn: () => T): T {
    return this.db.tx(fn)
  }

  // Projects ------------------------------------------------------------------

  getProject(id: string): ProjectRecord | null {
    const row = this.db.sql.prepare('SELECT record_json FROM projects WHERE id = ?').get(id) as Row | undefined
    return row ? (JSON.parse(row.record_json as string) as ProjectRecord) : null
  }

  insertProject(p: ProjectRecord): void {
    this.db.sql
      .prepare('INSERT INTO projects (id, revision, configuration_revision, record_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(p.id, p.revision, p.configuration.revision, JSON.stringify(p), p.createdAt, p.updatedAt)
  }

  saveProject(p: ProjectRecord): void {
    this.db.sql
      .prepare('UPDATE projects SET revision = ?, configuration_revision = ?, record_json = ?, updated_at = ? WHERE id = ?')
      .run(p.revision, p.configuration.revision, JSON.stringify(p), p.updatedAt, p.id)
  }

  // Assets --------------------------------------------------------------------

  insertAsset(a: AssetRecord): void {
    this.db.sql
      .prepare('INSERT INTO assets (id, project_id, name, mime_type, size_bytes, sha256, storage_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(a.id, a.projectId, a.name, a.mimeType, a.sizeBytes, a.sha256, a.storagePath, a.createdAt)
  }

  getAsset(projectId: string, id: string): AssetRecord | null {
    const row = this.db.sql.prepare('SELECT * FROM assets WHERE project_id = ? AND id = ?').get(projectId, id) as Row | undefined
    if (!row) return null
    return {
      id: row.id as string,
      projectId: row.project_id as string,
      name: row.name as string,
      mimeType: row.mime_type as string,
      sizeBytes: row.size_bytes as number,
      sha256: row.sha256 as string,
      storagePath: row.storage_path as string,
      createdAt: row.created_at as string,
    }
  }

  // Generations ---------------------------------------------------------------

  private toGeneration(row: Row): GenerationRecord {
    return {
      id: row.id as string,
      projectId: row.project_id as string,
      status: row.status as GenerationStatus,
      stage: (row.stage as GenerationStage | null) ?? null,
      scope: JSON.parse(row.scope_json as string),
      inputRevision: row.input_revision as number,
      inputConfigurationRevision: row.input_configuration_revision as number,
      catalogVersion: row.catalog_version as string,
      snapshot: JSON.parse(row.snapshot_json as string),
      progress: JSON.parse(row.progress_json as string),
      issues: JSON.parse(row.issues_json as string),
      errorCode: (row.error_code as string | null) ?? null,
      layoutId: (row.layout_id as string | null) ?? null,
      createdAt: row.created_at as string,
      startedAt: (row.started_at as string | null) ?? null,
      finishedAt: (row.finished_at as string | null) ?? null,
    }
  }

  insertGeneration(g: GenerationRecord): void {
    this.db.sql
      .prepare(
        `INSERT INTO generations (id, project_id, status, stage, scope_json, input_revision, input_configuration_revision,
          catalog_version, snapshot_json, progress_json, issues_json, error_code, layout_id, created_at, started_at, finished_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        g.id,
        g.projectId,
        g.status,
        g.stage,
        JSON.stringify(g.scope),
        g.inputRevision,
        g.inputConfigurationRevision,
        g.catalogVersion,
        JSON.stringify(g.snapshot),
        JSON.stringify(g.progress),
        JSON.stringify(g.issues),
        g.errorCode,
        g.layoutId,
        g.createdAt,
        g.startedAt,
        g.finishedAt,
      )
  }

  updateGeneration(g: GenerationRecord): void {
    this.db.sql
      .prepare(
        `UPDATE generations SET status = ?, stage = ?, progress_json = ?, issues_json = ?, error_code = ?, layout_id = ?,
          started_at = ?, finished_at = ? WHERE id = ?`,
      )
      .run(g.status, g.stage, JSON.stringify(g.progress), JSON.stringify(g.issues), g.errorCode, g.layoutId, g.startedAt, g.finishedAt, g.id)
  }

  getGeneration(projectId: string, id: string): GenerationRecord | null {
    const row = this.db.sql.prepare('SELECT * FROM generations WHERE project_id = ? AND id = ?').get(projectId, id) as Row | undefined
    return row ? this.toGeneration(row) : null
  }

  latestGeneration(projectId: string): GenerationRecord | null {
    const row = this.db.sql
      .prepare('SELECT * FROM generations WHERE project_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1')
      .get(projectId) as Row | undefined
    return row ? this.toGeneration(row) : null
  }

  nextQueuedGeneration(): GenerationRecord | null {
    const row = this.db.sql.prepare("SELECT * FROM generations WHERE status = 'queued' ORDER BY created_at, rowid LIMIT 1").get() as Row | undefined
    return row ? this.toGeneration(row) : null
  }

  findActiveGeneration(projectId: string, scope: GenerationScope, revision: number, configurationRevision: number): GenerationRecord | null {
    const row = this.db.sql
      .prepare(
        `SELECT * FROM generations WHERE project_id = ? AND status IN ('queued', 'running') AND scope_json = ?
          AND input_revision = ? AND input_configuration_revision = ? LIMIT 1`,
      )
      .get(projectId, JSON.stringify(scope), revision, configurationRevision) as Row | undefined
    return row ? this.toGeneration(row) : null
  }

  /** On startup: a job that was running when the process died cannot resume. */
  failInterruptedGenerations(now: string): number {
    const result = this.db.sql
      .prepare(
        `UPDATE generations SET status = 'failed', error_code = 'ENGINE_ERROR', finished_at = ?,
          issues_json = '[{"code":"INTERRUPTED","message":"The server restarted while this generation was running."}]'
         WHERE status = 'running'`,
      )
      .run(now)
    return Number(result.changes)
  }

  // Layouts -------------------------------------------------------------------

  insertLayout(l: LayoutRecord): void {
    this.db.sql
      .prepare('INSERT INTO layouts (id, project_id, generation_id, activated, layout_json, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(l.id, l.projectId, l.generationId, l.activated ? 1 : 0, JSON.stringify(l), l.createdAt)
  }

  getLayout(projectId: string, id: string): LayoutRecord | null {
    const row = this.db.sql.prepare('SELECT layout_json FROM layouts WHERE project_id = ? AND id = ?').get(projectId, id) as Row | undefined
    return row ? (JSON.parse(row.layout_json as string) as LayoutRecord) : null
  }

  // Idempotency ---------------------------------------------------------------

  getIdempotency(projectId: string, key: string): { requestHash: string; generationId: string } | null {
    const row = this.db.sql.prepare('SELECT request_hash, generation_id FROM idempotency_keys WHERE project_id = ? AND key = ?').get(projectId, key) as
      | Row
      | undefined
    return row ? { requestHash: row.request_hash as string, generationId: row.generation_id as string } : null
  }

  insertIdempotency(projectId: string, key: string, requestHash: string, generationId: string, now: string): void {
    this.db.sql
      .prepare('INSERT INTO idempotency_keys (project_id, key, request_hash, generation_id, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(projectId, key, requestHash, generationId, now)
  }
}
