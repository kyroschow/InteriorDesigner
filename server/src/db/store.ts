import { type ClientSession, type Db, MongoClient, MongoServerError } from 'mongodb'
import type { Configuration, Floor, PlacedObject, ProjectRecord, RoomDefinition, RoomTransform } from '../domain/types.ts'
import type { EngineReport } from '../rules/engine.ts'

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

interface IdempotencyRecord {
  projectId: string
  key: string
  requestHash: string
  generationId: string
  createdAt: string
}

/** Every document keeps its record ID as `_id`; reads project `_id` away so API shapes stay unchanged. */
type Doc<T> = T & { _id: string }
const NO_ID = { projection: { _id: 0 } } as const

export const isDuplicateKeyError = (err: unknown) => err instanceof MongoServerError && err.code === 11000

export interface StoreOptions {
  uri: string
  dbName: string
}

export class Store {
  private constructor(
    private readonly client: MongoClient,
    readonly db: Db,
  ) {}

  /** Connect, require a replica set (transactions) and ensure indexes. */
  static async connect(options: StoreOptions): Promise<Store> {
    const client = new MongoClient(options.uri, { serverSelectionTimeoutMS: 5000 })
    try {
      await client.connect()
      const hello = await client.db('admin').command({ hello: 1 })
      if (!hello.setName) {
        throw new Error('MongoDB must run as a replica set because the backend uses transactions; see server/docker-compose.yml.')
      }
    } catch (err) {
      await client.close().catch(() => undefined)
      const reason = err instanceof Error ? err.message : String(err)
      throw new Error(`Cannot use MongoDB at ${options.uri.replace(/\/\/[^@/]*@/, '//***@')}: ${reason}\nStart it with: npm --prefix server run db:up`)
    }
    const store = new Store(client, client.db(options.dbName))
    await store.ensureIndexes()
    return store
  }

  private get projects() {
    return this.db.collection<Doc<ProjectRecord>>('projects')
  }
  private get assets() {
    return this.db.collection<Doc<AssetRecord>>('assets')
  }
  private get generations() {
    return this.db.collection<Doc<GenerationRecord>>('generations')
  }
  private get layouts() {
    return this.db.collection<Doc<LayoutRecord>>('layouts')
  }
  private get idempotencyKeys() {
    return this.db.collection<Doc<IdempotencyRecord>>('idempotencyKeys')
  }

  private async ensureIndexes() {
    await Promise.all([
      this.assets.createIndex({ projectId: 1 }),
      this.generations.createIndex({ projectId: 1, createdAt: -1 }),
      this.generations.createIndex({ status: 1, createdAt: 1 }),
      this.layouts.createIndex({ projectId: 1 }),
    ])
  }

