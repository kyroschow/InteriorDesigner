/**
 * Normalizes the eight raw `inventory/*.json` files into catalog records, per
 * "Catalog ingestion and normalization plan" in request-contracts-and-selection.md.
 * Raw files stay untouched; missing values stay null (never zero or guessed).
 *
 * Mock simplification: complete dimensions are treated as demo values pending
 * human review (e.g. sofa heights that may be seat heights) and say so in
 * `reviewReasons`.
 */
import beds from '../../../inventory/beds.json'
import cabinets from '../../../inventory/cabinets.json'
import dining from '../../../inventory/dining.json'
import dresser from '../../../inventory/dresser.json'
import nightstand from '../../../inventory/nightstand.json'
import sinks from '../../../inventory/sinks.json'
import sofa from '../../../inventory/sofa.json'
import tvstand from '../../../inventory/tvstand.json'
import type { CatalogItem, FurnitureResponse, FurnitureType, RoomType } from '@/types/interior'

interface RawProduct {
  name: string
  category: string
  url: string
  imageUrls?: string[]
  priceCents?: number | null
  dimsMm?: { w?: number | null; d?: number | null; h?: number | null } | null
  colorHex?: string | null
  colorName?: string | null
  materials?: string[]
  styleTags?: string[]
  featureTags?: string[]
  itemNo?: string
  typeName?: string
  description?: string
}

const MAPPING_VERSION = 'map-v1'

export const COLOR_FAMILIES: FurnitureResponse['colorFamilies'] = [
  { id: 'white', label: 'White', hex: '#f5f5f4' },
  { id: 'beige', label: 'Beige', hex: '#d6c7a1' },
  { id: 'gray', label: 'Gray', hex: '#8a8f98' },
  { id: 'black', label: 'Black', hex: '#1f2937' },
  { id: 'brown', label: 'Brown', hex: '#7c5a3a' },
  { id: 'natural', label: 'Natural wood', hex: '#c8a27a' },
  { id: 'blue', label: 'Blue', hex: '#3b6ea5' },
  { id: 'green', label: 'Green', hex: '#5f8a6b' },
]
export const COLOR_FAMILY_IDS = COLOR_FAMILIES.map((c) => c.id)

const HUE_WORDS: Array<[RegExp, string]> = [
  [/\b(off-)?white\b/, 'white'],
  [/\bbeige\b/, 'beige'],
  [/\b(gray|grey|anthracite)\b/, 'gray'],
  [/\bblack\b/, 'black'],
  [/\b(brown|walnut)\b/, 'brown'],
  [/\b(pine|oak|beech|acacia|ash|birch|bamboo)\b/, 'natural'],
  [/\b(blue|turquoise)\b/, 'blue'],
  [/\bgreen\b/, 'green'],
]

/** "Vissle dark gray" -> [gray]; compound "black-brown" -> the final hue, [brown]; "white stained oak effect" -> [white, natural]. */
export function colorFamiliesFor(colorName: string | null | undefined): string[] {
  if (!colorName) return []
  const words = colorName
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word.includes('-') && !word.startsWith('off-') ? word.split('-').pop() ?? word : word))
    .join(' ')
  const found = HUE_WORDS.filter(([re]) => re.test(words)).map(([, id]) => id)
  return [...new Set(found)]
}

interface TypeDef {
  objectType: string
  label: string
  parent: string | null
  allowedRoomTypes: RoomType[]
}

/** Reviewed type registry; generic requests match descendants, subtype requests match only that subtype. */
const TYPE_DEFS: TypeDef[] = [
  { objectType: 'seating.sofa', label: 'Sofa (any style)', parent: null, allowedRoomTypes: ['living_room'] },
  { objectType: 'seating.sofa.standard', label: 'Sofa', parent: 'seating.sofa', allowedRoomTypes: ['living_room'] },
  { objectType: 'seating.sofa.loveseat', label: 'Loveseat', parent: 'seating.sofa', allowedRoomTypes: ['living_room'] },
  { objectType: 'seating.sofa.chaise', label: 'Sofa with chaise', parent: 'seating.sofa', allowedRoomTypes: ['living_room'] },
  { objectType: 'seating.sofa.sectional', label: 'Sectional', parent: 'seating.sofa', allowedRoomTypes: ['living_room'] },
  { objectType: 'sleep.bed', label: 'Bed (any size)', parent: null, allowedRoomTypes: ['bedroom_primary'] },
  { objectType: 'sleep.bed.queen', label: 'Queen bed', parent: 'sleep.bed', allowedRoomTypes: ['bedroom_primary'] },
  { objectType: 'sleep.bed.full', label: 'Full bed', parent: 'sleep.bed', allowedRoomTypes: ['bedroom_primary'] },
  { objectType: 'tables.nightstand', label: 'Nightstand', parent: null, allowedRoomTypes: ['bedroom_primary'] },
  { objectType: 'storage.dresser', label: 'Dresser', parent: null, allowedRoomTypes: ['bedroom_primary'] },
  { objectType: 'storage.tv_stand', label: 'TV stand', parent: null, allowedRoomTypes: ['living_room', 'bedroom_primary'] },
  { objectType: 'tables.dining_set', label: 'Dining set', parent: null, allowedRoomTypes: ['kitchen', 'living_room'] },
  { objectType: 'kitchen.cabinet', label: 'Kitchen cabinet', parent: null, allowedRoomTypes: ['kitchen'] },
  { objectType: 'bath.vanity', label: 'Bathroom vanity', parent: null, allowedRoomTypes: ['bathroom_full'] },
]

