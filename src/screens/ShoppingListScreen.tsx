import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, ImageOff } from 'lucide-react'
import { birchTwoBed } from '@/data/floorplans/birchTwoBed'
import { formatPriceCents } from '@/data/inventory'
import { buildShoppingList } from '@/lib/shoppingList'
import { useFurnitureStore } from '@/store/furnitureStore'

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
 * Step 4's left pane: PLAN.md §7's shoppable furniture matching, for the
 * categories the inventory actually covers (bed, couch, nightstand, tv-stand,
 * sink). Dining table/chair and toilet/shower show as unmatched.
 */
export function ShoppingListScreen() {
  const navigate = useNavigate()
  const getQuantity = useFurnitureStore((s) => s.getQuantity)
  const quantities = useFurnitureStore((s) => s.quantities)

  const groups = useMemo(
    () => buildShoppingList(birchTwoBed.rooms, getQuantity),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quantities],
  )
  const grandTotalCents = groups.reduce((sum, g) => sum + g.subtotalCents, 0)
  const matchedCount = groups.reduce((sum, g) => sum + g.lines.filter((l) => l.product).length, 0)
  const totalLineCount = groups.reduce((sum, g) => sum + g.lines.length, 0)

  return (
    <>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <h2 className="serif text-lg text-ink">Shopping list</h2>
          <p className="mt-1 text-xs text-ink-soft/60">
            {totalLineCount === 0 ? 'No furniture selected yet.' : `${matchedCount} of ${totalLineCount} items matched.`}
          </p>
        </div>

        {groups.map((group) => (
          <section key={group.roomId}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <h3 className="text-xs font-semibold tracking-[0.06em] text-ink-soft/50 uppercase">{group.roomName}</h3>
              <span className="tnum text-xs font-medium text-ink-soft">{formatPriceCents(group.subtotalCents)}</span>
            </div>
            <div className="panel space-y-1 rounded-card p-2">
              {group.lines.map((line) => (
                <div key={line.itemId} className="flex items-center gap-2 rounded-control p-1.5">
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
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-canvas-line p-4">
        <button
          type="button"
          onClick={() => navigate('/project/export')}
          className="inline-flex items-center gap-2 rounded-control px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-canvas"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="text-right">
          <div className="text-[10px] text-ink-soft/50">Estimated total</div>
          <div className="tnum text-sm font-semibold text-accent-deep">{formatPriceCents(grandTotalCents)}</div>
        </div>
      </div>
    </>
  )
}
