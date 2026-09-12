import { randomUUID } from 'node:crypto'
import type { ClientSession } from 'mongodb'
import type { Catalog } from '../catalog/load.ts'
import { eligibleRooms } from '../catalog/candidates.ts'
import { validateConfiguration } from '../configuration/validateConfiguration.ts'
import type { GenerationRecord, LayoutRecord, Store } from '../db/store.ts'
import type { Configuration, ProjectRecord, RoomDefinition, RoomTransform } from '../domain/types.ts'
import { DEMO_ROOMS, DEMO_TRANSFORMS } from '../fixtures/fourRoomV1.ts'
import { AppError } from '../http/errors.ts'
import { buildFloor, validateRooms } from '../rooms/reconstruct.ts'

export const newId = (prefix: string) => `${prefix}_${randomUUID().replaceAll('-', '').slice(0, 20)}`
const now = () => new Date().toISOString()

export type RoomStatus = 'unconfigured' | 'configured' | 'generating' | 'furnished' | 'stale' | 'error'

export class ProjectService {
  constructor(
    private readonly store: Store,
    private readonly catalog: Catalog,
  ) {}

  async require(id: string, session?: ClientSession): Promise<ProjectRecord> {
    const project = await this.store.getProject(id, session)
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', `Project ${id} does not exist.`)
    return project
  }

  checkRevision(project: ProjectRecord, expectedRevision: number): void {
    if (project.revision !== expectedRevision) {
      throw new AppError(409, 'REVISION_CONFLICT', 'The project changed since it was loaded; reload and retry.', [
        { code: 'REVISION_CONFLICT', currentRevision: project.revision, currentConfigurationRevision: project.configuration.revision },
      ])
    }
  }

  /** Load, check the revision and apply `mutate` inside one transaction. */
  mutate(id: string, expectedRevision: number, mutate: (p: ProjectRecord) => void): Promise<ProjectRecord> {
    return this.store.withTransaction(async (session) => {
      const project = await this.require(id, session)
      this.checkRevision(project, expectedRevision)
      mutate(project)
      project.revision += 1
      project.updatedAt = now()
      await this.store.saveProject(project, session)
      return project
    })
  }

  private markStale(project: ProjectRecord, reason: string) {
    if (project.activeLayoutId && !project.stale) project.stale = { since: now(), reason }
  }

