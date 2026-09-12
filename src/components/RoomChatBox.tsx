import { useState } from 'react'
import { ArrowUp, Sparkles } from 'lucide-react'
import { useFurnitureStore, type RoomNote } from '@/store/furnitureStore'

interface RoomChatBoxProps {
  roomId: string
}

// Stable reference — `s.notes[roomId] ?? []` would allocate a new array every
// render when empty, and Zustand's snapshot equality check would loop forever.
const NO_NOTES: RoomNote[] = []

/**
 * Per-room request box — "make it cozy", "keep a walkway to the window", etc.
 * No agent reads these yet (PLAN.md §5's program synthesis doesn't exist), so
 * this only captures notes for later; it doesn't respond or change anything.
 */
export function RoomChatBox({ roomId }: RoomChatBoxProps) {
  const notes = useFurnitureStore((s) => s.notes[roomId] ?? NO_NOTES)
  const addNote = useFurnitureStore((s) => s.addNote)
  const [draft, setDraft] = useState('')

  function submit() {
    const text = draft.trim()
    if (!text) return
    addNote(roomId, text)
    setDraft('')
  }

  return (
    <div className="mt-3 border-t border-canvas-line pt-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-soft/60">
        <Sparkles size={12} />
        Note
      </div>
      {notes.length > 0 && (
        <ul className="mb-2 space-y-1">
          {notes.map((note) => (
            <li key={note.id} className="rounded-control bg-canvas px-2.5 py-1.5 text-xs text-ink-soft">
              {note.text}
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex items-center gap-1.5"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. make it cozy and minimal"
          className="w-full rounded-control border border-canvas-line bg-app px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-soft/40 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-ink text-app disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowUp size={14} />
        </button>
      </form>
    </div>
  )
}
