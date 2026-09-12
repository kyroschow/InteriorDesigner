/**
 * Projects opened on this device, so "My Projects" can find them again. The
 * API has no list endpoint in the draft contract, so this is a client-side
 * index of ids only; each entry is re-fetched from the server when shown.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RecentProject {
  id: string
  name: string
  updatedAt: string
}

interface RecentProjectsState {
  projects: RecentProject[]
  remember: (project: RecentProject) => void
  forget: (id: string) => void
}

export const useRecentProjectsStore = create<RecentProjectsState>()(
  persist(
    (set) => ({
      projects: [],
      remember: ({ id, name, updatedAt }) =>
        set((state) => {
          const existing = state.projects.find((p) => p.id === id)
          if (existing && existing.name === name && existing.updatedAt === updatedAt) return state
          return { projects: [{ id, name, updatedAt }, ...state.projects.filter((p) => p.id !== id)].slice(0, 20) }
        }),
      forget: (id) => set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),
    }),
    { name: 'recent-projects' },
  ),
)