  /**
   * Run `fn` in a multi-document transaction. Transient write conflicts (e.g. two
   * writers on the same project) are retried by the driver, so `fn` must re-read
   * what it checks.
   */
  async withTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = this.client.startSession()
    try {
      let result!: T
      await session.withTransaction(async () => {
        result = await fn(session)
      })
      return result
    } finally {
      await session.endSession()
    }
  }

  async ping(): Promise<{ ok: boolean; detail: string }> {
    try {
      await this.db.command({ ping: 1 })
      return { ok: true, detail: `mongodb ${this.db.databaseName}` }
    } catch (err) {
      return { ok: false, detail: err instanceof Error ? err.message : String(err) }
    }
  }

  async close(options: { dropDatabase?: boolean } = {}) {
    if (options.dropDatabase) await this.db.dropDatabase()
    await this.client.close()
  }

  // Projects ------------------------------------------------------------------

  async getProject(id: string, session?: ClientSession): Promise<ProjectRecord | null> {
    return (await this.projects.findOne({ _id: id }, { ...NO_ID, session })) as ProjectRecord | null
  }

  async insertProject(p: ProjectRecord, session?: ClientSession): Promise<void> {
    await this.projects.insertOne({ _id: p.id, ...p }, { session })
  }

  async saveProject(p: ProjectRecord, session?: ClientSession): Promise<void> {
    // The replacement keeps the existing _id.
    await this.projects.replaceOne({ _id: p.id }, { ...p }, { session })
  }

  /**
   * Write to the project document without changing it, so concurrent
   * transactions that must not interleave (e.g. two generation requests) conflict.
   */
  async lockProject(id: string, session: ClientSession): Promise<void> {
    await this.projects.updateOne({ _id: id }, { $set: { lockedAt: new Date().toISOString() } as never }, { session })
  }

  // Assets --------------------------------------------------------------------

  async insertAsset(a: AssetRecord, session?: ClientSession): Promise<void> {
    await this.assets.insertOne({ _id: a.id, ...a }, { session })
  }

  async getAsset(projectId: string, id: string): Promise<AssetRecord | null> {
    return (await this.assets.findOne({ _id: id, projectId }, NO_ID)) as AssetRecord | null
  }

  // Generations ---------------------------------------------------------------

  async insertGeneration(g: GenerationRecord, session?: ClientSession): Promise<void> {
    await this.generations.insertOne({ _id: g.id, ...g }, { session })
  }

  async updateGeneration(g: GenerationRecord, session?: ClientSession): Promise<void> {
    const { status, stage, progress, issues, errorCode, layoutId, startedAt, finishedAt } = g
    await this.generations.updateOne({ _id: g.id }, { $set: { status, stage, progress, issues, errorCode, layoutId, startedAt, finishedAt } }, { session })
  }

  async getGeneration(projectId: string, id: string, session?: ClientSession): Promise<GenerationRecord | null> {
    return (await this.generations.findOne({ _id: id, projectId }, { ...NO_ID, session })) as GenerationRecord | null
  }

  async latestGeneration(projectId: string): Promise<GenerationRecord | null> {
    return (await this.generations.findOne({ projectId }, { ...NO_ID, sort: { createdAt: -1, _id: -1 } })) as GenerationRecord | null
  }

  /** Atomically take the oldest queued generation and mark it running. */
  async claimNextQueued(now: string): Promise<GenerationRecord | null> {
    return (await this.generations.findOneAndUpdate(
      { status: 'queued' },
      { $set: { status: 'running', stage: 'selecting', startedAt: now } },
      { ...NO_ID, sort: { createdAt: 1, _id: 1 }, returnDocument: 'after' },
    )) as GenerationRecord | null
  }

  async findActiveGeneration(
    projectId: string,
    scope: GenerationScope,
    revision: number,
    configurationRevision: number,
    session?: ClientSession,
  ): Promise<GenerationRecord | null> {
    const scopeFilter = scope.kind === 'home' ? { 'scope.kind': 'home' } : { 'scope.kind': 'room', 'scope.roomId': scope.roomId }
    return (await this.generations.findOne(
      { projectId, status: { $in: ['queued', 'running'] }, inputRevision: revision, inputConfigurationRevision: configurationRevision, ...scopeFilter },
      { ...NO_ID, session },
    )) as GenerationRecord | null
  }

  /** On startup: a job that was running when the process died cannot resume. */
  async failInterruptedGenerations(now: string): Promise<number> {
    const result = await this.generations.updateMany(
      { status: 'running' },
      {
        $set: {
          status: 'failed',
          errorCode: 'ENGINE_ERROR',
          finishedAt: now,
          issues: [{ code: 'INTERRUPTED', message: 'The server restarted while this generation was running.' }],
        },
      },
    )
    return result.modifiedCount
  }

  // Layouts -------------------------------------------------------------------

  async insertLayout(l: LayoutRecord, session?: ClientSession): Promise<void> {
    await this.layouts.insertOne({ _id: l.id, ...l }, { session })
  }

  async getLayout(projectId: string, id: string, session?: ClientSession): Promise<LayoutRecord | null> {
    return (await this.layouts.findOne({ _id: id, projectId }, { ...NO_ID, session })) as LayoutRecord | null
  }

  // Idempotency ---------------------------------------------------------------

  async getIdempotency(projectId: string, key: string, session?: ClientSession): Promise<{ requestHash: string; generationId: string } | null> {
    const doc = await this.idempotencyKeys.findOne({ _id: `${projectId}:${key}` }, { session })
    return doc ? { requestHash: doc.requestHash, generationId: doc.generationId } : null
  }

  /** Throws a duplicate-key error (see isDuplicateKeyError) if the key already exists. */
  async insertIdempotency(projectId: string, key: string, requestHash: string, generationId: string, now: string, session?: ClientSession): Promise<void> {
    await this.idempotencyKeys.insertOne({ _id: `${projectId}:${key}`, projectId, key, requestHash, generationId, createdAt: now }, { session })
  }
}
