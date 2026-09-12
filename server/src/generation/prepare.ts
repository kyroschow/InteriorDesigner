import { candidatesFor, eligibleRooms } from '../catalog/candidates.ts'
import type { Catalog, CatalogItem } from '../catalog/load.ts'
import type { GenerationIssue, GenerationRecord } from '../db/store.ts'
import type { ObjectType, PlacedObject, Room } from '../domain/types.ts'
import { mm, poseRect } from '../geometry/rect.ts'
import { buildFloor } from '../rooms/reconstruct.ts'
import { type EngineItem, type EngineReport, evaluate, roomGeometry, wallSpans } from '../rules/engine.ts'
import { type ProposedPlacement, type ResolvedPlacement, expandPlacements } from './expander.ts'

export interface InstanceSpec {
  instanceId: string
  requirementId: string
  objectType: ObjectType
  allowedRoomIds: string[]
  /** Candidate items per allowed room (hard filters applied). */
  candidates: Record<string, CatalogItem[]>
}

export interface PreparedGeneration {
  rooms: Room[]
  scopeRoomIds: string[]
  retained: PlacedObject[]
  instances: InstanceSpec[]
  budgetMinor: number | null
  prompt: string
  notes: Record<string, string>
}

const SHORTLIST = 6

export function prepareGeneration(g: GenerationRecord, catalog: Catalog): { prepared: PreparedGeneration } | { issues: GenerationIssue[] } {
  const { snapshot, scope } = g
  const config = snapshot.configuration
  const floor = buildFloor(snapshot.rooms, snapshot.roomTransforms)
  const scopeRoomIds = scope.kind === 'home' ? snapshot.rooms.map((r) => r.id) : [scope.roomId]
  const retained = scope.kind === 'home' ? [] : snapshot.retained.filter((p) => p.roomId !== scope.roomId)
  const issues: GenerationIssue[] = []
  const instances: InstanceSpec[] = []

  for (const req of config.requirements) {
    if (req.quantity === 0) continue
    let rooms = eligibleRooms(catalog, req, snapshot.rooms)
    let count = req.quantity
    const existing = new Set(retained.filter((p) => p.requirementId === req.id).map((p) => p.id))
    if (scope.kind === 'room') {
      if (req.roomId !== null && req.roomId !== scope.roomId) continue
      count = Math.max(0, req.quantity - existing.size)
      rooms = rooms.filter((r) => r.id === scope.roomId)
      if (count > 0 && rooms.length === 0) {
        issues.push({
          code: 'NO_ELIGIBLE_ROOM',
          requirementId: req.id,
          message: `${req.id} (${req.objectType}) cannot be placed in ${scope.roomId}.`,
          suggestion: 'Run generation for the whole home or assign the requirement to an eligible room.',
        })
        continue
      }
    }
    if (count === 0) continue

    const candidates: Record<string, CatalogItem[]> = {}
    const rejected: Record<string, number> = {}
    for (const room of rooms) {
      const result = candidatesFor(catalog, req, room)
      for (const [reason, n] of Object.entries(result.rejected)) rejected[reason] = (rejected[reason] ?? 0) + n
      if (result.items.length) candidates[room.id] = shortlist(result.items, `${config.prompt} ${config.roomInstructions.find((ri) => ri.roomId === room.id)?.note ?? ''}`)
    }
    if (Object.keys(candidates).length === 0) {
      issues.push({
        code: 'NO_CATALOG_MATCH',
        requirementId: req.id,
        message: `No ${req.objectType} matches the color/size limits in ${rooms.map((r) => r.id).join(', ') || 'any room'} (rejected: ${JSON.stringify(rejected)}).`,
        suggestion: 'Relax allowed colors or maximum dimensions.',
      })
      continue
    }

    let n = 1
    for (let i = 0; i < count; i++) {
      while (existing.has(`${req.id}#${n}`)) n++
      instances.push({ instanceId: `${req.id}#${n}`, requirementId: req.id, objectType: req.objectType, allowedRoomIds: Object.keys(candidates), candidates })
      n++
    }
  }

  const budgetMinor = config.budget?.amountMinor ?? null
  if (budgetMinor !== null && issues.length === 0) {
    const retainedCost = retained.reduce((sum, p) => sum + (p.priceMinor ?? 0), 0)
    const lowerBound = instances.reduce((sum, inst) => {
      const prices = Object.values(inst.candidates).flat().map((c) => c.priceMinor ?? 0)
      return sum + Math.min(...prices)
    }, 0)
    if (retainedCost + lowerBound > budgetMinor) {
      issues.push({
        code: 'BUDGET_EXCEEDED',
        message: `The cheapest possible selection costs $${((retainedCost + lowerBound) / 100).toFixed(2)}, over the $${(budgetMinor / 100).toFixed(2)} budget.`,
        suggestion: 'Raise the budget or request fewer items.',
      })
    }
  }

  if (issues.length) return { issues }
  return {
    prepared: {
      rooms: floor.rooms,
      scopeRoomIds,
      retained,
      instances,
      budgetMinor,
      prompt: config.prompt,
      notes: Object.fromEntries(config.roomInstructions.map((ri) => [ri.roomId, ri.note])),
    },
  }
}

