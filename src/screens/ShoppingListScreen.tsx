import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, ImageOff, Undo2 } from 'lucide-react'
import { Brand } from '@/components/Brand'
import { birchTwoBed } from '@/data/floorplans/birchTwoBed'
import { formatPriceCents } from '@/data/inventory'
import { buildShoppingList } from '@/lib/shoppingList'
import { useFurnitureStore } from '@/store/furnitureStore'

function Thumb({ url, alt }: { url?: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  if (!url || failed) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-control bg-canvas text-ink-soft/40">
        <ImageOff size={20} />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-16 w-16 shrink-0 rounded-control border border-canvas-line object-cover"
    />
  )
}

/**
 * PLAN.md §7's shoppable furniture matching, for the categories the inventory
 * actually covers (bed, couch, nightstand, tv-stand, sink). Dining table/
 * chair and toilet/shower show as unmatched — no real product data for them.
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
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-canvas-line px-6 py-3">
        <div className="flex items-center gap-4">
          <Brand size="sm" />
          <span className="text-sm text-ink-soft/60">{birchTwoBed.name} — shopping list</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/project/export')}
          className="inline-flex items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-canvas"
        >
          <Undo2 size={16} />
          Back to plan
        </button>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-6 py-8">
        {totalLineCount === 0 ? (
          <p className="text-sm text-ink-soft/60">No furniture selected yet — go back and add some to see a shopping list.</p>
        ) : (
          <>
            <div className="mb-6 flex items-baseline justify-between">
              <h1 className="serif text-2xl text-ink">Shopping list</h1>
              <span className="text-xs text-ink-soft/50">
                {matchedCount} of {totalLineCount} items matched to a real product
              </span>
            </div>

            <div className="space-y-6">
              {groups.map((group) => (
                <section key={group.roomId} className="panel rounded-card p-4">
                  <div className="mb-3 flex items-baseline justify-between">
                    <h2 className="serif text-base text-ink">{group.roomName}</h2>
                    <span className="tnum text-sm font-medium text-ink-soft">{formatPriceCents(group.subtotalCents)}</span>
                  </div>
                  <ul className="divide-y divide-canvas-line">
                    {group.lines.map((line) => (
                      <li key={line.itemId} className="flex items-center gap-3 py-3">
                        <Thumb url={line.product?.imageUrls[0]} alt={line.product?.name ?? line.itemLabel} />
                        <div className="min-w-0 flex-1">
                          {line.product ? (
                            <>
                              <div className="truncate text-sm font-medium text-ink">{line.product.name}</div>
                              <div className="truncate text-xs text-ink-soft/60">{line.product.description}</div>
                            </>
                          ) : (
                            <>
                              <div className="text-sm font-medium text-ink">{line.itemLabel}</div>
                              <div className="text-xs text-ink-soft/50">No product match yet</div>
                            </>
                          )}
                        </div>
                        <div className="tnum shrink-0 text-xs text-ink-soft/50">×{line.quantity}</div>
                        <div className="tnum w-20 shrink-0 text-right text-sm font-medium text-ink">
                          {line.product ? formatPriceCents(line.product.priceCents * line.quantity) : '—'}
                        </div>
                        {line.product ? (
                          <a
                            href={line.product.url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`View ${line.product.name} on IKEA`}
                            className="shrink-0 rounded-control p-2 text-ink-soft/50 hover:bg-canvas hover:text-accent"
                          >
                            <ExternalLink size={15} />
                          </a>
                        ) : (
                          <div className="w-9 shrink-0" />
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between rounded-card bg-accent-pale px-4 py-3">
              <span className="text-sm font-medium text-accent-deep">Estimated total</span>
              <span className="tnum text-lg font-semibold text-accent-deep">{formatPriceCents(grandTotalCents)}</span>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
