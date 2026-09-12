import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, CircleHelp, StickyNote } from 'lucide-react'
import clsx from 'clsx'
import { api } from '@/api/client'
import { ErrorBanner } from '@/components/ErrorBanner'
import { MAX_TEXT_LENGTH, type NoteClause, type Project } from '@/types/interior'

interface RoomNotesEditorProps {
  project: Project
  roomId: string
  onSaved: (project: Project) => void
  reload: () => Promise<unknown>
  /** Serialized project write (see ProjectOutletContext.write). */
  write: <T>(fn: (current: Project) => Promise<T>) => Promise<T>
}

/**
 * Per-room "Room notes & rules" (request-contracts-and-selection.md). Saves via
 * `PATCH /rooms/:roomId/note` and shows how the server interpreted the saved
 * note: what will apply, what needs clarification, and what is only noted.
 */
export function RoomNotesEditor({ project, roomId, onSaved, reload, write }: RoomNotesEditorProps) {
  const saved = project.configuration.roomInstructions.find((i) => i.roomId === roomId)?.note ?? ''
  const [text, setText] = useState(saved)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const lastSaved = useRef(saved)

  // Pick up server changes, but never clobber text the user is editing.
  useEffect(() => {
    if (saved === lastSaved.current) return
    setText((current) => (current === lastSaved.current ? saved : current))
    lastSaved.current = saved
  }, [saved])

  const dirty = text !== saved
  const inputId = `note-${roomId}`

  async function save(note: string) {
    setSaving(true)
    setError(null)
    try {
      await write(async (current) => {
        const next = await api.updateRoomNote(current.id, roomId, { expectedRevision: current.revision, note })
        onSaved(next)
        return next
      })
      setJustSaved(true)
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  const clauses = project.noteInterpretations.find((i) => i.roomId === roomId)?.clauses ?? []
  const willApply = clauses.filter((c) => c.status === 'supported')
  const needsClarification = clauses.filter((c) => c.status === 'conflict' || c.status === 'ambiguous' || (c.status === 'unsupported' && c.strength === 'hard'))
  const notEnforced = clauses.filter((c) => c.status === 'unsupported' && c.strength === 'soft')

  return (
    <div className="mt-3 border-t border-canvas-line pt-3">
      <label htmlFor={inputId} className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-ink-soft/60">
        <span className="inline-flex items-center gap-1.5">
          <StickyNote size={12} />
          Room notes &amp; rules
        </span>
        <span className="tnum text-[10px]">
          {text.length}/{MAX_TEXT_LENGTH}
        </span>
      </label>
      <textarea
        id={inputId}
        rows={2}
        maxLength={MAX_TEXT_LENGTH}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setJustSaved(false)
        }}
        placeholder={'e.g. "No TV in this room." or "Keep 0.8 m clear in front of the bed."'}
        className="w-full resize-y rounded-control border border-canvas-line bg-app px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-soft/40 focus:border-accent focus:outline-none"
      />
      <div className="mt-1.5 flex items-center justify-end gap-2">
        {justSaved && !dirty && <span className="mr-auto text-[11px] text-emerald-700">Saved</span>}
        {dirty && <span className="mr-auto text-[11px] text-ink-soft/50">Unsaved</span>}
        {(saved || text) && (
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setText('')
              if (saved) save('')
            }}
            className="rounded-control px-2 py-1 text-xs font-medium text-ink-soft hover:bg-canvas disabled:opacity-40"
          >
            Clear
          </button>
        )}
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() => save(text)}
          className="rounded-control bg-ink px-2.5 py-1 text-xs font-semibold text-app disabled:cursor-not-allowed disabled:opacity-30"
        >
          {saving ? 'Saving…' : 'Save note'}
        </button>
      </div>
      {error != null && <ErrorBanner error={error} onReload={() => reload().then(() => setError(null))} onDismiss={() => setError(null)} className="mt-2" />}

      {clauses.length > 0 && (
        <div className="mt-2 space-y-2">
          {dirty && <p className="text-[10px] text-ink-soft/50">Showing how the saved note was read. Save to check your edits.</p>}
          <ClauseGroup title="Will apply" tone="ok" clauses={willApply} />
          <ClauseGroup title="Needs clarification" tone="warn" clauses={needsClarification} />
          <ClauseGroup title="Noted, not enforced" tone="muted" clauses={notEnforced} />
        </div>
      )}
    </div>
  )
}

function ClauseGroup({ title, tone, clauses }: { title: string; tone: 'ok' | 'warn' | 'muted'; clauses: NoteClause[] }) {
  if (clauses.length === 0) return null
  const Icon = tone === 'ok' ? CheckCircle2 : CircleHelp
  return (
    <div>
      <div
        className={clsx(
          'mb-1 flex items-center gap-1 text-[10px] font-semibold tracking-[0.06em] uppercase',
          tone === 'ok' ? 'text-emerald-700' : tone === 'warn' ? 'text-amber-700' : 'text-ink-soft/50',
        )}
      >
        <Icon size={11} />
        {title}
      </div>
      <ul className="space-y-1">
        {clauses.map((c) => (
          <li key={`${c.span.start}-${c.sourceText}`} className="rounded-control bg-canvas px-2 py-1 text-[11px] text-ink-soft">
            <span className="text-ink">“{c.sourceText}”</span>
            <span className="block text-ink-soft/70">
              {c.message}
              {c.strength === 'hard' && c.status === 'supported' ? ' (must)' : c.strength === 'soft' && c.status === 'supported' ? ' (preference)' : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
