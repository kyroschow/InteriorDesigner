import { describe, expect, it } from 'vitest'
import type { CatalogItem } from '../../src/catalog/load.ts'
import { expandPlacements } from '../../src/generation/expander.ts'
import { demoRoom } from '../helpers.ts'

const mkItem = (id: string, w: number, d: number): CatalogItem => ({
  id,
  name: id,
  objectType: 'dresser',
  roomTypes: ['bedroom'],
  source: 'default',
  priceMinor: null,
  currency: 'USD',
  footprint: { w, d, h: 0.8 },
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

const room = demoRoom('room-3') // 6 x 4
const rooms = new Map([[room.id, room]])
const items = new Map([
  ['box', mkItem('box', 1.2, 0.5)],
  ['bed', mkItem('bed', 1.6, 2.0)],
  ['small', mkItem('small', 0.4, 0.4)],
])

const place = (instanceId: string, itemId: string, anchor: Record<string, unknown>) => ({ instanceId, roomId: room.id, itemId, anchor: anchor as never })

describe('anchor expander', () => {
  it.each([
    ['wall-bottom', { x: 1.6, y: 0.25, rot: 0 }],
    ['wall-top', { x: 1.6, y: 3.75, rot: 180 }],
    ['wall-left', { x: 0.25, y: 1.6, rot: 90 }],
    ['wall-right', { x: 5.75, y: 1.6, rot: 270 }],
  ])('puts the back against %s', (wallId, expected) => {
    const { placements, errors } = expandPlacements([place('a', 'box', { type: 'wall', wallId, alongM: 1.0 })], rooms, items)
    expect(errors).toEqual([])
    expect(placements[0].pose).toEqual({ ...expected, z: 0 })
  })

  it('centers a wall item in the widest free span when alongM is omitted', () => {
    // Bedroom wall-bottom: the door (x 4.6–5.5) and the bath door's clear zone leave 0–4.6 free.
    const { placements, errors } = expandPlacements([place('a', 'box', { type: 'wall', wallId: 'wall-bottom' })], rooms, items)
    expect(errors).toEqual([])
    expect(placements[0].pose).toEqual({ x: 2.3, y: 0.25, z: 0, rot: 0 })
  })

  it('explains that an item anchored to a failed item must wait for that fix', () => {
    const { errors } = expandPlacements(
      [place('bed', 'bed', { type: 'wall', wallId: 'wall-north' }), place('stand', 'small', { type: 'beside', refInstanceId: 'bed', side: 'left' })],
      rooms,
      items,
    )
    expect(errors).toEqual([expect.stringMatching(/^bed: unknown wallId/), 'stand: placed relative to bed, which has its own error; fix that first'])
  })

  it('resolves beside and facing anchors in dependency order', () => {
    const { placements, errors } = expandPlacements(
      [
        place('stand', 'small', { type: 'beside', refInstanceId: 'bed', side: 'right', gapM: 0.05 }),
        place('bed', 'bed', { type: 'wall', wallId: 'wall-bottom', alongM: 2 }),
        place('chest', 'box', { type: 'facing', refInstanceId: 'bed', side: 'front', distanceM: 1 }),
      ],
      rooms,
      items,
    )
    expect(errors).toEqual([])
    const byId = Object.fromEntries(placements.map((p) => [p.instanceId, p.pose]))
    expect(byId.bed).toEqual({ x: 2.8, y: 1, z: 0, rot: 0 })
    // right of a rot-0 item is +x; backs aligned at y = 0
    expect(byId.stand).toEqual({ x: 3.85, y: 0.2, z: 0, rot: 0 })
    // front of the bed is +y: 2.0 (bed front edge) + 1.0 gap + 0.25 half depth, turned to face -y
    expect(byId.chest).toEqual({ x: 2.8, y: 3.25, z: 0, rot: 180 })
  })

  it('reports reference cycles and bad walls in actionable terms', () => {
    const { errors } = expandPlacements(
      [
        place('a', 'small', { type: 'beside', refInstanceId: 'b', side: 'left' }),
        place('b', 'small', { type: 'beside', refInstanceId: 'a', side: 'left' }),
        place('c', 'small', { type: 'wall', wallId: 'wall-north', alongM: 1 }),
        place('d', 'small', { type: 'beside', side: 'left' }),
      ],
      rooms,
      items,
    )
    expect(errors.join('\n')).toMatch(/cycle/)
    expect(errors.join('\n')).toMatch(/unknown wallId wall-north/)
    expect(errors).toContain('d: beside anchor needs refInstanceId')
  })
})
