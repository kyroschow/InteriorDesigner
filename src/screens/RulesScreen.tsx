import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { Brand } from '@/components/Brand'
import { FloorPlanSvg } from '@/components/FloorPlanSvg'
import { birchTwoBed } from '@/data/floorplans/birchTwoBed'
import { RULE_PACKS } from '@/data/ruleLibrary'

const STAGES = ['Reading your rooms…', 'Thinking about placement…', 'Applying design rules…', 'Finishing touches…']
const STAGE_MS = 500

/** Step 2: which design guidance to follow, then hand off to generation. */
export function RulesScreen() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  function handleGenerate() {
    setIsGenerating(true)
    setStageIndex(0)
    STAGES.forEach((_, i) => {
      if (i > 0) setTimeout(() => setStageIndex(i), STAGE_MS * i)
    })
    setTimeout(() => navigate('/project/export'), STAGE_MS * STAGES.length)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-4 border-b border-canvas-line px-6 py-3">
        <Brand size="sm" />
        <span className="text-sm text-ink-soft/60">{birchTwoBed.name}</span>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="no-scrollbar flex w-80 shrink-0 flex-col overflow-y-auto border-r border-canvas-line p-4">
          <div className="mb-1">
            <h2 className="serif text-lg text-ink">Design rules</h2>
            <p className="text-xs text-ink-soft/60">Pick the guidance the generator should follow.</p>
          </div>
          <div className="mt-3 flex-1 space-y-3">
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

          <div className="mt-4 flex items-center gap-2 border-t border-canvas-line pt-4">
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
        </aside>

        <main className="relative flex flex-1 items-center justify-center overflow-auto p-8">
          <div className="w-full max-w-2xl">
            <FloorPlanSvg plan={birchTwoBed} />
          </div>

          {isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-app/85 backdrop-blur-sm">
              <div className="relative flex h-14 w-14 items-center justify-center">
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-accent-pale border-t-accent" />
                <Sparkles size={20} className="text-accent" />
              </div>
              <p className="text-sm font-medium text-ink-soft">{STAGES[stageIndex]}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
