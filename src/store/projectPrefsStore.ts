/**
 * Per-project display preferences the API has no field for. Currently only
 * which way the front door faces, which rotates the drawing under a fixed
 * compass; it never changes stored geometry.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CompassDirection } from '@/lib/floorplan'

interface ProjectPrefsState {
  doorFacing: Record<string, CompassDirection>
  setDoorFacing: (projectId: string, direction: CompassDirection | null) => void
}

export const useProjectPrefsStore = create<ProjectPrefsState>()(
  persist(
    (set) => ({
      doorFacing: {},
      setDoorFacing: (projectId, direction) =>
        set((state) => {
          const next = { ...state.doorFacing }
          if (direction) next[projectId] = direction
          else delete next[projectId]
          return { doorFacing: next }
        }),
    }),
    { name: 'project-prefs' },
  ),
)
