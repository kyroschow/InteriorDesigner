import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FileUp, PencilRuler, Upload, X } from 'lucide-react'
import clsx from 'clsx'
import { StepHeader } from '@/components/StepHeader'
import { OptionCard } from '@/components/OptionCard'
import { useOnboardingStore } from '@/store/onboardingStore'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']

/** Onboarding step 2: start from a blank canvas, or upload an existing floor plan. */
export function CreateScreen() {
  const navigate = useNavigate()
  const mode = useOnboardingStore((s) => s.mode)
  const setMode = useOnboardingStore((s) => s.setMode)
  const uploadedFile = useOnboardingStore((s) => s.uploadedFile)
  const setUploadedFile = useOnboardingStore((s) => s.setUploadedFile)

  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // The object URL is only ever created here, so it's this screen's job to
  // release it — both on replacement and on unmount.
  useEffect(() => {
    return () => {
      if (uploadedFile?.previewUrl) URL.revokeObjectURL(uploadedFile.previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFile(file: File | null) {
    if (!file || !ACCEPTED_TYPES.includes(file.type)) return
    if (uploadedFile?.previewUrl) URL.revokeObjectURL(uploadedFile.previewUrl)
    setUploadedFile({
      name: file.name,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    })
  }

  const canCreate = mode === 'scratch' || (mode === 'upload' && uploadedFile != null)

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-6 py-16">
      <StepHeader
        step={2}
        total={2}
        eyebrow="New project"
        title="Start your floor plan"
        subtitle="Draw a layout from scratch, or upload one you already have."
      />

      <div role="radiogroup" aria-label="Project starting point" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <OptionCard
          selected={mode === 'scratch'}
          onClick={() => setMode('scratch')}
          icon={<PencilRuler size={20} />}
          title="Start from scratch"
          description="Draw walls and rooms freehand on a blank canvas."
        />
        <OptionCard
          selected={mode === 'upload'}
          onClick={() => setMode('upload')}
          icon={<Upload size={20} />}
          title="Upload a floor plan"
          description="Bring in an image or PDF of an existing plan."
        />
      </div>

      {mode === 'upload' ? (
        <div
          className={clsx(
            'panel mt-4 rounded-card border-2 border-dashed p-6 transition-colors',
            isDragOver ? 'border-accent bg-accent-pale' : 'border-canvas-line',
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragOver(false)
            handleFile(e.dataTransfer.files[0] ?? null)
          }}
        >
          {uploadedFile ? (
            <div className="flex items-center gap-4">
              {uploadedFile.previewUrl ? (
                <img
                  src={uploadedFile.previewUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-control object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-control bg-canvas text-ink-soft">
                  <FileUp size={22} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink">{uploadedFile.name}</div>
                <div className="text-xs text-ink-soft/60">Ready to import</div>
              </div>
              <button
                type="button"
                aria-label="Remove file"
                onClick={() => setUploadedFile(null)}
                className="shrink-0 rounded-control p-2 text-ink-soft/60 hover:bg-canvas hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 py-4 text-center"
            >
              <FileUp size={22} className="text-ink-soft/50" />
              <span className="text-sm font-medium text-ink">
                Drop a file here, or <span className="text-accent-deep underline">browse</span>
              </span>
              <span className="text-xs text-ink-soft/50">PNG, JPG or PDF</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>
      ) : null}

      <div className="mt-10 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-control px-4 py-3 text-sm font-semibold text-ink-soft hover:bg-canvas"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          type="button"
          disabled={!canCreate}
          onClick={() => navigate('/project')}
          className={clsx(
            'inline-flex items-center justify-center gap-2 rounded-control px-6 py-3 text-sm font-semibold transition-transform',
            canCreate
              ? 'bg-ink text-app hover:-translate-y-0.5'
              : 'cursor-not-allowed bg-canvas text-ink-soft/50',
          )}
        >
          Create Project
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