/** Keep a few items per candidate list: style matches first, and always the cheapest and the smallest. */
function shortlist(items: CatalogItem[], preferenceText: string): CatalogItem[] {
  if (items.length <= SHORTLIST) return items
  const words = new Set(preferenceText.toLowerCase().match(/[a-z]+/g) ?? [])
  const score = (item: CatalogItem) =>
    [...item.styleTags, ...item.materials, ...item.featureTags, ...(item.colorName?.toLowerCase().split(/\s+/) ?? []), ...item.colorFamilies].filter((t) =>
      words.has(t.toLowerCase()),
    ).length
  const cheapest = [...items].sort((a, b) => (a.priceMinor ?? 0) - (b.priceMinor ?? 0))[0]
  const smallest = [...items].sort((a, b) => a.footprint.w * a.footprint.d - b.footprint.w * b.footprint.d)[0]
  const ranked = [...items].sort((a, b) => score(b) - score(a) || (a.priceMinor ?? 0) - (b.priceMinor ?? 0))
  const picked = new Map<string, CatalogItem>([
    [cheapest.id, cheapest],
    [smallest.id, smallest],
  ])
  for (const item of ranked) {
    if (picked.size >= SHORTLIST) break
    picked.set(item.id, item)
  }
  return [...picked.values()]
}

export const toEngineItem = (o: PlacedObject): EngineItem => ({
  instanceId: o.id,
  roomId: o.roomId,
  type: o.type,
  itemId: o.itemId,
  name: o.name,
  pose: o.pose,
  footprint: o.footprint,
  priceMinor: o.priceMinor,
})

export function toPlacedObject(p: ResolvedPlacement, requirementId: string): PlacedObject {
  return {
    id: p.instanceId,
    requirementId,
    roomId: p.roomId,
    type: p.item.objectType,
    itemId: p.item.id,
    name: p.item.name,
    source: p.item.source,
    priceMinor: p.item.priceMinor,
    pose: p.pose,
    footprint: p.footprint,
    is_fixed: false,
  }
}

export interface ProposalOutcome {
  argumentErrors: string[]
  missing: string[]
  resolved: ResolvedPlacement[]
  report: EngineReport
  accepted: boolean
}

/** Validate the model's arguments, resolve anchors and run the rules engine. */
export function evaluateProposal(prepared: PreparedGeneration, catalog: Catalog, proposals: ProposedPlacement[], mode: 'check' | 'submit'): ProposalOutcome {
  const argumentErrors: string[] = []
  const byId = new Map(prepared.instances.map((i) => [i.instanceId, i]))
  const seen = new Set<string>()
  const valid: ProposedPlacement[] = []
  for (const p of proposals) {
    const spec = byId.get(p.instanceId)
    if (!spec) {
      argumentErrors.push(`${p.instanceId}: unknown instanceId (valid: ${[...byId.keys()].join(', ')})`)
      continue
    }
    if (seen.has(p.instanceId)) {
      argumentErrors.push(`${p.instanceId}: placed more than once`)
      continue
    }
    seen.add(p.instanceId)
    if (!spec.allowedRoomIds.includes(p.roomId)) {
      argumentErrors.push(`${p.instanceId}: roomId ${p.roomId} not allowed (allowed: ${spec.allowedRoomIds.join(', ')})`)
      continue
    }
    if (!spec.candidates[p.roomId].some((c) => c.id === p.itemId)) {
      argumentErrors.push(`${p.instanceId}: itemId ${p.itemId} is not a candidate in ${p.roomId} (use one of: ${spec.candidates[p.roomId].map((c) => c.id).join(', ')})`)
      continue
    }
    valid.push(p)
  }

  const rooms = new Map(prepared.rooms.map((r) => [r.id, r]))
  const items = new Map(catalog.items.map((i) => [i.id, i]))
  const { placements: resolved, errors } = expandPlacements(valid, rooms, items)
  argumentErrors.push(...errors)

  const placedIds = new Set(resolved.map((r) => r.instanceId))
  const missing = prepared.instances.filter((i) => !placedIds.has(i.instanceId)).map((i) => i.instanceId)
  const expected = prepared.instances
    .filter((i) => mode === 'submit' || placedIds.has(i.instanceId))
    .map((i) => ({ instanceId: i.instanceId, objectType: i.objectType, allowedRoomIds: i.allowedRoomIds }))

  const engineItems: EngineItem[] = [
    ...prepared.retained.map(toEngineItem),
    ...resolved.map((r) => ({
      instanceId: r.instanceId,
      roomId: r.roomId,
      type: r.item.objectType,
      itemId: r.item.id,
      name: r.item.name,
      pose: r.pose,
      footprint: r.footprint,
      priceMinor: r.item.priceMinor,
    })),
  ]
  const report = evaluate({
    rooms: prepared.rooms,
    items: engineItems,
    types: catalog.types,
    expected: [...expected, ...prepared.retained.map((p) => ({ instanceId: p.id, objectType: p.type, allowedRoomIds: [p.roomId] }))],
    budgetMinor: prepared.budgetMinor,
    roomIds: prepared.scopeRoomIds,
  })
  const accepted = argumentErrors.length === 0 && missing.length === 0 && report.pass
  return { argumentErrors, missing, resolved, report, accepted }
}

