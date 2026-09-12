/**
 * Onboarding state.
 *
 * Carries the choices made in the units + create-project screens across
 * navigation. `unitSystem` is a real, sticky user preference (persisted to
 * localStorage); `mode` and `uploadedFile` are draft state for the project
 * being created right now and are not persisted.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UnitSystem = 'imperial' | 'metric'
export type ProjectMode = 'scratch' | 'upload'

export interface UploadedFile {
  name: string
  previewUrl: string | null
}

interface OnboardingState {
  unitSystem: UnitSystem
  mode: ProjectMode | null
  uploadedFile: UploadedFile | null
  setUnitSystem: (unitSystem: UnitSystem) => void
  setMode: (mode: ProjectMode) => void
  setUploadedFile: (file: UploadedFile | null) => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      unitSystem: 'imperial',
      mode: null,
      uploadedFile: null,
      setUnitSystem: (unitSystem) => set({ unitSystem }),
      setMode: (mode) =>
        set((state) => ({ mode, uploadedFile: mode === 'scratch' ? null : state.uploadedFile })),
      setUploadedFile: (uploadedFile) => set({ uploadedFile }),
    }),
    {
      name: 'onboarding',
      partialize: (state) => ({ unitSystem: state.unitSystem }),
    },
  ),
)
