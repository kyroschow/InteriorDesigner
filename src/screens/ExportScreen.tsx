import { useNavigate, useOutletContext } from 'react-router-dom'
import { ArrowLeft, Download, ShoppingCart } from 'lucide-react'
import type { ProjectOutletContext } from '@/screens/ProjectLayout'

/** Step 3's left pane: the layout's generated — nothing left to configure, just export it or see the shopping list. */
export function ExportScreen() {
  const navigate = useNavigate()
  const { downloadPng } = useOutletContext<ProjectOutletContext>()

  return (
    <>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <h2 className="serif text-lg text-ink">Your furnished plan</h2>
          <p className="mt-1 text-xs text-ink-soft/60">
            Generated from your furniture picks and design rules. Export it as an image, or see what it'd cost to
            actually buy.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/project/shopping-list')}
          className="panel flex w-full items-center gap-3 rounded-card p-4 text-left transition-colors hover:bg-canvas"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-accent-pale text-accent-deep">
            <ShoppingCart size={16} />
          </div>
          <div>
            <div className="text-sm font-medium text-ink">Shopping list</div>
            <p className="text-xs text-ink-soft/60">Real products, prices, and links</p>
          </div>
        </button>
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
          onClick={downloadPng}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-control bg-ink px-4 py-2.5 text-sm font-semibold text-app transition-transform hover:-translate-y-0.5"
        >
          <Download size={16} />
          Export PNG
        </button>
      </div>
    </>
  )
}