export const typeMatches = (itemType: string, requested: string) => itemType === requested || itemType.startsWith(`${requested}.`)
export const typesOverlap = (a: string, b: string) => typeMatches(a, b) || typeMatches(b, a)
export const typeDef = (objectType: string) => TYPE_DEFS.find((t) => t.objectType === objectType)

interface Mapping {
  objectType: string
  installationMode: CatalogItem['installationMode']
  components: CatalogItem['components']
  unsupported?: string
  review?: string[]
}

function mapRecord(file: string, raw: RawProduct): Mapping {
  const freestanding = (objectType: string, review: string[] = []): Mapping => ({ objectType, installationMode: 'freestanding', components: [], review })
  switch (file) {
    case 'beds.json': {
      // Size comes only from the verified description; the filename says nothing about Queen vs Full.
      const desc = raw.description ?? ''
      if (/\bQueen\b/.test(desc)) return freestanding('sleep.bed.queen')
      if (/\bFull\b/.test(desc)) return freestanding('sleep.bed.full')
      return freestanding('sleep.bed', ['Bed size is not stated in the source description.'])
    }
    case 'sofa.json':
      if (raw.category === 'loveseat') return freestanding('seating.sofa.loveseat', ['Height may be seat height; demo value pending review.'])
      if (raw.category === 'sofa_with_chaise') return { ...freestanding('seating.sofa.chaise'), review: ['Chaise needs a reviewed overall envelope before automatic placement.'] }
      if (raw.category.startsWith('sectional')) return { ...freestanding('seating.sofa.sectional'), review: ['Sectional needs a reviewed overall envelope before automatic placement.'] }
      return freestanding('seating.sofa.standard', ['Height may be seat height; demo value pending review.'])
    case 'nightstand.json':
      return freestanding('tables.nightstand')
    case 'dresser.json':
      return freestanding('storage.dresser')
    case 'tvstand.json':
      return freestanding('storage.tv_stand')
    case 'dining.json': {
      const chairs = [...raw.category.matchAll(/(\d+)_(?:swivel_)?chairs?/g)].reduce((sum, m) => sum + Number(m[1]), 0)
      return {
        objectType: 'tables.dining_set',
        installationMode: 'bundle',
        components: [
          { objectType: 'tables.dining_table', count: 1 },
          { objectType: 'seating.chair.dining', count: chairs },
        ],
        unsupported: 'Dining bundles need reviewed table/chair dimensions and clearances; excluded from MVP generation.',
      }
    }
    case 'cabinets.json': {
      const sub = raw.category.startsWith('wall') ? 'wall' : raw.category.startsWith('corner') ? 'corner' : raw.category.includes('sink') ? 'sink_base' : 'base'
      return { objectType: `kitchen.cabinet.${sub}`, installationMode: 'installed', components: [], unsupported: 'Installed kitchen cabinetry is not placed by generation yet.' }
    }
    default:
      return { objectType: 'bath.vanity', installationMode: 'installed', components: [], unsupported: 'Vanities need plumbing/installation support; not placed by generation yet.' }
  }
}

const SOURCES: Array<[string, RawProduct[]]> = [
  ['beds.json', beds as RawProduct[]],
  ['sofa.json', sofa as RawProduct[]],
  ['nightstand.json', nightstand as RawProduct[]],
  ['dresser.json', dresser as RawProduct[]],
  ['tvstand.json', tvstand as RawProduct[]],
  ['dining.json', dining as RawProduct[]],
  ['cabinets.json', cabinets as RawProduct[]],
  ['sinks.json', sinks as RawProduct[]],
]

/** FNV-1a — a stable content hash that works in the browser without async crypto. */
export function stableHash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export const CATALOG_VERSION = `catalog-${stableHash(JSON.stringify(SOURCES) + MAPPING_VERSION)}`

function catalogItemId(raw: RawProduct): string | null {
  if (raw.itemNo) return `ikea-${raw.itemNo}`
  const m = raw.url.match(/-(s?\d{8})\/?$/)
  return m ? `ikea-${m[1]}` : null
}

