import { createHash } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import type { AppContext } from '../../app.ts'
import { validateConfiguration } from '../../configuration/validateConfiguration.ts'
import type { GenerationRecord, GenerationScope } from '../../db/store.ts'
import { newId } from '../../projects/service.ts'
import { AppError } from '../errors.ts'
import { validateBody } from '../validation.ts'

type Params = { projectId: string }

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

const presentGeneration = (g: GenerationRecord) => ({
  id: g.id,
  projectId: g.projectId,
  scope: g.scope,
  status: g.status,
  stage: g.stage,
  progress: g.progress,
  inputRevision: g.inputRevision,
  inputConfigurationRevision: g.inputConfigurationRevision,
  catalogVersion: g.catalogVersion,
  layoutId: g.layoutId,
  errorCode: g.errorCode,
  issues: g.issues,
  createdAt: g.createdAt,
  startedAt: g.startedAt,
  finishedAt: g.finishedAt,
})

export function generationRoutes(app: FastifyInstance, ctx: AppContext) {
  const { store, projects, catalog } = ctx

  app.post<{ Params: Params }>('/projects/:projectId/generations', async (request, reply) => {
    const { projectId } = request.params
    const body = validateBody<{ expectedRevision: number; configurationRevision: number; scope: GenerationScope }>('CreateGenerationRequest', request.body)
    const rawKey = request.headers['idempotency-key']
    if (Array.isArray(rawKey) || (rawKey !== undefined && (rawKey.length === 0 || rawKey.length > 200))) {
      throw new AppError(422, 'VALIDATION_FAILED', 'Idempotency-Key must be a single value of 1–200 characters.')
    }
    const requestHash = createHash('sha256').update(stableStringify(body)).digest('hex')

    const generation = store.tx(() => {
      const project = projects.require(projectId)
      const timestamp = new Date().toISOString()
      if (rawKey) {
        const existing = store.getIdempotency(projectId, rawKey)
        if (existing) {
          if (existing.requestHash !== requestHash) throw new AppError(409, 'IDEMPOTENCY_KEY_CONFLICT', 'This Idempotency-Key was used with a different request.')
          return store.getGeneration(projectId, existing.generationId)!
        }
      }
      projects.checkRevision(project, body.expectedRevision)
      if (project.configuration.revision !== body.configurationRevision) {
        throw new AppError(409, 'CONFIGURATION_REVISION_CONFLICT', 'The configuration changed since it was loaded; reload and retry.', [
          { code: 'CONFIGURATION_REVISION_CONFLICT', currentConfigurationRevision: project.configuration.revision },
        ])
      }
      const scope = body.scope
      if (scope.kind === 'room' && !project.rooms.some((r) => r.id === scope.roomId)) {
        throw new AppError(404, 'ROOM_NOT_FOUND', `Room ${scope.roomId} does not exist in this project.`)
      }
      const check = validateConfiguration(project.configuration, project.rooms, catalog)
      if (check.errors.length) throw new AppError(422, 'INVALID_CONFIGURATION', 'Fix the configuration before generating.', check.errors)
      if (!ctx.llm) throw new AppError(503, 'LLM_UNAVAILABLE', 'No layout model is configured (LLM_PROVIDER=none).')

      let record = store.findActiveGeneration(projectId, scope, project.revision, project.configuration.revision)
      if (!record) {
        const layout = project.activeLayoutId ? store.getLayout(projectId, project.activeLayoutId) : null
        record = {
          id: newId('gen'),
          projectId,
          status: 'queued',
          stage: null,
          scope,
          inputRevision: project.revision,
          inputConfigurationRevision: project.configuration.revision,
          catalogVersion: catalog.version,
          snapshot: {
            rooms: project.rooms,
            roomTransforms: project.roomTransforms,
            configuration: project.configuration,
            retained: scope.kind === 'room' && layout ? layout.placements.filter((p) => p.roomId !== scope.roomId) : [],
          },
          progress: { turn: 0, maxTurns: ctx.config.generation.maxTurns, turns: [] },
          issues: [],
          errorCode: null,
          layoutId: null,
          createdAt: timestamp,
          startedAt: null,
          finishedAt: null,
        }
        store.insertGeneration(record)
      }
      if (rawKey) store.insertIdempotency(projectId, rawKey, requestHash, record.id, timestamp)
      return record
    })

    ctx.queue.kick()
    return reply.status(202).send({
      generationId: generation.id,
      status: generation.status,
      statusUrl: `/api/v1/projects/${projectId}/generations/${generation.id}`,
    })
  })

  app.get<{ Params: Params & { generationId: string } }>('/projects/:projectId/generations/:generationId', async (request) => {
    projects.require(request.params.projectId)
    const g = store.getGeneration(request.params.projectId, request.params.generationId)
    if (!g) throw new AppError(404, 'GENERATION_NOT_FOUND', 'Generation not found.')
    return presentGeneration(g)
  })

  app.get<{ Params: Params & { layoutId: string } }>('/projects/:projectId/layouts/:layoutId', async (request) => {
    projects.require(request.params.projectId)
    const layout = store.getLayout(request.params.projectId, request.params.layoutId)
    if (!layout) throw new AppError(404, 'LAYOUT_NOT_FOUND', 'Layout not found.')
    return layout
  })
}
