/**
 * Mock generation: the "Constraint-based furniture selection" pipeline with a
 * deterministic heuristic standing in for the agent.
 *
 *   1. room context (scene, fixtures, door clearances, notes)
 *   2. candidate sets per requirement (type, room eligibility, colors, max
 *      size, ceiling, note prohibitions/colors, fits the room)
 *   3. aggregate budget lower bound, including retained rooms
 *   4. rank by prompt/note preference terms, then price
 *   5. choose + place against walls, widening to every feasible candidate
 *      before giving up (bounded)
 *   6. re-validate everything deterministically
 *   7. persist assignments, price snapshots, explanations and findings
 *
 * It never shrinks furniture, never relaxes an explicit requirement, and a
 * bounded search failure is reported as "No valid layout found", not proof.
 */
import { CATALOG, CATALOG_VERSION, typeDef, typeMatches } from './catalog'
import type { GenerationOutcome, MockState, StoredGeneration } from './db'
import { planExtents, polygonSize, roomObstacles, round3, type RectM } from './demoLayout'
import { preferenceTermsIn } from './notes'
import { RULE_VERSION } from './rules'
import type {
  CatalogItem,
  Finding,
  Floor,
  Generation,
  GenerationErrorCode,
  GenerationScope,
  Layout,
  LayoutLine,
  NoteClause,
  NoteInterpretation,
  RequirementAssignment,
  Room,
  RoomTransform,
  SavedConfiguration,
  SceneObject,
} from '@/types/interior'

const EPS = 1e-6
const STEP_M = 0.05
const DEFAULT_FRONT_CLEARANCE_M = 0.6
const NIGHTSTAND_FRONT_CLEARANCE_M = 0.4
const MAX_CANDIDATE_ATTEMPTS = 120

export const TIMELINE_MS = { queued: 500, selecting: 1300, placing: 2100, finish: 3000 }

type Edge = 's' | 'e' | 'n' | 'w'
type Side = 'front' | 'back' | 'left' | 'right'
const SIDE_ANGLE: Record<Side, number> = { front: 0, right: 90, back: 180, left: 270 }

