/**
 * Onboarding state.
 *
 * Carries the choices made in the units + create-project screens across
 * navigation. `unitSystem` is a real, sticky user preference (persisted to
 * localStorage); `mode`, `uploadedFile`, and `doorFacing` are draft state for
 * the project being created right now and are not persisted.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UnitSystem = 'imperial' | 'metric'
export type ProjectMode = 'scratch' | 'upload'
export type CompassDirection = 'N' | 'E' | 'S' | 'W'

export interface UploadedFile {
  name: string
  previewUrl: string | null
}

interface OnboardingState {
  unitSystem: UnitSystem
  mode: ProjectMode | null
  uploadedFile: UploadedFile | null
  /** Which way the front door faces — asked on upload, since we can't see the uploaded plan to work it out. */
  doorFacing: CompassDirection | null
  setUnitSystem: (unitSystem: UnitSystem) => void
  setMode: (mode: ProjectMode) => void
  setUploadedFile: (file: UploadedFile | null) => void
  setDoorFacing: (direction: CompassDirection) => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      unitSystem: 'imperial',
      mode: null,
      uploadedFile: null,
      doorFacing: null,
      setUnitSystem: (unitSystem) => set({ unitSystem }),
      setMode: (mode) =>
        set((state) => ({
          mode,
          uploadedFile: mode === 'scratch' ? null : state.uploadedFile,
          doorFacing: mode === 'scratch' ? null : state.doorFacing,
        })),
      setUploadedFile: (uploadedFile) => set({ uploadedFile }),
      setDoorFacing: (doorFacing) => set({ doorFacing }),
    }),
    {
      name: 'onboarding',
      partialize: (state) => ({ unitSystem: state.unitSystem }),
    },
  ),
)
