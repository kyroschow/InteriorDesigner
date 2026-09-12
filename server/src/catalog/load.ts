import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Dimensions, ObjectType, RoomType } from '../domain/types.ts'
import { OBJECT_TYPES } from '../domain/types.ts'
import type { Side } from '../geometry/rect.ts'
import typesJson from './types.json' with { type: 'json' }

const LOADER_VERSION = 'catalog-loader@1'

export interface AccessSpec {
  sides: Side[]
  /** `any`: at least one listed side must be clear; `all`: every listed side. */
  rule: 'any' | 'all'
  depthM: number
  /** For left/right zones: skip this much from the back edge (e.g. nightstands beside a headboard). */
  insetBackM?: number
}

export interface TypeSpec {
  id: ObjectType
  label: string
  roomTypes: RoomType[]
  wallRule: 'back_to_wall' | 'free'
  access: AccessSpec[]
  inventory: { file: string; categoryPrefix?: string; roomTypes?: RoomType[] }[]
  defaults: { name: string; sizeM: Dimensions; roomTypes: RoomType[] }[]
}

export interface CatalogItem {
  id: string
  name: string
  objectType: ObjectType
  roomTypes: RoomType[]
  source: 'inventory' | 'default'
  priceMinor: number | null
  currency: 'USD'
  footprint: Dimensions
  colorName: string | null
  colorHex: string | null
  colorFamilies: string[]
  materials: string[]
  styleTags: string[]
  featureTags: string[]
  category: string | null
  url: string | null
  imageUrl: string | null
}

export interface Catalog {
  version: string
  currency: 'USD'
  types: Record<ObjectType, TypeSpec>
  items: CatalogItem[]
  skipped: { file: string; name: string; reason: string }[]
}

interface RawRecord {
  name: string
  category?: string
  url?: string
  imageUrls?: string[]
  priceCents?: number | null
  dimsMm?: { w: number | null; d: number | null; h: number | null } | null
  colorHex?: string
  colorName?: string
  materials?: string[]
  styleTags?: string[]
  featureTags?: string[]
  itemNo?: string
  description?: string
}

const COLOR_KEYWORDS: [RegExp, string][] = [
  [/off-white|white/, 'white'],
  [/black/, 'black'],
  [/gr[ae]y|anthracite/, 'gray'],
  [/beige/, 'beige'],
  [/brown|walnut/, 'brown'],
  [/pine|oak|ash|acacia|beech|birch|natural/, 'natural'],
  [/blue|turquoise/, 'blue'],
  [/green/, 'green'],
]

export const COLOR_FAMILIES = ['white', 'black', 'gray', 'beige', 'brown', 'natural', 'blue', 'green']

export function colorFamiliesFor(colorName: string | undefined): string[] {
  if (!colorName) return []
  const lower = colorName.toLowerCase()
  const families = COLOR_KEYWORDS.filter(([re]) => re.test(lower)).map(([, family]) => family)
  return [...new Set(families)]
}

function inventoryId(record: RawRecord): string | null {
  const itemNo = record.itemNo?.replace(/\D/g, '')
  if (itemNo) return `ikea-${itemNo}`
  const match = record.url?.match(/-(s?\d{8})\/?(?:[?#].*)?$/)
  return match ? `ikea-${match[1]}` : null
}

export function loadCatalog(inventoryDir: string): Catalog {
  const hash = createHash('sha256').update(LOADER_VERSION).update(JSON.stringify(typesJson))
  const types = typesJson.types as unknown as Record<ObjectType, Omit<TypeSpec, 'id'>>
  const specs = {} as Record<ObjectType, TypeSpec>
  const items: CatalogItem[] = []
  const skipped: Catalog['skipped'] = []
  const seen = new Set<string>()

  for (const type of OBJECT_TYPES) {
    const spec: TypeSpec = { id: type, ...types[type] }
    specs[type] = spec
    const coveredRooms = new Set<RoomType>()

    for (const source of spec.inventory) {
      const bytes = readFileSync(path.join(inventoryDir, source.file))
      hash.update(source.file).update(bytes)
      const records = JSON.parse(bytes.toString('utf8')) as RawRecord[]
      for (const record of records) {
        if (source.categoryPrefix && !record.category?.startsWith(source.categoryPrefix)) continue
        const dims = record.dimsMm
        if (!dims || dims.w == null || dims.d == null || dims.h == null) {
          skipped.push({ file: source.file, name: record.name, reason: 'missing dimensions' })
          continue
        }
        const id = inventoryId(record)
        if (!id) {
          skipped.push({ file: source.file, name: record.name, reason: 'no stable product number' })
          continue
        }
        if (seen.has(id)) {
          skipped.push({ file: source.file, name: record.name, reason: `duplicate id ${id}` })
          continue
        }
        seen.add(id)
        const roomTypes = source.roomTypes ?? spec.roomTypes
        roomTypes.forEach((r) => coveredRooms.add(r))
        items.push({
          id,
          name: record.description ? `${record.name} — ${record.description}` : `${record.name} ${record.category?.replaceAll('_', ' ') ?? ''}`.trim(),
          objectType: type,
          roomTypes,
          source: 'inventory',
          priceMinor: typeof record.priceCents === 'number' ? record.priceCents : null,
          currency: 'USD',
          footprint: { w: dims.w / 1000, d: dims.d / 1000, h: dims.h / 1000 },
          colorName: record.colorName ?? null,
          colorHex: record.colorHex ?? null,
          colorFamilies: colorFamiliesFor(record.colorName),
          materials: record.materials ?? [],
          styleTags: record.styleTags ?? [],
          featureTags: record.featureTags ?? [],
          category: record.category ?? null,
          url: record.url ?? null,
          imageUrl: record.imageUrls?.[0] ?? null,
        })
      }
    }

    // Standard-size generic items only for room types no real product covers.
    for (const def of spec.defaults) {
      const roomTypes = def.roomTypes.filter((r) => !coveredRooms.has(r))
      if (roomTypes.length === 0) continue
      items.push({
        id: spec.defaults.length > 1 ? `default-${type}-${roomTypes[0]}` : `default-${type}`,
        name: def.name,
        objectType: type,
        roomTypes,
        source: 'default',
        priceMinor: null,
        currency: 'USD',
        footprint: def.sizeM,
        colorName: null,
        colorHex: null,
        colorFamilies: [],
        materials: [],
        styleTags: [],
        featureTags: [],
        category: null,
        url: null,
        imageUrl: null,
      })
    }
  }

  return { version: hash.digest('hex').slice(0, 12), currency: 'USD', types: specs, items, skipped }
}