const overlaps = (a: RectM, b: RectM) => a.x + EPS < b.x + b.w && b.x + EPS < a.x + a.w && a.y + EPS < b.y + b.d && b.y + EPS < a.y + a.d
const insideRoom = (r: RectM, w: number, d: number) => r.x >= -EPS && r.y >= -EPS && r.x + r.w <= w + EPS && r.y + r.d <= d + EPS
const center = (r: RectM) => ({ x: r.x + r.w / 2, y: r.y + r.d / 2 })
const formatUsd = (minor: number) => `$${(minor / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Unit vector of a clockwise angle from +Y. */
function dirOf(angle: number): [number, number] {
  const a = ((angle % 360) + 360) % 360
  return a === 0 ? [0, 1] : a === 90 ? [1, 0] : a === 180 ? [0, -1] : [-1, 0]
}

function sideRect(body: RectM, [dx, dy]: [number, number], depth: number): RectM {
  if (dy === 1) return { x: body.x, y: body.y + body.d, w: body.w, d: depth }
  if (dy === -1) return { x: body.x, y: body.y - depth, w: body.w, d: depth }
  if (dx === 1) return { x: body.x + body.w, y: body.y, w: depth, d: body.d }
  return { x: body.x - depth, y: body.y, w: depth, d: body.d }
}

interface Body {
  objectId: string
  instanceId: string
  requirementId: string
  item: CatalogItem
  roomId: string
  rot: number
  rect: RectM
  clearances: RectM[]
  retained: boolean
}

interface RoomCtx {
  room: Room
  w: number
  d: number
  fixtures: RectM[]
  doorZones: RectM[]
  windows: Array<{ edge: Edge; lo: number; hi: number; sill: number }>
  clauses: NoteClause[]
  bodies: Body[]
}

function buildRoomCtx(room: Room, interpretation: NoteInterpretation | undefined): RoomCtx {
  const { w, d } = polygonSize(room.polygon)
  const obstacles = roomObstacles(room)
  const windows = room.openings
    .filter((o) => o.kind === 'window')
    .map((o) => {
      const edge = o.wall_id.slice(-1) as Edge
      const lo = edge === 's' || edge === 'e' ? o.offset_m : (edge === 'n' ? w : d) - o.offset_m - o.width_m
      return { edge, lo, hi: lo + o.width_m, sill: o.sill_m }
    })
  return {
    room,
    w,
    d,
    fixtures: obstacles.filter((o) => o.kind === 'fixture'),
    doorZones: obstacles.filter((o) => o.kind === 'door_clearance'),
    windows,
    clauses: interpretation?.clauses ?? [],
    bodies: [],
  }
}

const supportedHard = (ctx: RoomCtx, kind: NoteClause['kind']) => ctx.clauses.filter((c) => c.kind === kind && c.strength === 'hard' && c.status === 'supported')

function clearancesFor(item: CatalogItem, ctx: RoomCtx): Array<{ side: Side; depth: number }> {
  const front = item.objectType === 'tables.nightstand' ? NIGHTSTAND_FRONT_CLEARANCE_M : DEFAULT_FRONT_CLEARANCE_M
  const out = new Map<Side, number>([['front', front]])
  for (const c of supportedHard(ctx, 'minimum_clearance')) {
    if (c.targetObjectType && c.side && c.valueM && typeMatches(item.objectType, c.targetObjectType)) {
      out.set(c.side, Math.max(out.get(c.side) ?? 0, c.valueM))
    }
  }
  return [...out].map(([side, depth]) => ({ side, depth }))
}

function placementValid(ctx: RoomCtx, item: CatalogItem, rect: RectM, clearances: RectM[], backEdge: Edge): boolean {
  if (!insideRoom(rect, ctx.w, ctx.d) || clearances.some((c) => !insideRoom(c, ctx.w, ctx.d))) return false
  if (ctx.fixtures.some((f) => overlaps(rect, f)) || ctx.doorZones.some((z) => overlaps(rect, z))) return false
  for (const other of ctx.bodies) {
    if (overlaps(rect, other.rect) || other.clearances.some((c) => overlaps(rect, c))) return false
    if (clearances.some((c) => overlaps(c, other.rect))) return false
  }
  if (clearances.some((c) => ctx.fixtures.some((f) => overlaps(c, f)))) return false
  // Tall pieces can't sit in front of a window on their back wall.
  const [lo, hi] = backEdge === 's' || backEdge === 'n' ? [rect.x, rect.x + rect.w] : [rect.y, rect.y + rect.d]
  const h = item.footprint.h ?? 0
  return !ctx.windows.some((win) => win.edge === backEdge && h > win.sill && lo < win.hi - EPS && win.lo < hi - EPS)
}

function placementCost(ctx: RoomCtx, item: CatalogItem, rect: RectM, rot: number): number {
  const c = center(rect)
  const wallLen = rot % 180 === 0 ? ctx.w : ctx.d
  const along = rot % 180 === 0 ? c.x : c.y
  let cost = Math.abs(along - wallLen / 2) / wallLen + (1 - wallLen / Math.max(ctx.w, ctx.d)) * 0.5

  if (item.objectType === 'tables.nightstand') {
    const bed = ctx.bodies.find((b) => b.item.objectType.startsWith('sleep.bed'))
    if (bed) {
      const bc = center(bed.rect)
      const bedAlong = bed.rot % 180 === 0 ? bed.rect.w : bed.rect.d
      const nsAlong = rot % 180 === 0 ? rect.w : rect.d
      const alongDist = bed.rot % 180 === 0 ? Math.abs(c.x - bc.x) : Math.abs(c.y - bc.y)
      cost = Math.abs(alongDist - (bedAlong + nsAlong) / 2) * 4 + (rot === bed.rot ? 0 : 3)
    }
  } else if (item.objectType === 'storage.tv_stand') {
    const seat = ctx.bodies.find((b) => b.item.objectType.startsWith('seating.sofa') || b.item.objectType.startsWith('sleep.bed'))
    if (seat) {
      const sc = center(seat.rect)
      const [fx, fy] = dirOf(rot)
      const len = Math.hypot(sc.x - c.x, sc.y - c.y) || 1
      const facing = (fx * (sc.x - c.x) + fy * (sc.y - c.y)) / len
      cost = (1 - facing) * 3 + cost * 0.5
    }
  }
  return cost
}

function tryPlace(ctx: RoomCtx, item: CatalogItem, ids: { objectId: string; instanceId: string; requirementId: string }): Body | null {
  const { w: fw, d: fd } = item.footprint as { w: number; d: number }
  const clearanceSpecs = clearancesFor(item, ctx)
  let best: { body: Body; cost: number } | null = null
  for (const rot of [0, 180, 90, 270]) {
    const ext = planExtents(fw, fd, rot)
    if (ext.w > ctx.w + EPS || ext.d > ctx.d + EPS) continue
    const backEdge: Edge = rot === 0 ? 's' : rot === 180 ? 'n' : rot === 90 ? 'w' : 'e'
    const alongMax = rot % 180 === 0 ? ctx.w - ext.w : ctx.d - ext.d
    const positions: number[] = []
    for (let t = 0; t < alongMax - EPS; t += STEP_M) positions.push(round3(t))
    positions.push(round3(Math.max(0, alongMax)))
    for (const t of positions) {
      const rect: RectM =
        rot === 0 ? { x: t, y: 0, ...ext } : rot === 180 ? { x: t, y: ctx.d - ext.d, ...ext } : rot === 90 ? { x: 0, y: t, ...ext } : { x: ctx.w - ext.w, y: t, ...ext }
      const clearances = clearanceSpecs.map((s) => sideRect(rect, dirOf(rot + SIDE_ANGLE[s.side]), s.depth))
      if (!placementValid(ctx, item, rect, clearances, backEdge)) continue
      const cost = placementCost(ctx, item, rect, rot)
      if (!best || cost < best.cost - 1e-9) best = { cost, body: { ...ids, item, roomId: ctx.room.id, rot, rect, clearances, retained: false } }
    }
  }
  return best?.body ?? null
}

type RejectReason = 'needs_review' | 'unsupported' | 'room_type' | 'color' | 'room_note' | 'max_dimensions' | 'ceiling' | 'price' | 'room_size'

const REJECT_LABELS: Record<RejectReason, string> = {
  needs_review: 'need review (e.g. unknown dimensions)',
  unsupported: 'not supported for generation',
  room_type: 'not suitable for this room type',
  color: 'outside the allowed colors',
  room_note: "excluded by the room's note",
  max_dimensions: 'over the size limits',
  ceiling: 'taller than the ceiling',
  price: 'missing a price',
  room_size: 'too big for the room',
}

function rejectionFor(item: CatalogItem, req: SavedConfiguration['requirements'][number], ctx: RoomCtx): RejectReason | null {
  if (item.selectionStatus !== 'eligible') return item.selectionStatus
  if (!item.allowedRoomTypes.includes(ctx.room.type)) return 'room_type'
  if (req.allowedColors.length > 0 && !req.allowedColors.some((c) => item.colorFamilies.includes(c))) return 'color'
  for (const clause of supportedHard(ctx, 'allowed_color_families')) {
    if ((!clause.targetObjectType || typeMatches(item.objectType, clause.targetObjectType)) && !clause.colorFamilies?.some((c) => item.colorFamilies.includes(c))) return 'room_note'
  }
  const { w, d, h } = item.footprint as { w: number; d: number; h: number }
  const max = req.maxDimensionsM
  if (max && (w > max.w + EPS || d > max.d + EPS || h > max.h + EPS)) return 'max_dimensions'
  if (h > ctx.room.ceiling_height_m) return 'ceiling'
  if (item.priceMinor === null) return 'price'
  const fits = (w <= ctx.w + EPS && d <= ctx.d + EPS) || (d <= ctx.w + EPS && w <= ctx.d + EPS)
  return fits ? null : 'room_size'
}

const prohibitedIn = (ctx: RoomCtx, objectType: string) =>
  ctx.clauses.some((c) => c.kind === 'object_type_prohibition' && c.status === 'supported' && c.strength === 'hard' && c.targetObjectType && typeMatches(objectType, c.targetObjectType))

export interface GenerationInput {
  generationId: string
  layoutId: string
  projectId: string
  scope: GenerationScope
  inputRevisions: { project: number; configuration: number }
  configuration: SavedConfiguration
  floor: Floor
  roomTransforms: RoomTransform[]
  footprintM: { w: number; d: number }
  interpretations: NoteInterpretation[]
  previousLayout: Layout | null
  roomSignatures: Record<string, string>
  createdAt: string
}

interface Group {
  req: SavedConfiguration['requirements'][number]
  count: number
  roomIds: string[]
  label: string
}

const fail = (code: GenerationErrorCode, message: string, issues: Finding[]): GenerationOutcome => ({ status: 'failed', layout: null, error: { code, message }, issues, roomSignatures: {} })

export function runGeneration(input: GenerationInput): GenerationOutcome {
  const config = input.configuration
  const scopeRoomId = input.scope.kind === 'room' ? input.scope.roomId : null
  const ctxs = new Map(input.floor.rooms.map((room) => [room.id, buildRoomCtx(room, input.interpretations.find((i) => i.roomId === room.id))]))
  const roomLabel = (id: string) => ctxs.get(id)?.room.label ?? id
  const typeLabel = (t: string) => typeDef(t)?.label ?? t
  const findings: Finding[] = []
  const explanations: Layout['explanations'] = []

  // Room-only runs keep every other room's placements from the active layout.
  const retainedLines: LayoutLine[] = []
  const retainedAssignments: RequirementAssignment[] = []
  if (scopeRoomId && input.previousLayout) {
    const prev = input.previousLayout
    for (const prevRoom of prev.floor.rooms) {
      if (prevRoom.id === scopeRoomId) continue
      const ctx = ctxs.get(prevRoom.id)
      if (!ctx) continue
      for (const obj of prevRoom.objects.filter((o) => !o.is_fixed)) {
        const item = CATALOG.find((c) => c.catalogItemId === obj.variant_id)
        const assignment = prev.requirementAssignments.find((a) => a.objectId === obj.id)
        const req = assignment && config.requirements.find((r) => r.id === assignment.requirementId)
        if (!item || !assignment || !req || !typeMatches(item.objectType, req.objectType)) {
          return fail('NO_VALID_LAYOUT_FOUND', `${ctx.room.label} still has furniture from an older configuration. Run a whole-home generation.`, [
            { code: 'RETAINED_ASSIGNMENT_ORPHANED', severity: 'error', roomId: ctx.room.id, message: `${obj.label} no longer matches a saved requirement.`, suggestion: 'Generate the whole home.' },
          ])
        }
        const ext = planExtents(obj.footprint.w, obj.footprint.d, obj.pose.rot)
        const rect = { x: obj.pose.x - ext.w / 2, y: obj.pose.y - ext.d / 2, ...ext }
        const clearances = clearancesFor(item, ctx).map((s) => sideRect(rect, dirOf(obj.pose.rot + SIDE_ANGLE[s.side]), s.depth))
        const backEdge: Edge = obj.pose.rot === 0 ? 's' : obj.pose.rot === 180 ? 'n' : obj.pose.rot === 90 ? 'w' : 'e'
        if (!placementValid(ctx, item, rect, clearances, backEdge)) {
          return fail('NO_VALID_LAYOUT_FOUND', `Furniture kept in ${ctx.room.label} no longer fits after the latest edits. Run a whole-home generation.`, [
            { code: 'RETAINED_PLACEMENT_INVALID', severity: 'error', roomId: ctx.room.id, message: `${obj.label} would collide or leave the room.`, suggestion: 'Generate the whole home.' },
          ])
        }
        ctx.bodies.push({ objectId: obj.id, instanceId: assignment.instanceId, requirementId: req.id, item, roomId: ctx.room.id, rot: obj.pose.rot, rect, clearances, retained: true })
        retainedAssignments.push(assignment)
      }
    }
    retainedLines.push(...prev.lines.filter((l) => l.roomId !== scopeRoomId))
    if (retainedAssignments.length) explanations.push({ message: `Kept furniture in the other rooms from layout ${prev.id}.` })
  }
  const retainedCost = retainedLines.reduce((sum, l) => sum + l.priceMinor * l.quantity, 0)

  // Which instances this run must place, and where they may go.
  const groups: Group[] = []
  for (const req of config.requirements) {
    if (req.quantity === 0) continue
    const def = typeDef(req.objectType)
    const label = def?.label ?? req.objectType
    if (req.roomId !== null) {
      if (scopeRoomId && req.roomId !== scopeRoomId) continue
      groups.push({ req, count: req.quantity, roomIds: [req.roomId], label })
      continue
    }
    const excluded = (roomId: string) =>
      config.requirements.some((r) => r.roomId === roomId && r.quantity === 0 && typeMatches(req.objectType, r.objectType)) ||
      prohibitedIn(ctxs.get(roomId) as RoomCtx, req.objectType)
    const eligibleRooms = input.floor.rooms.filter((room) => def?.allowedRoomTypes.includes(room.type) && !excluded(room.id)).map((r) => r.id)
    const retained = retainedAssignments.filter((a) => a.requirementId === req.id).length
    const remaining = req.quantity - retained
    if (remaining < 0) {
      return fail('NO_VALID_LAYOUT_FOUND', `Other rooms already hold more ${label.toLowerCase()} than requested. Run a whole-home generation to rebalance.`, [
        { code: 'RETAINED_EXCEEDS_QUANTITY', severity: 'error', requirementId: req.id, message: `${retained} kept, ${req.quantity} requested.`, suggestion: 'Generate the whole home.' },
      ])
    }
    if (remaining === 0) continue
    const roomIds = scopeRoomId ? eligibleRooms.filter((id) => id === scopeRoomId) : eligibleRooms
    if (roomIds.length === 0) {
      const code = scopeRoomId ? 'NO_VALID_LAYOUT_FOUND' : 'NO_CATALOG_MATCH'
      return fail(code, `No room in scope can take ${remaining} × ${label}.`, [
        {
          code: 'NO_ELIGIBLE_ROOM',
          severity: 'error',
          requirementId: req.id,
          message: scopeRoomId ? `${roomLabel(scopeRoomId)} can't take a ${label.toLowerCase()}, and a room-only run won't move furniture elsewhere.` : `Every suitable room excludes ${label.toLowerCase()}.`,
          suggestion: scopeRoomId ? 'Run a whole-home generation or assign the requirement to a room.' : 'Edit the room notes or zero-quantity exclusions.',
        },
      ])
    }
    groups.push({ req, count: remaining, roomIds, label })
  }

  // Candidate sets, with rejection counts for explanations.
  const candidates = new Map<Group, Array<{ item: CatalogItem; roomIds: string[] }>>()
  const catalogIssues: Finding[] = []
  for (const group of groups) {
    const rejected = new Map<RejectReason, number>()
    const list: Array<{ item: CatalogItem; roomIds: string[] }> = []
    const matching = CATALOG.filter((item) => typeMatches(item.objectType, group.req.objectType))
    for (const item of matching) {
      const roomIds: string[] = []
      let reason: RejectReason | null = null
      for (const roomId of group.roomIds) {
        const ctx = ctxs.get(roomId) as RoomCtx
        const r = prohibitedIn(ctx, item.objectType) ? 'room_note' : rejectionFor(item, group.req, ctx)
        if (r) reason ??= r
        else roomIds.push(roomId)
      }
      if (roomIds.length) list.push({ item, roomIds })
      else if (reason) rejected.set(reason, (rejected.get(reason) ?? 0) + 1)
    }
    if (list.length === 0) {
      const summary = [...rejected].map(([r, n]) => `${n} ${REJECT_LABELS[r]}`).join('; ') || 'no variants of this type'
      const top = [...rejected].sort((a, b) => b[1] - a[1])[0]?.[0]
      catalogIssues.push({
        code: 'NO_CATALOG_MATCH',
        severity: 'error',
        requirementId: group.req.id,
        roomId: group.req.roomId ?? undefined,
        message: `No eligible ${group.label.toLowerCase()} for ${group.req.roomId ? roomLabel(group.req.roomId) : 'any suitable room'}: ${summary}.`,
        suggestion:
          top === 'color' ? 'Allow more colors.' : top === 'max_dimensions' ? 'Raise the size limits.' : top === 'room_note' ? "Edit the room's note." : 'Choose a different furniture type.',
      })
    }
    candidates.set(group, list)
  }
  if (catalogIssues.length) return fail('NO_CATALOG_MATCH', 'Some requirements have no eligible products.', catalogIssues)

  // Aggregate budget lower bound: cheapest eligible candidate per instance plus retained rooms.
  const budget = config.budget.amountMinor
  const cheapest = (g: Group) => Math.min(...(candidates.get(g) ?? []).map((c) => c.item.priceMinor as number))
  const lowerBound = retainedCost + groups.reduce((sum, g) => sum + cheapest(g) * g.count, 0)
  if (lowerBound > budget) {
    return fail('BUDGET_EXCEEDED', `The cheapest combination costs ${formatUsd(lowerBound)}, over the ${formatUsd(budget)} budget.`, [
      ...groups.map((g) => ({
        code: 'REQUIREMENT_MIN_COST',
        severity: 'error' as const,
        requirementId: g.req.id,
        message: `${g.count} × ${g.label}: at least ${formatUsd(cheapest(g) * g.count)}.`,
      })),
      ...(retainedCost ? [{ code: 'RETAINED_COST', severity: 'info' as const, message: `Furniture kept in other rooms: ${formatUsd(retainedCost)}.` }] : []),
      { code: 'BUDGET_SUGGESTION', severity: 'info', message: 'Suggested change', suggestion: `Raise the budget to at least ${formatUsd(lowerBound)} or reduce quantities.` },
    ])
  }

  // Rank, choose and place. Beds and sofas first so nightstands/TV stands can relate to them.
  const PRIORITY = ['sleep.bed', 'seating.sofa', 'storage.dresser', 'tables.nightstand', 'storage.tv_stand']
  const priority = (t: string) => {
    const i = PRIORITY.findIndex((p) => typeMatches(t, p))
    return i === -1 ? PRIORITY.length : i
  }
  groups.sort((a, b) => priority(a.req.objectType) - priority(b.req.objectType))

  const promptTerms = preferenceTermsIn(config.prompt)
  const roomTerms = (roomId: string) =>
    (ctxs.get(roomId) as RoomCtx).clauses.filter((c) => c.kind === 'style_preference' && c.status === 'supported').flatMap((c) => c.preferenceTerms ?? [])
  const itemTokens = (item: CatalogItem) => new Set([...item.colorFamilies, ...item.materials, ...item.styleTags, ...item.featureTags])
  const score = (item: CatalogItem, roomIds: string[]) => {
    const tokens = itemTokens(item)
    return Math.max(...roomIds.map((roomId) => [...promptTerms, ...roomTerms(roomId)].filter((t) => tokens.has(t)).length))
  }

  let spent = retainedCost
  let attempts = 0
  const chosen = new Map<Group, CatalogItem>()
  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi]
    const lowerAfter = groups.slice(gi + 1).reduce((sum, g) => sum + cheapest(g) * g.count, 0)
    const list = candidates.get(group) ?? []
    const ranked = [...list].sort((a, b) => score(b.item, b.roomIds) - score(a.item, a.roomIds) || (a.item.priceMinor as number) - (b.item.priceMinor as number) || a.item.catalogItemId.localeCompare(b.item.catalogItemId))
    // Widen: after the ranked shortlist, try every feasible candidate smallest-first.
    const bySize = [...list].sort((a, b) => (a.item.footprint.w as number) * (a.item.footprint.d as number) - (b.item.footprint.w as number) * (b.item.footprint.d as number))
    const order = [...new Set([...ranked.slice(0, 10), ...bySize, ...ranked])]
    let overBudget = 0
    let placed = false
    for (const { item, roomIds } of order) {
      const cost = (item.priceMinor as number) * group.count
      if (spent + cost + lowerAfter > budget) {
        overBudget++
        continue
      }
      if (++attempts > MAX_CANDIDATE_ATTEMPTS) break
      const bodies: Body[] = []
      for (let k = 0; k < group.count; k++) {
        const instanceId = `${group.req.id}#${retainedAssignments.filter((a) => a.requirementId === group.req.id).length + k + 1}`
        const rooms = [...roomIds].sort((a, b) => (ctxs.get(a) as RoomCtx).bodies.length - (ctxs.get(b) as RoomCtx).bodies.length || (ctxs.get(b) as RoomCtx).room.area_m2 - (ctxs.get(a) as RoomCtx).room.area_m2)
        let body: Body | null = null
        for (const roomId of rooms) {
          const ctx = ctxs.get(roomId) as RoomCtx
          body = tryPlace(ctx, item, { objectId: `obj-${input.layoutId}-${instanceId.replace('#', '-')}`, instanceId, requirementId: group.req.id })
          if (body) {
            ctx.bodies.push(body)
            break
          }
        }
        if (!body) break
        bodies.push(body)
      }
      if (bodies.length === group.count) {
        spent += cost
        chosen.set(group, item)
        placed = true
        break
      }
      for (const b of bodies) {
        const ctx = ctxs.get(b.roomId) as RoomCtx
        ctx.bodies = ctx.bodies.filter((x) => x !== b)
      }
    }
    if (!placed) {
      const where = group.roomIds.map(roomLabel).join(' or ')
      if (overBudget === order.length) {
        return fail('BUDGET_EXCEEDED', `No ${group.label.toLowerCase()} fits the remaining budget alongside the other choices.`, [
          { code: 'BUDGET_EXCEEDED', severity: 'error', requirementId: group.req.id, message: `Remaining budget after other items: ${formatUsd(budget - spent - lowerAfter)}.`, suggestion: 'Raise the budget or reduce quantities.' },
        ])
      }
      return fail('NO_VALID_LAYOUT_FOUND', `No valid layout found for ${group.count} × ${group.label} in ${where}.`, [
        {
          code: 'PLACEMENT_FAILED',
          severity: 'error',
          requirementId: group.req.id,
          roomId: group.roomIds.length === 1 ? group.roomIds[0] : undefined,
          message: `Tried ${Math.min(order.length, attempts)} product(s); none fit alongside fixtures, door clearances and the other furniture. This is a bounded search, not proof that no layout exists.`,
          suggestion: 'Reduce the quantity, lower the size limits, or give the room more space.',
        },
      ])
    }
    const item = chosen.get(group) as CatalogItem
    const placedIn = [...ctxs.values()].filter((c) => c.bodies.some((b) => b.requirementId === group.req.id && !b.retained)).map((c) => c.room.label)
    const why = score(item, group.roomIds) > 0 ? 'Best match for the style preferences within budget.' : 'Chosen by price among products that fit.'
    explanations.push({
      requirementId: group.req.id,
      roomId: group.req.roomId ?? undefined,
      message: `${group.count} × ${group.label} → ${item.name}${item.colorName ? ` (${item.colorName})` : ''}, ${formatUsd(item.priceMinor as number)} each, in ${placedIn.join(', ')}. ${why}`,
    })
  }

  // Deterministic validation of the complete result, retained rooms included.
  const all = [...ctxs.values()].flatMap((c) => c.bodies)
  const violations: Finding[] = []
  for (const ctx of ctxs.values()) {
    ctx.bodies.forEach((b, i) => {
      if (!insideRoom(b.rect, ctx.w, ctx.d)) violations.push({ code: 'OUTSIDE_ROOM', severity: 'error', roomId: ctx.room.id, message: `${b.item.name} leaves the room.` })
      if (ctx.fixtures.some((f) => overlaps(b.rect, f))) violations.push({ code: 'FIXTURE_COLLISION', severity: 'error', roomId: ctx.room.id, message: `${b.item.name} collides with a fixture.` })
      if (ctx.doorZones.some((z) => overlaps(b.rect, z))) violations.push({ code: 'OPENING_BLOCKED', severity: 'error', roomId: ctx.room.id, ruleId: 'FS-CMD-026', message: `${b.item.name} blocks a door.` })
      ctx.bodies.slice(i + 1).forEach((o) => {
        if (overlaps(b.rect, o.rect)) violations.push({ code: 'COLLISION', severity: 'error', roomId: ctx.room.id, message: `${b.item.name} overlaps ${o.item.name}.` })
      })
      if (!b.retained && prohibitedIn(ctx, b.item.objectType)) violations.push({ code: 'NOTE_VIOLATED', severity: 'error', roomId: ctx.room.id, message: `${b.item.name} is prohibited by the room note.` })
    })
  }
  const inPlay = config.requirements.filter((r) => r.quantity > 0 && (!scopeRoomId || r.roomId === scopeRoomId || r.roomId === null))
  for (const req of inPlay) {
    const n = all.filter((b) => b.requirementId === req.id).length
    if (n !== req.quantity) violations.push({ code: 'QUANTITY_MISMATCH', severity: 'error', requirementId: req.id, message: `Placed ${n}, requested ${req.quantity}.` })
  }
  const newCost = all.filter((b) => !b.retained).reduce((sum, b) => sum + (b.item.priceMinor as number), 0)
  const total = retainedCost + newCost
  if (total > budget) violations.push({ code: 'BUDGET_EXCEEDED', severity: 'error', message: `Total ${formatUsd(total)} exceeds ${formatUsd(budget)}.` })
  if (violations.length) return fail('ENGINE_ERROR', 'The proposed layout failed validation, so it was not saved.', violations)

  // Findings: rules, notes, preferences.
  if (config.selectedRuleIds.includes('FS-CMD-026')) {
    findings.push({ code: 'RULE_PASSED', severity: 'info', ruleId: 'FS-CMD-026', message: 'Door swings and doorways are clear in every room (door-swing check only; traffic routes not evaluated).' })
  }
  for (const ctx of ctxs.values()) {
    if (scopeRoomId && ctx.room.id !== scopeRoomId) continue
    for (const clause of ctx.clauses) {
      if (clause.status === 'supported' && clause.strength === 'hard') {
        findings.push({ code: 'NOTE_APPLIED', severity: 'info', roomId: ctx.room.id, message: `Applied "${clause.sourceText}"` })
      } else if (clause.kind === 'style_preference' && clause.status === 'supported') {
        const met = ctx.bodies.some((b) => !b.retained && (clause.preferenceTerms ?? []).some((t) => itemTokens(b.item).has(t)))
        findings.push(
          met
            ? { code: 'PREFERENCE_MET', severity: 'info', roomId: ctx.room.id, message: `Preference met: "${clause.sourceText}"` }
            : { code: 'PREFERENCE_UNMET', severity: 'warning', roomId: ctx.room.id, message: `Preference not met by the available products: "${clause.sourceText}"` },
        )
      } else if (clause.status === 'unsupported') {
        findings.push({ code: 'PREFERENCE_NOT_ENFORCED', severity: 'warning', roomId: ctx.room.id, message: `Not enforced: "${clause.sourceText}"` })
      }
    }
  }
  explanations.push({
    message: promptTerms.length ? `Prompt keywords used for ranking: ${promptTerms.join(', ')}.` : 'The prompt is saved, but it has no style keywords the mock ranks by.',
  })
  findings.push({ code: 'BUDGET_SUMMARY', severity: 'info', message: `Total ${formatUsd(total)} of ${formatUsd(budget)} (${formatUsd(budget - total)} left). Taxes, shipping and fixed fixtures excluded.` })

  // Persist the full-home snapshot.
  const floor: Floor = {
    ...input.floor,
    rooms: input.floor.rooms.map((room) => {
      const ctx = ctxs.get(room.id) as RoomCtx
      const placed: SceneObject[] = ctx.bodies.map((b) => {
        const c = center(b.rect)
        return {
          id: b.objectId,
          type: b.item.objectType,
          label: b.item.name,
          variant_id: b.item.catalogItemId,
          pose: { x: round3(c.x), y: round3(c.y), z: 0, rot: b.rot },
          footprint: { w: b.item.footprint.w as number, d: b.item.footprint.d as number, h: b.item.footprint.h as number },
          materials: b.item.materials,
          colors: b.item.colorHex ? [{ hex: b.item.colorHex, coverage_pct: 100 }] : [],
          anchored: false,
          is_fixed: false,
          provenance: 'catalog',
        }
      })
      return { ...room, objects: [...room.objects.filter((o) => o.is_fixed), ...placed] }
    }),
  }
  const newBodies = all.filter((b) => !b.retained)
  const lines = [...retainedLines]
  for (const b of newBodies) {
    const line = lines.find((l) => l.catalogItemId === b.item.catalogItemId && l.roomId === b.roomId && !retainedLines.includes(l))
    if (line) line.quantity++
    else {
      lines.push({
        catalogItemId: b.item.catalogItemId,
        name: b.item.name,
        objectType: b.item.objectType,
        colorName: b.item.colorName,
        priceMinor: b.item.priceMinor as number,
        quantity: 1,
        roomId: b.roomId,
        url: b.item.source.url,
        imageUrl: b.item.source.imageUrls[0] ?? null,
      })
    }
  }
  const layout: Layout = {
    id: input.layoutId,
    projectId: input.projectId,
    generationId: input.generationId,
    scope: input.scope,
    inputRevisions: input.inputRevisions,
    catalogVersion: CATALOG_VERSION,
    ruleVersion: RULE_VERSION,
    footprintM: input.footprintM,
    floor,
    roomTransforms: input.roomTransforms,
    requirementAssignments: [
      ...retainedAssignments,
      ...newBodies.map((b) => ({ requirementId: b.requirementId, instanceId: b.instanceId, catalogItemId: b.item.catalogItemId, roomId: b.roomId, objectId: b.objectId })),
    ],
    lines,
    totalPriceMinor: total,
    currency: 'USD',
    findings,
    explanations,
    createdAt: input.createdAt,
  }
  return { status: 'succeeded', layout, error: null, issues: [], roomSignatures: input.roomSignatures }
}

