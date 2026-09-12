/**
 * Configuration semantics beyond JSON Schema, note gating for Apply, and the
 * per-room derived status shown on GET Project.
 */
import { COLOR_FAMILY_IDS, FURNITURE_TYPES, isKnownType, stableHash, typeDef, typesOverlap } from './catalog'
import type { MockState, StoredProject } from './db'
import { isUnresolved, interpretNote } from './notes'
import { resolveRuleSelection } from './rules'
import type { ApiErrorDetail, Configuration, Finding, NoteInterpretation, RoomEdit, RoomStatus, SavedConfiguration } from '@/types/interior'

export const DEFAULT_BUDGET_MINOR = 300000

export function defaultConfiguration(rooms: RoomEdit[]): SavedConfiguration {
  return {
    revision: 1,
    prompt: '',
    budget: { amountMinor: DEFAULT_BUDGET_MINOR, currency: 'USD' },
    requirements: [],
    selectedRuleIds: [],
    enabledBeliefSystems: [],
    roomInstructions: rooms.map((r) => ({ roomId: r.id, note: '' })),
  }
}

const hasThreeDecimals = (n: number) => Math.abs(n * 1000 - Math.round(n * 1000)) < 1e-6

export function validateConfiguration(rooms: RoomEdit[], config: Configuration): { errors: ApiErrorDetail[]; findings: Finding[] } {
  const errors: ApiErrorDetail[] = []
  const roomIds = rooms.map((r) => r.id)
  const base = 'configuration'

  config.roomInstructions.forEach((ins, i) => {
    if (!roomIds.includes(ins.roomId)) errors.push({ path: `${base}.roomInstructions[${i}].roomId`, code: 'UNKNOWN_ROOM', roomId: ins.roomId, message: 'No such room.' })
  })
  for (const id of roomIds) {
    const count = config.roomInstructions.filter((ins) => ins.roomId === id).length
    if (count !== 1) {
      errors.push({ path: `${base}.roomInstructions`, code: count ? 'DUPLICATE_ROOM_INSTRUCTION' : 'MISSING_ROOM_INSTRUCTION', roomId: id, message: 'Each room needs exactly one note entry (it may be empty).' })
    }
  }

  const seenIds = new Set<string>()
  config.requirements.forEach((req, i) => {
    const path = `${base}.requirements[${i}]`
    if (seenIds.has(req.id)) errors.push({ path: `${path}.id`, code: 'DUPLICATE_REQUIREMENT_ID', requirementId: req.id, message: 'Requirement ids must be unique.' })
    seenIds.add(req.id)

    const def = typeDef(req.objectType)
    const type = FURNITURE_TYPES.find((t) => t.objectType === req.objectType)
    if (!isKnownType(req.objectType) || !def || !type) {
      errors.push({ path: `${path}.objectType`, code: 'UNKNOWN_OBJECT_TYPE', requirementId: req.id, message: `${req.objectType} is not in the furniture type registry.` })
      return
    }
    if (!type.available) {
      errors.push({ path: `${path}.objectType`, code: 'OBJECT_TYPE_UNAVAILABLE', requirementId: req.id, message: `${def.label}: ${type.reason}` })
    }
    if (req.roomId !== null) {
      const room = rooms.find((r) => r.id === req.roomId)
      if (!room) errors.push({ path: `${path}.roomId`, code: 'UNKNOWN_ROOM', requirementId: req.id, roomId: req.roomId, message: 'No such room.' })
      else if (!def.allowedRoomTypes.includes(room.type)) {
        errors.push({ path: `${path}.roomId`, code: 'ROOM_TYPE_MISMATCH', requirementId: req.id, roomId: room.id, message: `A ${def.label.toLowerCase()} cannot be assigned to ${room.label}.` })
      }
    } else if (req.quantity > 0 && !rooms.some((r) => def.allowedRoomTypes.includes(r.type))) {
      errors.push({ path: `${path}.roomId`, code: 'NO_ELIGIBLE_ROOM', requirementId: req.id, message: `No room in this home can take a ${def.label.toLowerCase()}.` })
    }
    req.allowedColors.forEach((color, k) => {
      if (!COLOR_FAMILY_IDS.includes(color)) errors.push({ path: `${path}.allowedColors[${k}]`, code: 'UNKNOWN_COLOR', requirementId: req.id, message: `Unknown color family ${color}.` })
    })
    if (req.maxDimensionsM && Object.values(req.maxDimensionsM).some((v) => !hasThreeDecimals(v))) {
      errors.push({ path: `${path}.maxDimensionsM`, code: 'PRECISION', requirementId: req.id, message: 'Dimensions are limited to three decimals (millimeters).' })
    }
  })

  for (let i = 0; i < config.requirements.length; i++) {
    for (let j = i + 1; j < config.requirements.length; j++) {
      const a = config.requirements[i]
      const b = config.requirements[j]
      if (!typesOverlap(a.objectType, b.objectType)) continue
      const path = `${base}.requirements[${j}]`
      if (a.roomId === b.roomId) {
        errors.push({ path, code: 'DUPLICATE_REQUIREMENT', requirementId: b.id, message: `Overlaps ${a.id} for the same scope; combine them into one requirement.` })
        continue
      }
      if (a.roomId !== null && b.roomId !== null) continue
      const [global, local] = a.roomId === null ? [a, b] : [b, a]
      // A zero room quantity excludes the type there; anything else would double count.
      if (local.quantity === 0) continue
      if (global.quantity === 0) {
        errors.push({ path, code: 'CONFLICTING_REQUIREMENT', requirementId: local.id, message: `${global.id} excludes this type from the whole home, but ${local.id} asks for it.` })
      } else {
        errors.push({ path, code: 'OVERLAPPING_REQUIREMENT', requirementId: b.id, message: `${a.id} and ${b.id} would double count the same type. Assign it to rooms or to "anywhere", not both.` })
      }
    }
  }

  const rules = resolveRuleSelection(config.selectedRuleIds, config.enabledBeliefSystems)
  errors.push(...rules.errors)
  return { errors, findings: rules.findings }
}

