import { candidatesFor, eligibleRooms } from '../catalog/candidates.ts'
import { COLOR_FAMILIES, type Catalog } from '../catalog/load.ts'
import type { Configuration, RoomDefinition } from '../domain/types.ts'
import type { ErrorDetail } from '../http/errors.ts'

export interface ConfigurationCheck {
  errors: ErrorDetail[]
  /** Non-blocking notices, e.g. a requirement with no catalog match yet. */
  findings: ErrorDetail[]
}

export function validateConfiguration(
  configuration: Omit<Configuration, 'revision'>,
  rooms: RoomDefinition[],
  catalog: Catalog,
): ConfigurationCheck {
  const errors: ErrorDetail[] = []
  const findings: ErrorDetail[] = []
  const roomIds = new Set(rooms.map((r) => r.id))

  const seenRooms = new Set<string>()
  configuration.roomInstructions.forEach((ri, i) => {
    if (!roomIds.has(ri.roomId)) errors.push({ path: `roomInstructions[${i}].roomId`, code: 'UNKNOWN_ROOM', roomId: ri.roomId })
    else if (seenRooms.has(ri.roomId)) errors.push({ path: `roomInstructions[${i}].roomId`, code: 'DUPLICATE_ROOM_INSTRUCTION', roomId: ri.roomId })
    seenRooms.add(ri.roomId)
  })
  for (const id of roomIds) {
    if (!seenRooms.has(id)) errors.push({ path: 'roomInstructions', code: 'MISSING_ROOM_INSTRUCTION', roomId: id })
  }

  const seenRequirements = new Set<string>()
  configuration.requirements.forEach((req, i) => {
    const path = `requirements[${i}]`
    if (seenRequirements.has(req.id)) errors.push({ path: `${path}.id`, code: 'DUPLICATE_REQUIREMENT_ID', requirementId: req.id })
    seenRequirements.add(req.id)

    if (req.roomId !== null && !roomIds.has(req.roomId)) {
      errors.push({ path: `${path}.roomId`, code: 'UNKNOWN_ROOM', requirementId: req.id, roomId: req.roomId })
      return
    }
    const spec = catalog.types[req.objectType]
    const eligible = eligibleRooms(catalog, req, rooms)
    if (eligible.length === 0) {
      const room = rooms.find((r) => r.id === req.roomId)
      errors.push(
        req.roomId
          ? {
              path: `${path}.roomId`,
              code: 'ROOM_TYPE_MISMATCH',
              requirementId: req.id,
              message: `A ${spec.label.toLowerCase()} cannot go in a ${room?.type.replace('_', ' ')}; allowed: ${spec.roomTypes.join(', ')}.`,
            }
          : { path: `${path}.roomId`, code: 'NO_ELIGIBLE_ROOM', requirementId: req.id, message: `No room allows a ${spec.label.toLowerCase()}.` },
      )
    }

    const unknownColors = (req.allowedColors ?? []).filter((c) => !COLOR_FAMILIES.includes(c))
    if (unknownColors.length) {
      errors.push({ path: `${path}.allowedColors`, code: 'UNKNOWN_COLOR', requirementId: req.id, message: `Known colors: ${COLOR_FAMILIES.join(', ')}.` })
    }

    for (let j = 0; j < i; j++) {
      const other = configuration.requirements[j]
      if (other.objectType !== req.objectType) continue
      if (other.roomId === req.roomId || other.roomId === null || req.roomId === null) {
        errors.push({
          path: path,
          code: 'REQUIREMENT_OVERLAP',
          requirementId: req.id,
          otherRequirementId: other.id,
          message: 'Two requirements for the same type overlap in scope; combine them or give each a different room.',
        })
      }
    }

    if (req.quantity > 0 && eligible.length > 0 && eligible.every((room) => candidatesFor(catalog, req, room).items.length === 0)) {
      findings.push({ path, code: 'NO_CATALOG_MATCH', requirementId: req.id, message: 'No catalog item satisfies the colors/size limits in any eligible room.' })
    }
  })

  return { errors, findings }
}