/** Status/stage as seen at `now`; a settled job returns its terminal record. */
export function viewGeneration(g: StoredGeneration, now: number): Generation {
  if (g.resolved) return g.record
  const elapsed = now - g.startedMs
  if (elapsed < TIMELINE_MS.queued) return { ...g.record, status: 'queued', stage: null }
  const stage = elapsed < TIMELINE_MS.selecting ? 'selecting' : elapsed < TIMELINE_MS.placing ? 'placing' : 'validating'
  return { ...g.record, status: 'running', stage }
}

/**
 * Settles jobs that reached their terminal time. A successful result is
 * activated only if the project's revisions still match its inputs and no
 * newer job exists; otherwise it is kept for inspection and marked stale.
 * Failures never touch the active layout.
 */
export function settleGenerations(state: MockState, projectId: string, now: number, nowIso: string): boolean {
  const project = state.projects[projectId]
  if (!project) return false
  const jobs = Object.values(state.generations)
    .filter((g) => g.record.projectId === projectId)
    .sort((a, b) => a.startedMs - b.startedMs)
  let changed = false
  for (const job of jobs) {
    if (job.resolved || now < job.finishMs) continue
    const { outcome } = job
    const newer = jobs.some((other) => other.startedMs > job.startedMs)
    const current = job.record.inputRevisions.project === project.revision && job.record.inputRevisions.configuration === project.configuration.revision
    if (outcome.status === 'failed') {
      job.record = { ...job.record, status: 'failed', stage: null, error: outcome.error, issues: outcome.issues, updatedAt: nowIso }
    } else if (outcome.layout) {
      state.layouts[outcome.layout.id] = outcome.layout
      if (current && !newer) {
        state.layoutMeta[outcome.layout.id] = { roomSignatures: outcome.roomSignatures }
        project.activeLayoutId = outcome.layout.id
        job.record = { ...job.record, status: 'succeeded', stage: null, layoutId: outcome.layout.id, updatedAt: nowIso }
      } else {
        job.record = {
          ...job.record,
          status: 'stale',
          stage: null,
          layoutId: outcome.layout.id,
          issues: [{ code: 'GENERATION_STALE', severity: 'warning', message: 'The project changed while this was generating. The result is kept for inspection but was not applied.', suggestion: 'Apply again.' }],
          updatedAt: nowIso,
        }
      }
    }
    job.resolved = true
    changed = true
  }
  return changed
}
