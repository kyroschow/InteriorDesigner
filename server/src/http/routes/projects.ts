import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, open, rename, rm } from 'node:fs/promises'
import path from 'node:path'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { FastifyInstance } from 'fastify'
import type { AppContext } from '../../app.ts'
import type { Configuration, RoomDefinition, RoomTransform } from '../../domain/types.ts'
import { newId } from '../../projects/service.ts'
import { ACCEPTED_MIME_TYPES, MAX_UPLOAD_BYTES, sniffMime } from '../../uploads/sniff.ts'
import { AppError } from '../errors.ts'
import { validateBody } from '../validation.ts'

type Params = { projectId: string }

export function projectRoutes(app: FastifyInstance, ctx: AppContext) {
  const { projects, store, config } = ctx

  app.post('/projects', async (request, reply) => {
    const body = validateBody<Parameters<typeof projects.create>[0]>('CreateProjectRequest', request.body)
    const project = await projects.create(body)
    return reply.status(201).send(await projects.present(project))
  })

  app.get<{ Params: Params }>('/projects/:projectId', async (request) => projects.present(await projects.require(request.params.projectId)))

  app.patch<{ Params: Params }>('/projects/:projectId', async (request) => {
    const body = validateBody<{ expectedRevision: number; name?: string; unitSystem?: 'metric' | 'imperial' }>('UpdateProjectRequest', request.body)
    return projects.present(await projects.update(request.params.projectId, body))
  })

  app.put<{ Params: Params }>('/projects/:projectId/rooms', async (request) => {
    const body = validateBody<{ expectedRevision: number; rooms: RoomDefinition[]; roomTransforms: RoomTransform[] }>('ReplaceRoomsRequest', request.body)
    return projects.present(await projects.replaceRooms(request.params.projectId, body))
  })

  app.patch<{ Params: Params & { roomId: string } }>('/projects/:projectId/rooms/:roomId/note', async (request) => {
    const body = validateBody<{ expectedRevision: number; note: string }>('UpdateRoomNoteRequest', request.body)
    return projects.present(await projects.updateNote(request.params.projectId, request.params.roomId, body))
  })

  app.put<{ Params: Params }>('/projects/:projectId/configuration', async (request) => {
    const body = validateBody<{ expectedRevision: number; configuration: Omit<Configuration, 'revision'> }>('ReplaceConfigurationRequest', request.body)
    return projects.present(await projects.replaceConfiguration(request.params.projectId, body))
  })

  app.post<{ Params: Params }>('/projects/:projectId/floor-plan', async (request, reply) => {
    const { projectId } = request.params
    await projects.require(projectId)
    if (!request.isMultipart()) throw new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Upload the floor plan as multipart/form-data.')

    const tmpDir = path.join(config.dataDir, 'uploads', 'tmp')
    await mkdir(tmpDir, { recursive: true })
    const tmpPath = path.join(tmpDir, newId('upload'))
    let expectedRevision: string | undefined
    let file: { name: string; declaredType: string; size: number; sha256: string } | undefined

    try {
      for await (const part of request.parts()) {
        if (part.type === 'file') {
          if (part.fieldname !== 'file' || file) {
            part.file.resume()
            throw new AppError(422, 'VALIDATION_FAILED', 'Send exactly one file part named "file".')
          }
          const hash = createHash('sha256')
          let size = 0
          const tap = new Transform({
            transform(chunk: Buffer, _enc, done) {
              hash.update(chunk)
              size += chunk.length
              done(null, chunk)
            },
          })
          await pipeline(part.file, tap, createWriteStream(tmpPath))
          if (part.file.truncated) throw new AppError(413, 'PAYLOAD_TOO_LARGE', `Floor plans are limited to ${MAX_UPLOAD_BYTES / 1024 / 1024} MiB.`)
          file = { name: part.filename, declaredType: part.mimetype, size, sha256: hash.digest('hex') }
        } else if (part.fieldname === 'expectedRevision') {
          expectedRevision = String(part.value)
        } else {
          throw new AppError(422, 'VALIDATION_FAILED', `Unexpected field "${part.fieldname}".`, [{ path: part.fieldname, code: 'ADDITIONALPROPERTIES' }])
        }
      }

      const revision = expectedRevision && /^\d+$/.test(expectedRevision) ? Number(expectedRevision) : expectedRevision
      validateBody('UploadFloorPlanRequest', { expectedRevision: revision, ...(file ? { file: '<binary>' } : {}) })
      if (!file) throw new AppError(422, 'VALIDATION_FAILED', 'Missing file part.')

      const handle = await open(tmpPath, 'r')
      const head = Buffer.alloc(16)
      await handle.read(head, 0, 16, 0)
      await handle.close()
      const sniffed = sniffMime(head)
      if (!sniffed || !ACCEPTED_MIME_TYPES.includes(file.declaredType) || sniffed !== file.declaredType) {
        throw new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Floor plans must be PNG, JPEG, WebP or PDF, and the content must match the declared type.')
      }

      const assetId = newId('asset')
      const finalDir = path.join(config.dataDir, 'uploads', projectId)
      await mkdir(finalDir, { recursive: true })
      const storagePath = path.join(finalDir, assetId)
      const upload = file
      const asset = await store.withTransaction(async (session) => {
        const project = await projects.require(projectId, session)
        projects.checkRevision(project, revision as number)
        const record = {
          id: assetId,
          projectId,
          name: upload.name,
          mimeType: sniffed,
          sizeBytes: upload.size,
          sha256: upload.sha256,
          storagePath,
          createdAt: new Date().toISOString(),
        }
        await store.insertAsset(record, session)
        project.floorPlanAssetId = assetId
        project.revision += 1
        project.updatedAt = record.createdAt
        await store.saveProject(project, session)
        return record
      })
      await rename(tmpPath, storagePath)
      return reply.status(201).send({
        id: asset.id,
        name: asset.name,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        downloadUrl: `/api/v1/projects/${projectId}/assets/${asset.id}`,
      })
    } finally {
      await rm(tmpPath, { force: true })
    }
  })

  app.get<{ Params: Params & { assetId: string } }>('/projects/:projectId/assets/:assetId', async (request, reply) => {
    const asset = await store.getAsset(request.params.projectId, request.params.assetId)
    if (!asset) throw new AppError(404, 'ASSET_NOT_FOUND', 'Asset not found.')
    return reply
      .header('Content-Type', asset.mimeType)
      .header('Content-Disposition', `attachment; filename="${asset.name.replace(/["\\\r\n]/g, '_')}"`)
      .header('X-Content-Type-Options', 'nosniff')
      .send(createReadStream(asset.storagePath))
  })
}
