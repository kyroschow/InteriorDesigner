/**
 * Onboarding draft state.
 *
 * Carries the choices made in the units + create-project screens across
 * navigation, until `POST /projects` turns them into a server project.
 * `unitSystem` is a sticky preference (persisted to localStorage); the rest is
 * transient. The raw `File` is kept in memory only — never persisted, and never
 * a stand-in for a backend asset id.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProjectMode, UnitSystem } from '@/types/interior'

export type { ProjectMode, UnitSystem }

export const DEFAULT_PROJECT_NAME = 'My apartment'

interface OnboardingState {
  unitSystem: UnitSystem
  projectName: string
  mode: ProjectMode | null
  uploadedFile: File | null
  setUnitSystem: (unitSystem: UnitSystem) => void
  setProjectName: (name: string) => void
  setMode: (mode: ProjectMode) => void
  setUploadedFile: (file: File | null) => void
  /** Clears the draft once the project exists. */
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      unitSystem: 'imperial',
      projectName: DEFAULT_PROJECT_NAME,
      mode: null,
      uploadedFile: null,
      setUnitSystem: (unitSystem) => set({ unitSystem }),
      setProjectName: (projectName) => set({ projectName }),
      setMode: (mode) => set((state) => ({ mode, uploadedFile: mode === 'scratch' ? null : state.uploadedFile })),
      setUploadedFile: (uploadedFile) => set({ uploadedFile }),
      reset: () => set({ projectName: DEFAULT_PROJECT_NAME, mode: null, uploadedFile: null }),
    }),
    {
      name: 'onboarding',
      partialize: (state) => ({ unitSystem: state.unitSystem }),
    },
  ),
)