  async create(body: { name: string; unitSystem: 'metric' | 'imperial'; mode: 'upload' | 'scratch'; demoLayoutId: 'four-room-v1' }): Promise<ProjectRecord> {
    const timestamp = now()
    const project: ProjectRecord = {
      id: newId('prj'),
      name: body.name,
      unitSystem: body.unitSystem,
      mode: body.mode,
      demoLayoutId: body.demoLayoutId,
      revision: 1,
      floorPlanAssetId: null,
      rooms: structuredClone(DEMO_ROOMS),
      roomTransforms: structuredClone(DEMO_TRANSFORMS),
      configuration: {
        revision: 1,
        prompt: '',
        budget: null,
        requirements: [],
        roomInstructions: DEMO_ROOMS.map((r) => ({ roomId: r.id, note: '' })),
      },
      activeLayoutId: null,
      stale: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    await this.store.insertProject(project)
    return project
  }

  update(id: string, body: { expectedRevision: number; name?: string; unitSystem?: 'metric' | 'imperial' }): Promise<ProjectRecord> {
    return this.mutate(id, body.expectedRevision, (p) => {
      if (body.name !== undefined) p.name = body.name
      if (body.unitSystem !== undefined) p.unitSystem = body.unitSystem
    })
  }

  replaceRooms(id: string, body: { expectedRevision: number; rooms: RoomDefinition[]; roomTransforms: RoomTransform[] }): Promise<ProjectRecord> {
    return this.mutate(id, body.expectedRevision, (p) => {
      const details = validateRooms(body.rooms, body.roomTransforms, p.rooms.map((r) => r.id))
      if (details.length) throw new AppError(422, 'INVALID_ROOMS', 'Room geometry is invalid.', details)
      p.rooms = body.rooms.map((r) => ({ id: r.id, label: r.label, type: r.type, polygon: r.polygon }))
      p.roomTransforms = body.roomTransforms
      this.markStale(p, 'Room geometry or categories changed.')
    })
  }

  updateNote(id: string, roomId: string, body: { expectedRevision: number; note: string }): Promise<ProjectRecord> {
    return this.mutate(id, body.expectedRevision, (p) => {
      const entry = p.configuration.roomInstructions.find((ri) => ri.roomId === roomId)
      if (!entry) throw new AppError(404, 'ROOM_NOT_FOUND', `Room ${roomId} does not exist in this project.`)
      entry.note = body.note
      p.configuration.revision += 1
      this.markStale(p, `Notes for ${roomId} changed.`)
    })
  }

  replaceConfiguration(id: string, body: { expectedRevision: number; configuration: Omit<Configuration, 'revision'> }): Promise<ProjectRecord> {
    return this.mutate(id, body.expectedRevision, (p) => {
      const input = body.configuration
      const check = validateConfiguration(input, p.rooms, this.catalog)
      if (check.errors.length) throw new AppError(422, 'INVALID_CONFIGURATION', check.errors[0].message ?? 'Configuration is invalid.', check.errors)
      p.configuration = {
        revision: p.configuration.revision + 1,
        prompt: input.prompt,
        budget: input.budget ?? null,
        requirements: input.requirements.map((r) => ({ ...r, allowedColors: r.allowedColors ?? [] })),
        roomInstructions: p.rooms.map((room) => ({
          roomId: room.id,
          note: input.roomInstructions.find((ri) => ri.roomId === room.id)?.note ?? '',
        })),
      }
      this.markStale(p, 'Furniture configuration changed.')
    })
  }

  roomStatuses(project: ProjectRecord, latest: GenerationRecord | null, layout: LayoutRecord | null): { roomId: string; status: RoomStatus }[] {
    return project.rooms.map((room) => {
      const inScope = latest && (latest.scope.kind === 'home' || latest.scope.roomId === room.id)
      let status: RoomStatus = 'unconfigured'
      const configured =
        project.configuration.requirements.some((req) => req.quantity > 0 && eligibleRooms(this.catalog, req, [room]).length > 0) ||
        project.configuration.roomInstructions.some((ri) => ri.roomId === room.id && ri.note.trim() !== '')
      if (configured) status = 'configured'
      if (layout?.placements.some((pl) => pl.roomId === room.id)) status = project.stale ? 'stale' : 'furnished'
      if (inScope && latest.status === 'failed' && !layout) status = 'error'
      if (inScope && (latest.status === 'queued' || latest.status === 'running')) status = 'generating'
      return { roomId: room.id, status }
    })
  }

  async present(project: ProjectRecord) {
    const [layout, latest, asset] = await Promise.all([
      project.activeLayoutId ? this.store.getLayout(project.id, project.activeLayoutId) : null,
      this.store.latestGeneration(project.id),
      project.floorPlanAssetId ? this.store.getAsset(project.id, project.floorPlanAssetId) : null,
    ])
    const findings = validateConfiguration(project.configuration, project.rooms, this.catalog)
    return {
      id: project.id,
      name: project.name,
      unitSystem: project.unitSystem,
      mode: project.mode,
      revision: project.revision,
      layoutSource: 'demo' as const,
      layoutNotice: 'Demo layout — uploaded plan is not analyzed yet.',
      demoLayoutId: project.demoLayoutId,
      floorPlanAsset: asset && {
        id: asset.id,
        name: asset.name,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        downloadUrl: `/api/v1/projects/${project.id}/assets/${asset.id}`,
      },
      floor: buildFloor(project.rooms, project.roomTransforms, layout?.placements ?? [], (o) => o.roomId),
      roomTransforms: project.roomTransforms,
      configuration: { ...project.configuration, findings: [...findings.errors, ...findings.findings] },
      activeLayoutId: project.activeLayoutId,
      stale: project.stale,
      roomStatuses: this.roomStatuses(project, latest, layout),
      latestGeneration: latest && { id: latest.id, status: latest.status, stage: latest.stage, scope: latest.scope },
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }
  }
}