/** Compact JSON context for the model's first message. */
export function buildContext(prepared: PreparedGeneration, catalog: Catalog, scopeLabel: string): string {
  const itemIndex: Record<string, unknown> = {}
  const rooms = prepared.rooms
    .filter((r) => prepared.scopeRoomIds.includes(r.id))
    .map((room) => {
      const g = roomGeometry(room)
      return {
        roomId: room.id,
        label: room.label,
        type: room.type,
        widthM: g.W / 1000,
        depthM: g.D / 1000,
        note: prepared.notes[room.id] || undefined,
        walls: wallSpans(room).map((w) => ({
          wallId: w.wallId,
          lengthM: w.lengthM,
          freeSpansM: w.freeSpansM,
          doors: w.doors.length ? w.doors : undefined,
          windows: w.windows.length ? w.windows : undefined,
        })),
        doorClearZones: g.doors.map((d) => ({
          doorId: d.opening.id,
          leadsTo: d.opening.leads_to,
          keepClear: [d.clear.x0, d.clear.y0, d.clear.x1, d.clear.y1].map((v) => v / 1000),
        })),
        fixedItems: prepared.retained
          .filter((p) => p.roomId === room.id)
          .map((p) => {
            const r = poseRect(p.pose, p.footprint)
            return { instanceId: p.id, type: p.type, rect: [r.x0, r.y0, r.x1, r.y1].map((v) => v / 1000) }
          }),
      }
    })

  const byRequirement = new Map<string, InstanceSpec[]>()
  for (const inst of prepared.instances) byRequirement.set(inst.requirementId, [...(byRequirement.get(inst.requirementId) ?? []), inst])
  const requirements = [...byRequirement.values()].map((group) => {
    const first = group[0]
    const spec = catalog.types[first.objectType]
    for (const list of Object.values(first.candidates)) {
      for (const item of list) {
        itemIndex[item.id] = {
          name: item.name,
          widthM: item.footprint.w,
          depthM: item.footprint.d,
          heightM: item.footprint.h,
          priceUsd: item.priceMinor == null ? null : item.priceMinor / 100,
          colors: item.colorFamilies.length ? item.colorFamilies : undefined,
          style: item.styleTags.length ? item.styleTags : undefined,
        }
      }
    }
    return {
      requirementId: first.requirementId,
      type: first.objectType,
      instanceIds: group.map((g) => g.instanceId),
      allowedRoomIds: first.allowedRoomIds,
      standsAgainstWall: spec.wallRule === 'back_to_wall',
      accessSpace: spec.access.map((a) => `${a.depthM} m clear on ${a.sides.join(a.rule === 'any' ? ' or ' : ' and ')} side`).join('; ') || 'none',
      candidateItemIds: Object.fromEntries(Object.entries(first.candidates).map(([roomId, list]) => [roomId, list.map((c) => c.id)])),
    }
  })

  return JSON.stringify({
    task: `Place every instance (${prepared.instances.length}) for ${scopeLabel}.`,
    budgetUsd: prepared.budgetMinor == null ? null : prepared.budgetMinor / 100,
    alreadySpentUsd: prepared.retained.reduce((s, p) => s + (p.priceMinor ?? 0), 0) / 100,
    stylePrompt: prepared.prompt || undefined,
    rooms,
    requirements,
    items: itemIndex,
    walkwayWidthM: mm(0.9) / 1000,
  })
}
