import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Download, ExternalLink, ImageOff } from 'lucide-react'
import clsx from 'clsx'
import type { ExportFormat, ProjectOutletContext } from '@/screens/ProjectLayout'
import { birchTwoBed } from '@/data/floorplans/birchTwoBed'
import { formatPriceCents } from '@/data/inventory'
import { buildShoppingList } from '@/lib/shoppingList'
import { useFurnitureStore } from '@/store/furnitureStore'

const FORMATS: Array<{ id: ExportFormat; label: string }> = [
  { id: 'png', label: 'PNG' },
  { id: 'svg', label: 'SVG' },
  { id: 'pdf', label: 'PDF' },
]

function Thumb({ url, alt }: { url?: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  if (!url || failed) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-canvas text-ink-soft/40">
        <ImageOff size={14} />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-10 w-10 shrink-0 rounded-control border border-canvas-line object-cover"
    />
  )
}

/**
 * Step 3's left pane: the layout's generated — export it, and see what it'd
 * cost to actually buy, right here (PLAN.md §7's shoppable furniture
 * matching, for the categories the inventory covers).
 */
export function ExportScreen() {
  const navigate = useNavigate()
  const { exportPlan } = useOutletContext<ProjectOutletContext>()
  const [format, setFormat] = useState<ExportFormat>('png')
  const getQuantity = useFurnitureStore((s) => s.getQuantity)
  const quantities = useFurnitureStore((s) => s.quantities)
  const getProductChoice = useFurnitureStore((s) => s.getProductChoice)
  const setProductChoice = useFurnitureStore((s) => s.setProductChoice)
  const productChoices = useFurnitureStore((s) => s.productChoices)

  const groups = useMemo(
    () => buildShoppingList(birchTwoBed.rooms, getQuantity, getProductChoice),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quantities, productChoices],
  )
  const grandTotalCents = groups.reduce((sum, g) => sum + g.subtotalCents, 0)
  const matchedCount = groups.reduce((sum, g) => sum + g.lines.filter((l) => l.product).length, 0)
  const totalLineCount = groups.reduce((sum, g) => sum + g.lines.length, 0)

  return (
    <>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <h2 className="serif text-lg text-ink">Your furnished plan</h2>
          {totalLineCount > 0 && (
            <div className="mt-2 flex items-baseline justify-between rounded-control bg-accent-pale px-3 py-2">
              <span className="text-xs font-medium text-accent-deep">
                Estimated total ({matchedCount}/{totalLineCount} matched)
              </span>
              <span className="tnum text-sm font-semibold text-accent-deep">{formatPriceCents(grandTotalCents)}</span>
            </div>
          )}
        </div>

        {groups.map((group) => (
          <section key={group.roomId}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <h3 className="text-xs font-semibold tracking-[0.06em] text-ink-soft/50 uppercase">{group.roomName}</h3>
              <span className="tnum text-xs font-medium text-ink-soft">{formatPriceCents(group.subtotalCents)}</span>
            </div>
            <div className="panel space-y-1 rounded-card p-2">
              {group.lines.map((line) => (
                <div key={line.itemId} className="rounded-control p-1.5">
                  <div key={line.optionIndex} className="animate-item-swap flex items-center gap-2">
                    <Thumb url={line.product?.imageUrls[0]} alt={line.product?.name ?? line.itemLabel} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-ink">{line.product?.name ?? line.itemLabel}</div>
                      <div className="tnum text-[11px] text-ink-soft/50">
                        ×{line.quantity} · {line.product ? formatPriceCents(line.product.priceCents * line.quantity) : 'no match'}
                      </div>
                    </div>
                    {line.product && (
                      <a
                        href={line.product.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`View ${line.product.name} on IKEA`}
                        className="shrink-0 rounded-control p-1.5 text-ink-soft/40 hover:bg-canvas hover:text-accent"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                  {line.optionCount > 1 && (
                    <div className="mt-1 flex items-center justify-center gap-2 pl-12 text-ink-soft/50">
                      <button
                        type="button"
                        aria-label={`Previous option for ${line.itemLabel}`}
                        onClick={() =>
                          setProductChoice(
                            line.roomId,
                            line.itemId,
                            (line.optionIndex - 1 + line.optionCount) % line.optionCount,
                          )
                        }
                        className="rounded-control p-0.5 hover:bg-canvas hover:text-accent"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <span className="tnum text-[10px]">
                        Option {line.optionIndex + 1} of {line.optionCount}
                      </span>
                      <button
                        type="button"
                        aria-label={`Next option for ${line.itemLabel}`}
                        onClick={() => setProductChoice(line.roomId, line.itemId, (line.optionIndex + 1) % line.optionCount)}
                        className="rounded-control p-0.5 hover:bg-canvas hover:text-accent"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="shrink-0 border-t border-canvas-line p-4">
        <div className="mb-3 flex gap-1.5 rounded-control bg-canvas p-1">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f.id)}
              className={clsx(
                'flex-1 rounded-control py-1.5 text-xs font-semibold transition-colors',
                format === f.id ? 'panel text-ink' : 'text-ink-soft/60 hover:text-ink',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
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
            onClick={() => exportPlan(format)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-control bg-ink px-4 py-2.5 text-sm font-semibold text-app transition-transform hover:-translate-y-0.5"
          >
            <Download size={16} />
            Export {format.toUpperCase()}
          </button>
        </div>
      </div>
    </>
  )
}