const mm = (v: number | null | undefined) => (typeof v === 'number' && v > 0 ? Math.round(v) / 1000 : null)

function normalize(): CatalogItem[] {
  const byId = new Map<string, { item: CatalogItem; raw: string }>()
  for (const [file, records] of SOURCES) {
    for (const raw of records) {
      const id = catalogItemId(raw)
      if (!id) continue // Needs a curated id override; never fall back to name/index.
      const mapping = mapRecord(file, raw)
      const footprint = { w: mm(raw.dimsMm?.w), d: mm(raw.dimsMm?.d), h: mm(raw.dimsMm?.h) }
      const colorFamilies = colorFamiliesFor(raw.colorName)
      const reasons = [...(mapping.review ?? [])]
      if (footprint.w === null || footprint.d === null || footprint.h === null) reasons.unshift('Missing overall dimensions; cannot be placed automatically.')
      if (typeof raw.priceCents !== 'number') reasons.push('Missing price.')
      if (colorFamilies.length === 0) reasons.push('Color family not recognized from the source color name.')

      const blocking =
        footprint.w === null ||
        footprint.d === null ||
        footprint.h === null ||
        typeof raw.priceCents !== 'number' ||
        mapping.objectType === 'sleep.bed' ||
        mapping.objectType === 'seating.sofa.chaise' ||
        mapping.objectType === 'seating.sofa.sectional'
      const selectionStatus: CatalogItem['selectionStatus'] = mapping.unsupported ? 'unsupported' : blocking ? 'needs_review' : 'eligible'
      if (mapping.unsupported) reasons.unshift(mapping.unsupported)

      const item: CatalogItem = {
        catalogItemId: id,
        name: raw.name,
        objectType: mapping.objectType,
        allowedRoomTypes: typeDef(mapping.objectType.split('.').slice(0, 2).join('.'))?.allowedRoomTypes ?? typeDef(mapping.objectType)?.allowedRoomTypes ?? [],
        priceMinor: typeof raw.priceCents === 'number' ? raw.priceCents : null,
        currency: 'USD',
        footprint,
        colorFamilies,
        colorName: raw.colorName ?? null,
        colorHex: raw.colorHex ?? null,
        materials: raw.materials ?? [],
        styleTags: raw.styleTags ?? [],
        featureTags: raw.featureTags ?? [],
        installationMode: mapping.installationMode,
        components: mapping.components,
        selectionStatus,
        reviewReasons: reasons,
        source: { file, url: raw.url, imageUrls: raw.imageUrls ?? [] },
        catalogVersion: CATALOG_VERSION,
      }
      const rawKey = JSON.stringify(raw)
      const existing = byId.get(id)
      if (!existing) byId.set(id, { item, raw: rawKey })
      else if (existing.raw !== rawKey) {
        existing.item.selectionStatus = 'needs_review'
        existing.item.reviewReasons.push('Conflicting source records share this product id.')
      }
    }
  }
  return [...byId.values()].map((v) => v.item)
}

export const CATALOG: CatalogItem[] = normalize()

export const FURNITURE_TYPES: FurnitureType[] = TYPE_DEFS.map((def) => {
  const matching = CATALOG.filter((item) => typeMatches(item.objectType, def.objectType))
  const eligible = matching.filter((item) => item.selectionStatus === 'eligible')
  const reason =
    eligible.length > 0
      ? null
      : matching.find((item) => item.selectionStatus === 'unsupported')?.reviewReasons[0] ??
        matching[0]?.reviewReasons[0] ??
        'No catalog variants for this type.'
  return { ...def, eligibleCount: eligible.length, available: eligible.length > 0, reason }
})

export const isKnownType = (objectType: string) => TYPE_DEFS.some((t) => t.objectType === objectType)

export interface FurnitureFilters {
  roomType?: string | null
  objectType?: string | null
  color?: string | null
  maxPriceMinor?: number | null
  maxWidthM?: number | null
  maxDepthM?: number | null
  maxHeightM?: number | null
}

/** `GET /furniture` query filters. Dimension/price filters exclude records whose value is unknown. */
export function filterCatalog(filters: FurnitureFilters): CatalogItem[] {
  const within = (value: number | null, max: number | null | undefined) => max == null || (value !== null && value <= max)
  return CATALOG.filter(
    (item) =>
      (!filters.roomType || item.allowedRoomTypes.includes(filters.roomType as RoomType)) &&
      (!filters.objectType || typeMatches(item.objectType, filters.objectType)) &&
      (!filters.color || item.colorFamilies.includes(filters.color)) &&
      within(item.priceMinor, filters.maxPriceMinor) &&
      within(item.footprint.w, filters.maxWidthM) &&
      within(item.footprint.d, filters.maxDepthM) &&
      within(item.footprint.h, filters.maxHeightM),
  )
}
