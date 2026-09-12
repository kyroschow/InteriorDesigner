import { rect } from '@/lib/geometry'
import type { FloorPlan } from '@/lib/floorplan'
import { INCHES_PER_FOOT } from '@/lib/units'

const ft = (n: number) => n * INCHES_PER_FOOT

/**
 * Birch Two-Bed — 78 m² (840 sq ft), the "bread-and-butter" plan from PLAN.md §4.
 * Living/kitchen run open-plan across the top; a central hall (also open to the
 * living room) serves both bedrooms and the bathroom.
 */
export const birchTwoBed: FloorPlan = {
  id: 'birch-two-bed',
  name: 'Birch Two-Bed',
  rooms: [
    {
      id: 'living',
      name: 'Living Room',
      type: 'living',
      footprint: rect(ft(0), ft(0), ft(18), ft(14)),
      openTo: ['kitchen', 'hall'],
    },
    {
      id: 'kitchen',
      name: 'Kitchen',
      type: 'kitchen',
      footprint: rect(ft(18), ft(0), ft(12), ft(14)),
      openTo: ['living'],
    },
    {
      id: 'bedroom-1',
      name: 'Primary Bedroom',
      type: 'bedroom',
      footprint: rect(ft(0), ft(14), ft(14), ft(14)),
    },
    {
      id: 'hall',
      name: 'Hall',
      type: 'hall',
      footprint: rect(ft(14), ft(14), ft(4), ft(14)),
      openTo: ['living'],
    },
    {
      id: 'bedroom-2',
      name: 'Bedroom 2',
      type: 'bedroom',
      footprint: rect(ft(18), ft(14), ft(12), ft(8)),
    },
    {
      id: 'bathroom',
      name: 'Bathroom',
      type: 'bathroom',
      footprint: rect(ft(18), ft(22), ft(12), ft(6)),
    },
  ],
  doors: [
    { x: ft(0), y: ft(3), length: ft(3), orientation: 'v' }, // front door — exterior wall into the living room
    { x: ft(14), y: ft(15.5), length: ft(2.5), orientation: 'v' }, // hall <-> bedroom 1
    { x: ft(18), y: ft(15.5), length: ft(2.5), orientation: 'v' }, // hall <-> bedroom 2
    { x: ft(18), y: ft(24.5), length: ft(2.5), orientation: 'v' }, // hall <-> bathroom
  ],
}
