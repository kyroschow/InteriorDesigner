import { create } from 'zustand'
import { clamp } from '@/lib/units'

const key = (roomId: string, itemId: string) => `${roomId}:${itemId}`

interface FurnitureState {
  quantities: Record<string, number>
  getQuantity: (roomId: string, itemId: string) => number
  setQuantity: (roomId: string, itemId: string, value: number, max: number) => void
}

/** How much of each furniture item the client wants, per room. Keyed by "roomId:itemId". */
export const useFurnitureStore = create<FurnitureState>((set, get) => ({
  quantities: {},
  getQuantity: (roomId, itemId) => get().quantities[key(roomId, itemId)] ?? 0,
  setQuantity: (roomId, itemId, value, max) =>
    set((state) => ({
      quantities: { ...state.quantities, [key(roomId, itemId)]: clamp(value, 0, max) },
    })),
}))
