import { describe, expect, it } from 'vitest'
import type { ObjectType, Room, Rotation } from '../../src/domain/types.ts'
import { type EngineItem, evaluate } from '../../src/rules/engine.ts'
import { catalog, demoRoom } from '../helpers.ts'

const types = () => catalog().types

function item(instanceId: string, roomId: string, type: ObjectType, x: number, y: number, rot: Rotation, w: number, d: number, h = 0.8): EngineItem {
  return { instanceId, roomId, type, itemId: `test-${type}`, name: type, pose: { x, y, z: 0, rot }, footprint: { w, d, h }, priceMinor: null }
}

/** A 4 x 4 m kitchen with open doorways centered-ish on the left and right walls. */
function corridorRoom(): Room {
  return {
    id: 'k',
    label: 'Test kitchen',
    type: 'kitchen',
    polygon: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ],
    ceiling_height_m: 2.7,
    area_m2: 16,
    walls: (['bottom', 'right', 'top', 'left'] as const).map((side) => ({
      id: `wall-${side}` as const,
      side,
      a: { x: 0, y: 0 },
      b: { x: 0, y: 0 },
      length_m: 4,
      is_exterior: false,
    })),
    openings: [
      { id: 'west', kind: 'doorway', wall_id: 'wall-left', offset_m: 1.6, width_m: 0.9, height_m: 2.1, sill_m: 0, swing: 'none', leads_to: 'a' },
      { id: 'east', kind: 'doorway', wall_id: 'wall-right', offset_m: 1.6, width_m: 0.9, height_m: 2.1, sill_m: 0, swing: 'none', leads_to: 'b' },
    ],
    objects: [],
  }
}

describe('safety rules engine', () => {
  it('passes a bed against the bedroom wall with side access', () => {
    const report = evaluate({ rooms: [demoRoom('room-3')], items: [item('bed#1', 'room-3', 'bed', 1.05, 1.8, 90, 1.6, 2.1, 0.9)], types: types() })
    expect(report.violations).toEqual([])
    expect(report.pass).toBe(true)
    expect(report.metrics[0].doorsConnected).toBe(true)
  })

  it('flags a bed inside a door swing and across the door opening, with hints', () => {
    // wall-bottom of the bedroom has door-living-bedroom at x 4.6–5.5 swinging in.
    const report = evaluate({ rooms: [demoRoom('room-3')], items: [item('bed#1', 'room-3', 'bed', 5.0, 1.05, 0, 1.6, 2.1, 0.9)], types: types() })
    const rules = report.violations.map((v) => v.ruleId)
    expect(rules).toContain('SAFE-DOOR-SWING')
    expect(rules).toContain('SAFE-WALL')
    expect(report.violations.find((v) => v.ruleId === 'SAFE-DOOR-SWING')!.hint).toMatch(/Keep x 4\.60–5\.50, y 0\.00–0\.90 clear/)
  })

  it('requires a 0.9 m walkway between doors', () => {
    const narrow = evaluate({
      rooms: [corridorRoom()],
      items: [item('t1', 'k', 'dining_table', 2, 0.9, 0, 2, 1.8), item('t2', 'k', 'dining_table', 2, 3.25, 0, 2, 1.5)],
      types: types(),
    })
    const pathway = narrow.violations.find((v) => v.ruleId === 'SAFE-PATHWAY')
    expect(pathway?.message).toMatch(/narrows to 0\.70 m/)
    expect(narrow.metrics[0].doorsConnected).toBe(false)

    const wide = evaluate({
      rooms: [corridorRoom()],
      items: [item('t1', 'k', 'dining_table', 2, 0.9, 0, 2, 1.8), item('t2', 'k', 'dining_table', 2, 3.35, 0, 2, 1.3)],
      types: types(),
    })
    expect(wide.violations.filter((v) => v.ruleId === 'SAFE-PATHWAY')).toEqual([])
    expect(wide.metrics[0].minPathWidthM).toBeGreaterThanOrEqual(0.9)
  })

  it('treats touching items as not overlapping and lets chairs tuck under tables', () => {
    const report = evaluate({
      rooms: [corridorRoom()],
      items: [
        item('t1', 'k', 'dining_table', 2, 0.75, 0, 1.5, 0.9),
        item('t2', 'k', 'dining_table', 3.5, 0.75, 0, 1.5, 0.9),
        item('c1', 'k', 'dining_chair', 2, 1.3, 180, 0.45, 0.5),
      ],
      types: types(),
    })
    expect(report.violations.filter((v) => v.ruleId === 'SAFE-OVERLAP')).toEqual([])
  })

  it('requires toilet front clearance and keeps tall items out of windows', () => {
    // Bathroom window is on wall-top at 2.5–3.3 (sill 1.5).
    const report = evaluate({
      rooms: [demoRoom('room-4')],
      items: [item('shower#1', 'room-4', 'shower', 2.85, 3.55, 180, 0.9, 0.9, 2.0), item('toilet#1', 'room-4', 'toilet', 3.65, 2.2, 270, 0.4, 0.7), item('sink#1', 'room-4', 'sink', 3.0, 2.2, 90, 0.6, 0.5)],
      types: types(),
    })
    const rules = report.violations.map((v) => v.ruleId)
    expect(rules).toContain('SAFE-WINDOW')
    expect(report.violations.find((v) => v.ruleId === 'SAFE-ACCESS' && v.itemIds[0] === 'toilet#1')?.message).toMatch(/front is blocked by sink#1/)
  })

  it('rejects items in the wrong room type and extra instances', () => {
    const report = evaluate({
      rooms: [demoRoom('room-2')],
      items: [item('bed#1', 'room-2', 'bed', 1.05, 1.8, 90, 1.6, 2.1)],
      types: types(),
      expected: [],
    })
    const rules = report.violations.map((v) => v.ruleId)
    expect(rules).toContain('SAFE-ELIGIBLE')
    expect(rules).toContain('SAFE-QUANTITY')
  })

  it('reports items outside the room with the distance to move', () => {
    const report = evaluate({ rooms: [demoRoom('room-4')], items: [item('toilet#1', 'room-4', 'toilet', 3.9, 2, 270, 0.4, 0.7)], types: types() })
    expect(report.violations.find((v) => v.ruleId === 'SAFE-CONTAIN')?.hint).toMatch(/left by ≥ 0\.25 m/)
  })
})