export function interpretAll(project: StoredProject): NoteInterpretation[] {
  return project.configuration.roomInstructions.map((ins) => interpretNote(ins.roomId, ins.note, project.configuration.requirements))
}

/** Details for `422 ROOM_NOTE_UNRESOLVED` / `ROOM_NOTE_CONFLICT` for rooms in a generation scope. */
export function noteGate(interpretations: NoteInterpretation[], roomIds: string[]): { unresolved: ApiErrorDetail[]; conflicts: ApiErrorDetail[] } {
  const inScope = interpretations.filter((i) => roomIds.includes(i.roomId))
  const detail = (roomId: string, text: string, message: string, code: string): ApiErrorDetail => ({ path: `rooms.${roomId}.note`, code, roomId, message: `"${text}": ${message}` })
  return {
    unresolved: inScope.flatMap((i) => i.clauses.filter(isUnresolved).map((c) => detail(i.roomId, c.sourceText, c.message, `NOTE_${c.status.toUpperCase()}`))),
    conflicts: inScope.flatMap((i) => i.clauses.filter((c) => c.status === 'conflict').map((c) => detail(i.roomId, c.sourceText, c.message, 'NOTE_CONFLICT'))),
  }
}

/** Fingerprint of everything a room's placements depend on. Labels are cosmetic and excluded. */
export function roomSignature(project: StoredProject, roomId: string): string {
  const room = project.rooms.find((r) => r.id === roomId)
  const c = project.configuration
  return stableHash(
    JSON.stringify({
      polygon: room?.polygon,
      type: room?.type,
      origin: project.roomTransforms.find((t) => t.roomId === roomId)?.origin,
      requirements: c.requirements.filter((r) => r.roomId === roomId || r.roomId === null),
      note: c.roomInstructions.find((i) => i.roomId === roomId)?.note,
      prompt: c.prompt,
      budget: c.budget,
      rules: c.selectedRuleIds,
      beliefs: c.enabledBeliefSystems,
    }),
  )
}

export function roomStatuses(state: MockState, project: StoredProject): Array<{ roomId: string; status: RoomStatus }> {
  const latest = project.latestGenerationId ? state.generations[project.latestGenerationId] : undefined
  const inScope = (roomId: string) => latest !== undefined && (latest.record.scope.kind === 'home' || latest.record.scope.roomId === roomId)
  const layout = project.activeLayoutId ? state.layouts[project.activeLayoutId] : undefined
  const meta = project.activeLayoutId ? state.layoutMeta[project.activeLayoutId] : undefined
  const failedForCurrentInputs =
    latest?.resolved &&
    latest.record.status === 'failed' &&
    latest.record.inputRevisions.project === project.revision &&
    latest.record.inputRevisions.configuration === project.configuration.revision

  return project.rooms.map((room) => {
    const c = project.configuration
    const configured = c.requirements.some((r) => r.quantity > 0 && r.roomId === room.id) || Boolean(c.roomInstructions.find((i) => i.roomId === room.id)?.note.trim())
    const hasPlacements = layout?.floor.rooms.find((r) => r.id === room.id)?.objects.some((o) => !o.is_fixed) ?? false
    let status: RoomStatus
    if (latest && !latest.resolved && inScope(room.id)) status = 'generating'
    else if (failedForCurrentInputs && inScope(room.id)) status = 'error'
    else if (meta?.roomSignatures[room.id]) {
      status = meta.roomSignatures[room.id] !== roomSignature(project, room.id) ? 'stale' : hasPlacements || configured ? 'furnished' : 'unconfigured'
    } else status = configured ? 'configured' : 'unconfigured'
    return { roomId: room.id, status }
  })
}
