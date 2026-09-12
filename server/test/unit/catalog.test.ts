import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateConfiguration } from '../../src/configuration/validateConfiguration.ts'
import { DEMO_ROOMS } from '../../src/fixtures/fourRoomV1.ts'
import { requestValidator } from '../../src/http/validation.ts'
import { validateRooms } from '../../src/rooms/reconstruct.ts'
import { INVENTORY_DIR, catalog } from '../helpers.ts'

describe('catalog', () => {
  it('normalizes inventory with stable IDs and never guesses missing dimensions', () => {
    const c = catalog()
    const slattum = c.items.find((i) => i.id === 'ikea-70571256')!
    expect(slattum).toMatchObject({ objectType: 'bed', priceMinor: 14900, footprint: { w: 1.559, d: 2.08, h: 0.851 }, colorFamilies: ['gray'] })
    expect(c.items.some((i) => i.objectType === 'bed' && i.name.startsWith('VIHALS'))).toBe(false)
    expect(c.skipped.some((s) => s.name === 'VIHALS' && s.reason === 'missing dimensions')).toBe(true)
  })

  it('adds standard-size items only where no real product exists', () => {
    const ids = catalog().items.filter((i) => i.source === 'default').map((i) => i.id).sort()
    expect(ids).toEqual(['default-shower', 'default-sink-kitchen', 'default-toilet'])
    expect(catalog().items.filter((i) => i.objectType === 'sink' && i.source === 'inventory').every((i) => i.roomTypes.join() === 'bathroom')).toBe(true)
  })

  it('loads tables and chairs for every room except the bathroom, skipping incomplete records', () => {
    const c = catalog()
    const tables = c.items.filter((i) => i.objectType === 'dining_table')
    const chairs = c.items.filter((i) => i.objectType === 'dining_chair')
    expect(tables).toHaveLength(6)
    expect(chairs).toHaveLength(10)
    for (const item of [...tables, ...chairs]) {
      expect(item.source).toBe('inventory')
      expect([...item.roomTypes].sort()).toEqual(['bedroom', 'kitchen', 'living_room'])
    }
    expect(c.skipped.filter((s) => s.file === 'table.json').map((s) => s.name).sort()).toEqual(['DOCKSTA', 'LISABO', 'ROSENTORP', 'ÅLHULT'])
  })

  it('keeps kitchen counters to base cabinets with full dimensions', () => {
    const counters = catalog().items.filter((i) => i.objectType === 'kitchen_counter')
    expect(counters.length).toBeGreaterThan(0)
    expect(counters.every((i) => i.category?.startsWith('base_cabinet'))).toBe(true)
  })
})

describe('request validation', () => {
  const examples = JSON.parse(readFileSync(path.resolve(INVENTORY_DIR, '../docs/design/schemas/request-examples.json'), 'utf8')) as Record<string, unknown>

  it.each(Object.keys(examples))('accepts the %s example', (definition) => {
    const validate = requestValidator(definition)
    expect(validate(examples[definition]), JSON.stringify(validate.errors)).toBe(true)
  })

  it('rejects removed rule fields, unknown types and quantities over 100', () => {
    const validate = requestValidator('ReplaceConfigurationRequest')
    const base = examples.ReplaceConfigurationRequest as { configuration: Record<string, unknown> }
    expect(validate({ ...base, configuration: { ...base.configuration, selectedRuleIds: [] } })).toBe(false)
    expect(validate({ ...base, configuration: { ...base.configuration, requirements: [{ id: 'r', objectType: 'sleep.bed.queen', quantity: 1, roomId: null }] } })).toBe(false)
    expect(validate({ ...base, configuration: { ...base.configuration, requirements: [{ id: 'r', objectType: 'bed', quantity: 101, roomId: null }] } })).toBe(false)
  })
})

describe('semantic validation', () => {
  const instructions = DEMO_ROOMS.map((r) => ({ roomId: r.id, note: '' }))

  it('rejects a bed assigned to the kitchen and overlapping requirements', () => {
    const { errors } = validateConfiguration(
      {
        prompt: '',
        budget: null,
        requirements: [
          { id: 'a', objectType: 'bed', quantity: 1, roomId: 'room-2' },
          { id: 'b', objectType: 'toilet', quantity: 1, roomId: null },
          { id: 'c', objectType: 'toilet', quantity: 1, roomId: 'room-4' },
        ],
        roomInstructions: instructions,
      },
      DEMO_ROOMS,
      catalog(),
    )
    expect(errors.map((e) => e.code)).toEqual(['ROOM_TYPE_MISMATCH', 'REQUIREMENT_OVERLAP'])
  })

  it('accepts a moved partition without doors and rejects one that strands a door', () => {
    const rooms = structuredClone(DEMO_ROOMS)
    const transforms = [
      { roomId: 'room-1', origin: { x: 0, y: 0 } },
      { roomId: 'room-2', origin: { x: 6, y: 0 } },
      { roomId: 'room-3', origin: { x: 0, y: 4 } },
      { roomId: 'room-4', origin: { x: 6, y: 4.5 } },
    ]
    rooms[1].polygon = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4.5 }, { x: 0, y: 4.5 }]
    rooms[3].polygon = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3.5 }, { x: 0, y: 3.5 }]
    // The bedroom/bath door (y 4.5–5.4 at x = 6) still lies on the shared edge.
    expect(validateRooms(rooms, transforms, DEMO_ROOMS.map((r) => r.id))).toEqual([])

    const shifted = structuredClone(DEMO_ROOMS)
    shifted[0].polygon = [{ x: 0, y: 0 }, { x: 5.5, y: 0 }, { x: 5.5, y: 4 }, { x: 0, y: 4 }]
    shifted[1].polygon = [{ x: 0, y: 0 }, { x: 4.5, y: 0 }, { x: 4.5, y: 4 }, { x: 0, y: 4 }]
    const moved = transforms.map((t) => (t.roomId === 'room-2' ? { ...t, origin: { x: 5.5, y: 0 } } : t.roomId === 'room-4' ? { ...t, origin: { x: 6, y: 4 } } : t))
    const codes = validateRooms(shifted, moved, DEMO_ROOMS.map((r) => r.id)).map((d) => d.code)
    expect(codes).toContain('OPENING_INVALID')
  })
})
