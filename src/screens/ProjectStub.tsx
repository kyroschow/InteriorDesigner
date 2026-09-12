import { useNavigate } from 'react-router-dom'
import { Hammer } from 'lucide-react'
import { useOnboardingStore } from '@/store/onboardingStore'

/** Placeholder landing after "Create Project" — the real workspace isn't built yet. */
export function ProjectStub() {
  const navigate = useNavigate()
  const unitSystem = useOnboardingStore((s) => s.unitSystem)
  const mode = useOnboardingStore((s) => s.mode)
  const uploadedFile = useOnboardingStore((s) => s.uploadedFile)

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <div className="panel flex w-full flex-col items-center gap-4 rounded-panel p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-gold-ink">
          <Hammer size={24} />
        </div>
        <h1 className="serif text-2xl text-ink">Workspace coming soon</h1>
        <p className="text-sm text-ink-soft/70">
          Your project was created with these choices. The 2D/3D workspace isn't built yet — this is a
          stand-in.
        </p>

        <dl className="tnum mt-2 w-full space-y-2 rounded-control bg-canvas p-4 text-left text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft/60">Units</dt>
            <dd className="font-medium text-ink capitalize">{unitSystem}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft/60">Starting point</dt>
            <dd className="font-medium text-ink capitalize">{mode ?? '—'}</dd>
          </div>
          {mode === 'upload' ? (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft/60">Uploaded file</dt>
              <dd className="max-w-[60%] truncate font-medium text-ink">{uploadedFile?.name ?? '—'}</dd>
            </div>
          ) : null}
        </dl>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 rounded-control px-5 py-2.5 text-sm font-semibold text-ink-soft hover:bg-canvas"
        >
          Start over
        </button>
      </div>
    </div>
  )
}
