import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Compass, FileUp, PencilRuler, Upload, X } from 'lucide-react'
import clsx from 'clsx'
import { api } from '@/api/client'
import { Brand } from '@/components/Brand'
import { ErrorBanner } from '@/components/ErrorBanner'
import { OptionCard } from '@/components/OptionCard'
import { StagedLoadingOverlay } from '@/components/StagedLoadingOverlay'
import { StepHeader } from '@/components/StepHeader'
import { useOnboardingStore, type CompassDirection } from '@/store/onboardingStore'
import { useProjectPrefsStore } from '@/store/projectPrefsStore'
import { useRecentProjectsStore } from '@/store/recentProjectsStore'
import { ACCEPTED_UPLOAD_TYPES, DEMO_LAYOUT_ID, MAX_UPLOAD_BYTES, type Project } from '@/types/interior'

const STAGES = ['Creating your project…', 'Uploading your floor plan…']
const DIRECTIONS: CompassDirection[] = ['N', 'E', 'S', 'W']

/** Onboarding step 2: `POST /projects`, then multipart `POST /floor-plan` for uploads. */
export function CreateScreen() {
  const navigate = useNavigate()
  const { mode, setMode, uploadedFile, setUploadedFile, projectName, setProjectName, unitSystem, doorFacing, setDoorFacing, reset } = useOnboardingStore()
  const remember = useRecentProjectsStore((s) => s.remember)
  const saveDoorFacing = useProjectPrefsStore((s) => s.setDoorFacing)

  const [isDragOver, setIsDragOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'creating' | 'uploading'>('idle')
  const [error, setError] = useState<unknown>(null)
  /** Kept after a failed upload so a retry reuses the project instead of creating another. */
  const [created, setCreated] = useState<Project | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // This screen owns the preview URL: one per file, revoked on replacement and unmount.
  useEffect(() => {
    if (!uploadedFile?.type.startsWith('image/')) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(uploadedFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [uploadedFile])

  function handleFile(file: File | null) {
    if (!file) return
    if (!ACCEPTED_UPLOAD_TYPES.includes(file.type)) return setFileError('Upload a PNG, JPEG, WebP or PDF file.')
    if (file.size > MAX_UPLOAD_BYTES) return setFileError('Floor plans are limited to 20 MB.')
    setFileError(null)
    setUploadedFile(file)
  }

  function finish(project: Project) {
    if (doorFacing) saveDoorFacing(project.id, doorFacing)
    reset()
    navigate(`/projects/${project.id}/rooms`)
  }

  async function create() {
    setError(null)
    try {
      let project = created
      if (!project) {
        setPhase('creating')
        project = await api.createProject({ name: projectName.trim() || 'My apartment', unitSystem, mode: mode ?? 'scratch', demoLayoutId: DEMO_LAYOUT_ID })
        setCreated(project)
        remember(project)
      } else {
        project = await api.getProject(project.id)
      }
      if (mode === 'upload' && uploadedFile) {
        setPhase('uploading')
        await api.uploadFloorPlan(project.id, project.revision, uploadedFile)
      }
      finish(project)
    } catch (err) {
      setError(err)
      setPhase('idle')
    }
  }

  const canCreate = (mode === 'scratch' || (mode === 'upload' && uploadedFile != null && doorFacing != null)) && phase === 'idle'

  return (
    <div className="animate-pane-in relative mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-6 py-16">
      <div className="mb-8">
        <Brand size="sm" />
      </div>

      <StepHeader step={2} total={2} eyebrow="New project" title="Start your floor plan" subtitle="Both options start from our four-room demo layout for now." />

      <label className="mb-4 block text-sm font-medium text-ink-soft">
        Project name
        <input
          value={projectName}
          maxLength={120}
          onChange={(e) => setProjectName(e.target.value)}
          className="mt-1 w-full rounded-control border border-canvas-line bg-app px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
        />
      </label>

      <div role="radiogroup" aria-label="Project starting point" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <OptionCard selected={mode === 'scratch'} onClick={() => setMode('scratch')} icon={<PencilRuler size={20} />} title="Start from scratch" description="Begin with the demo layout — four rooms you can relabel." />
        <OptionCard
          selected={mode === 'upload'}
          onClick={() => setMode('upload')}
          icon={<Upload size={20} />}
          title="Upload a floor plan"
          description="Attach an image or PDF of your plan. It isn't analyzed yet, so you'll still start from the demo layout."
        />
      </div>

      {mode === 'upload' ? (
        <div
          className={clsx('panel mt-4 rounded-card border-2 border-dashed p-6 transition-colors', isDragOver ? 'border-accent bg-accent-pale' : 'border-canvas-line')}
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
              {previewUrl ? (
                <img src={previewUrl} alt="" className="h-16 w-16 shrink-0 rounded-control object-cover" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-control bg-canvas text-ink-soft">
                  <FileUp size={22} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink">{uploadedFile.name}</div>
                <div className="text-xs text-ink-soft/60">{(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB · ready to attach</div>
              </div>
              <button type="button" aria-label="Remove file" onClick={() => setUploadedFile(null)} className="shrink-0 rounded-control p-2 text-ink-soft/60 hover:bg-canvas hover:text-ink">
                <X size={16} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center gap-2 py-4 text-center">
              <FileUp size={22} className="text-ink-soft/50" />
              <span className="text-sm font-medium text-ink">
                Drop a file here, or <span className="text-accent-deep underline">browse</span>
              </span>
              <span className="text-xs text-ink-soft/50">PNG, JPEG, WebP or PDF, up to 20 MB</span>
            </button>
          )}
          {fileError && <p className="mt-2 text-xs text-red-700">{fileError}</p>}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_UPLOAD_TYPES.join(',')}
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0] ?? null)
              e.target.value = ''
            }}
          />
        </div>
      ) : null}

      {mode === 'upload' && uploadedFile ? (
        <div className="panel mt-4 rounded-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Compass size={16} className="text-ink-soft/60" />
            <span className="text-sm font-medium text-ink">Which way does the front door face?</span>
          </div>
          <p className="mb-3 text-xs text-ink-soft/60">We can't see orientation from the file itself, so this sets up the compass on your plan.</p>
          <div role="radiogroup" aria-label="Front door faces" className="grid grid-cols-4 gap-2">
            {DIRECTIONS.map((direction) => (
              <button
                key={direction}
                type="button"
                role="radio"
                aria-checked={doorFacing === direction}
                onClick={() => setDoorFacing(direction)}
                className={clsx(
                  'rounded-control border-2 py-2.5 text-sm font-semibold transition-colors',
                  doorFacing === direction ? 'border-accent bg-accent-pale text-accent-deep' : 'border-canvas-line text-ink-soft hover:border-accent/50',
                )}
              >
                {direction}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error != null && (
        <div className="mt-4 space-y-2">
          <ErrorBanner error={error} onDismiss={() => setError(null)} />
          {created && (
            <p className="text-xs text-ink-soft">
              Your project was created, but the file didn't upload.{' '}
              <button type="button" onClick={() => finish(created)} className="font-semibold text-accent-deep underline">
                Continue without the file
              </button>
            </p>
          )}
        </div>
      )}

      <div className="mt-10 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/new')} className="inline-flex items-center gap-2 rounded-control px-4 py-3 text-sm font-semibold text-ink-soft hover:bg-canvas">
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          type="button"
          disabled={!canCreate}
          onClick={create}
          className={clsx(
            'inline-flex items-center justify-center gap-2 rounded-control px-6 py-3 text-sm font-semibold transition-transform',
            canCreate ? 'bg-ink text-app hover:-translate-y-0.5' : 'cursor-not-allowed bg-canvas text-ink-soft/50',
          )}
        >
          {created && error != null ? 'Retry upload' : 'Create Project'}
          <ArrowRight size={16} />
        </button>
      </div>

      {phase !== 'idle' && <StagedLoadingOverlay stages={STAGES} stageIndex={phase === 'creating' ? 0 : 1} />}
    </div>
  )
}
