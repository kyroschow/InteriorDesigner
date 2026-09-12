import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ErrorBanner } from '@/components/ErrorBanner'
import { GenerationFindings } from '@/components/GenerationFindings'
import { RoomFurnitureCard } from '@/components/RoomFurnitureCard'
import { RoomNotesEditor } from '@/components/RoomNotesEditor'
import { useProjectContext } from '@/screens/ProjectLayout'

/**
 * Furnish step: exact quantities per room (or anywhere), hard color/size
 * filters and per-room notes. Quantities live in the configuration draft
 * until "Next" saves them; notes save on their own.
 */
export function WorkspaceScreen() {
  const { project, draft, draftDirty, saveDraft, configErrors, applyProject, reload, write } = useProjectContext()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const roomLabel = (id: string) => project.floor.rooms.find((r) => r.id === id)?.label ?? id
  const totalItems = draft.requirements.reduce((sum, r) => sum + r.quantity, 0)
  const invalidSaved = project.configurationFindings.filter((f) => f.severity === 'error')
  const unplacedErrors = configErrors.filter((e) => !e.requirementId)

  async function next() {
    setSaving(true)
    setError(null)
    try {
      await saveDraft()
      navigate(`/projects/${project.id}/rules`)
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <h2 className="serif text-lg text-ink">Furnish</h2>
          <p className="text-xs text-ink-soft/60">Ask for exact quantities. Generation adds only what you request — nothing more, nothing less.</p>
        </div>

        {invalidSaved.length > 0 && (
          <div className="rounded-control border border-amber-200 bg-amber-50 p-2">
            <p className="mb-1 text-xs font-medium text-amber-900">The saved settings need attention before you can apply:</p>
            <GenerationFindings findings={invalidSaved} roomLabel={roomLabel} />
          </div>
        )}

        {project.floor.rooms.map((room) => (
          <RoomFurnitureCard key={room.id} room={room} status={project.roomStatuses.find((s) => s.roomId === room.id)?.status}>
            <RoomNotesEditor project={project} roomId={room.id} onSaved={applyProject} reload={reload} write={write} />
          </RoomFurnitureCard>
        ))}
        <RoomFurnitureCard room={null} />
      </div>

      <div className="shrink-0 space-y-2 border-t border-canvas-line p-4">
        {error != null && <ErrorBanner error={error} onReload={() => reload().then(() => setError(null))} onDismiss={() => setError(null)} />}
        {unplacedErrors.length > 0 && error == null && <p className="text-xs text-red-700">{unplacedErrors[0].message}</p>}
        <div className="flex items-center justify-between gap-3">
          <span className="tnum text-xs text-ink-soft/60">
            {totalItems} item{totalItems === 1 ? '' : 's'}
            {draftDirty ? ' · unsaved' : ''}
          </span>
          <button
            type="button"
            disabled={saving}
            onClick={next}
            className="inline-flex items-center justify-center gap-2 rounded-control bg-ink px-5 py-2.5 text-sm font-semibold text-app transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Next: Rules & apply'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </>
  )
}
