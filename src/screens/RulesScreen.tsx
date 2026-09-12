import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import clsx from 'clsx'
import { StagedLoadingOverlay } from '@/components/StagedLoadingOverlay'
import { birchTwoBed } from '@/data/floorplans/birchTwoBed'
import { RULE_PACKS } from '@/data/ruleLibrary'
import { useStagedLoading } from '@/lib/useStagedLoading'
import { useFurnitureStore } from '@/store/furnitureStore'

const STAGES = ['Reading your rooms…', 'Thinking about placement…', 'Applying design rules…', 'Finishing touches…']
const ROOM_NAME_BY_ID = Object.fromEntries(birchTwoBed.rooms.map((r) => [r.id, r.name]))

/** Step 2's left pane (rendered inside ProjectLayout's <Outlet/>): which design guidance to follow, then generate. */
export function RulesScreen() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string[]>([])
  const { isRunning: isGenerating, stageIndex, start } = useStagedLoading(STAGES)
  const notesByRoom = useFurnitureStore((s) => s.notes)
  const allNotes = Object.entries(notesByRoom).flatMap(([roomId, notes]) =>
    notes.map((n) => ({ room: ROOM_NAME_BY_ID[roomId] ?? roomId, text: n.text })),
  )

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  function handleGenerate() {
    start(() => navigate('/project/export'))
  }

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <div className="mb-1">
          <h2 className="serif text-lg text-ink">Design rules</h2>
          <p className="text-xs text-ink-soft/60">Pick the guidance the generator should follow.</p>
        </div>
        {RULE_PACKS.map((pack) => {
          const isSelected = selected.includes(pack.id)
          return (
            <button
              key={pack.id}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              onClick={() => toggle(pack.id)}
              className={clsx(
                'panel flex w-full items-start gap-3 rounded-card border-2 p-4 text-left transition-colors',
                isSelected ? 'border-accent bg-accent-pale' : 'border-transparent',
              )}
            >
              <div
                className={clsx(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-control border-2',
                  isSelected ? 'border-accent bg-accent' : 'border-canvas-line',
                )}
              >
                {isSelected && <Check size={13} className="text-app" />}
              </div>
              <div>
                <div className="text-sm font-medium text-ink">{pack.label}</div>
                <p className="mt-0.5 text-xs text-ink-soft/60">{pack.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-canvas-line p-4">
        <button
          type="button"
          onClick={() => navigate('/project')}
          className="inline-flex items-center gap-2 rounded-control px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-canvas"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          type="button"
          disabled={isGenerating}
          onClick={handleGenerate}
          className={clsx(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-control px-4 py-2.5 text-sm font-semibold transition-transform',
            isGenerating ? 'cursor-wait bg-canvas text-ink-soft/50' : 'bg-ink text-app hover:-translate-y-0.5',
          )}
        >
          Generate layout
          <ArrowRight size={16} />
        </button>
      </div>

      {isGenerating && <StagedLoadingOverlay stages={STAGES} stageIndex={stageIndex} notes={allNotes} />}
    </>
  )
}
