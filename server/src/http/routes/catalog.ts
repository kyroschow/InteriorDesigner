import type { FastifyInstance } from 'fastify'
import type { AppContext } from '../../app.ts'
import { COLOR_FAMILIES } from '../../catalog/load.ts'
import { OBJECT_TYPES, ROOM_TYPES } from '../../domain/types.ts'
import { DEFAULT_PARAMS, SAFETY_RULES } from '../../rules/engine.ts'
import { AppError, type ErrorDetail } from '../errors.ts'

type FurnitureQuery = Partial<Record<'roomType' | 'objectType' | 'color' | 'maxPriceMinor' | 'maxWidthM' | 'maxDepthM' | 'maxHeightM', string>>

export function catalogRoutes(app: FastifyInstance, ctx: AppContext) {
  const { catalog } = ctx

  app.get<{ Querystring: FurnitureQuery }>('/furniture', async (request) => {
    const q = request.query
    const details: ErrorDetail[] = []
    const oneOf = (key: keyof FurnitureQuery, allowed: readonly string[]) => {
      if (q[key] !== undefined && !allowed.includes(q[key]!)) details.push({ path: key, code: 'ENUM', message: `Allowed: ${allowed.join(', ')}.` })
    }
    const positive = (key: keyof FurnitureQuery): number | undefined => {
      if (q[key] === undefined) return undefined
      const value = Number(q[key])
      if (!Number.isFinite(value) || value <= 0) details.push({ path: key, code: 'MINIMUM', message: 'Must be a positive number.' })
      return value
    }
    oneOf('roomType', ROOM_TYPES)
    oneOf('objectType', OBJECT_TYPES)
    oneOf('color', COLOR_FAMILIES)
    const maxPrice = positive('maxPriceMinor')
    const maxW = positive('maxWidthM')
    const maxD = positive('maxDepthM')
    const maxH = positive('maxHeightM')
    if (details.length) throw new AppError(422, 'VALIDATION_FAILED', 'Invalid furniture filters.', details)

    const items = catalog.items.filter((item) => {
      if (q.roomType && !item.roomTypes.includes(q.roomType as (typeof ROOM_TYPES)[number])) return false
      if (q.objectType && item.objectType !== q.objectType) return false
      if (q.color && !item.colorFamilies.includes(q.color)) return false
      if (maxPrice !== undefined && (item.priceMinor == null || item.priceMinor > maxPrice)) return false
      if (maxW !== undefined && item.footprint.w > maxW) return false
      if (maxD !== undefined && item.footprint.d > maxD) return false
      if (maxH !== undefined && item.footprint.h > maxH) return false
      return true
    })
    return {
      version: catalog.version,
      currency: catalog.currency,
      types: Object.values(catalog.types).map((t) => ({ id: t.id, label: t.label, roomTypes: t.roomTypes })),
      items,
    }
  })

  app.get<{ Querystring: { roomType?: string } }>('/rules', async (request) => {
    const { roomType } = request.query
    if (roomType !== undefined && !ROOM_TYPES.includes(roomType as (typeof ROOM_TYPES)[number])) {
      throw new AppError(422, 'VALIDATION_FAILED', 'Invalid roomType.', [{ path: 'roomType', code: 'ENUM' }])
    }
    return {
      version: 'safety-rules@1',
      defaults: DEFAULT_PARAMS,
      items: SAFETY_RULES.map((rule) => ({ ...rule, severity: 'hard', appliesTo: { roomTypes: ROOM_TYPES }, availability: 'supported' })),
    }
  })

  let llmHealth: { at: number; value: { ok: boolean; detail: string } } | null = null
  app.get('/health', async () => {
    if (ctx.llm && (!llmHealth || Date.now() - llmHealth.at > 30_000)) {
      llmHealth = { at: Date.now(), value: await ctx.llm.health() }
    }
    return {
      ok: true,
      catalogVersion: catalog.version,
      catalogItems: catalog.items.length,
      llm: ctx.llm ? { client: ctx.llm.id, ...llmHealth!.value } : { client: null, ok: false, detail: 'LLM_PROVIDER=none' },
    }
  })
}
