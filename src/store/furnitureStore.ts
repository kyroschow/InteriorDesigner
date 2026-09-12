import { create } from 'zustand'
import { clamp } from '@/lib/units'

const key = (roomId: string, itemId: string) => `${roomId}:${itemId}`

export interface RoomNote {
  id: string
  text: string
}

interface FurnitureState {
  quantities: Record<string, number>
  getQuantity: (roomId: string, itemId: string) => number
  setQuantity: (roomId: string, itemId: string, value: number, max: number) => void
  /** Freeform per-room requests, e.g. "make it cozy" — captured for when an agent exists to read them. */
  notes: Record<string, RoomNote[]>
  addNote: (roomId: string, text: string) => void
}

/** Furniture quantities and freeform notes the client wants, per room. */
export const useFurnitureStore = create<FurnitureState>((set, get) => ({
  quantities: {},
  getQuantity: (roomId, itemId) => get().quantities[key(roomId, itemId)] ?? 0,
  setQuantity: (roomId, itemId, value, max) =>
    set((state) => ({
      quantities: { ...state.quantities, [key(roomId, itemId)]: clamp(value, 0, max) },
    })),
  notes: {},
  addNote: (roomId, text) =>
    set((state) => ({
      notes: {
        ...state.notes,
        [roomId]: [...(state.notes[roomId] ?? []), { id: crypto.randomUUID(), text }],
      },
    })),
}))
