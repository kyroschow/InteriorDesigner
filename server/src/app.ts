import multipart from '@fastify/multipart'
import Fastify, { type FastifyInstance } from 'fastify'
import type { Catalog } from './catalog/load.ts'
import type { AppConfig } from './config.ts'
import type { Store } from './db/store.ts'
import { registerErrorHandling } from './http/errors.ts'
import { catalogRoutes } from './http/routes/catalog.ts'
import { generationRoutes } from './http/routes/generations.ts'
import { projectRoutes } from './http/routes/projects.ts'
import type { GenerationQueue } from './jobs/queue.ts'
import type { LlmClient } from './llm/types.ts'
import { ProjectService } from './projects/service.ts'
import { MAX_UPLOAD_BYTES } from './uploads/sniff.ts'

export interface AppContext {
  config: AppConfig
  store: Store
  catalog: Catalog
  llm: LlmClient | null
  queue: GenerationQueue
  projects: ProjectService
}

export async function buildApp(deps: Omit<AppContext, 'projects'>, options: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const ctx: AppContext = { ...deps, projects: new ProjectService(deps.store, deps.catalog) }
  const app = Fastify({ logger: options.logger ?? false, bodyLimit: 1024 * 1024 })
  registerErrorHandling(app)
  await app.register(multipart, {
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 2, parts: 3 },
    throwFileSizeLimit: false,
  })
  await app.register(
    async (api) => {
      projectRoutes(api, ctx)
      catalogRoutes(api, ctx)
      generationRoutes(api, ctx)
    },
    { prefix: '/api/v1' },
  )
  return app
}
