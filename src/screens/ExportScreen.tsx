import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Download, ExternalLink, Eye, ImageOff, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { GenerationFindings } from '@/components/GenerationFindings'
import { formatLengthM, formatUsd } from '@/lib/units'
import { useProjectContext } from '@/screens/ProjectLayout'
import type { CatalogItem, LayoutLine, UnitSystem } from '@/types/interior'

function Thumb({ url, alt }: { url?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false)
  if (!url || failed) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-canvas text-ink-soft/40">
        <ImageOff size={14} />
      </div>
    )
  }
  return <img src={url} alt={alt} onError={() => setFailed(true)} className="h-10 w-10 shrink-0 rounded-control border border-canvas-line object-cover" />
}

/**
 * Results: the active, immutable layout — what was placed and why, what it
 * costs, and eligible alternatives to browse. Alternatives are read-only: the
 * generator owns product choice, so a different pick means changing
 * constraints and applying again.
 */
export function ExportScreen() {
  const { project, catalog, activeLayout, generation, generationActive, downloadPng } = useProjectContext()
  const navigate = useNavigate()
  const roomLabel = (id: string) => project.floor.rooms.find((r) => r.id === id)?.label ?? id

  if (!project.activeLayoutId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <h2 className="serif text-lg text-ink">No layout yet</h2>
        <p className="text-sm text-ink-soft/70">{generationActive ? 'Generating your first layout…' : 'Configured — awaiting generation.'}</p>
        {!generationActive && (
          <button type="button" onClick={() => navigate(`/projects/${project.id}/rules`)} className="rounded-control bg-ink px-4 py-2 text-sm font-semibold text-app">
            Go to Rules &amp; apply
          </button>
        )}
      </div>
    )
  }
  if (!activeLayout) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-sm text-ink-soft">
        <Loader2 size={14} className="animate-spin" />
        Loading layout…
      </div>
    )
  }

  const budget = project.configuration.budget.amountMinor
  const staleRooms = project.roomStatuses.filter((s) => s.status === 'stale').map((s) => roomLabel(s.roomId))
  const lastAttempt = generation && generation.layoutId !== activeLayout.id && (generation.status === 'failed' || generation.status === 'stale') ? generation : null
  const groups = activeLayout.floor.rooms
    .map((room) => ({ room, lines: activeLayout.lines.filter((l) => l.roomId === room.id) }))
    .filter((g) => g.lines.length > 0)
  const itemCount = activeLayout.lines.reduce((n, l) => n + l.quantity, 0)

  return (
    <>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <h2 className="serif text-lg text-ink">Your furnished plan</h2>
          <div className="mt-2 flex items-baseline justify-between rounded-control bg-accent-pale px-3 py-2">
            <span className="text-xs font-medium text-accent-deep">
              {itemCount} item{itemCount === 1 ? '' : 's'} · budget {formatUsd(budget)}
            </span>
            <span className="tnum text-sm font-semibold text-accent-deep">{formatUsd(activeLayout.totalPriceMinor)}</span>
          </div>
          <p className="mt-1 text-[10px] text-ink-soft/50">Local catalog prices, not live offers. Excludes tax, shipping and fixed fixtures.</p>
        </div>

        {staleRooms.length > 0 && (
          <p className="rounded-control bg-orange-50 px-3 py-2 text-xs text-orange-900">
            Settings changed for {staleRooms.join(', ')} since this layout was generated, so it may not meet the latest requirements. Apply again to update.
          </p>
        )}
        {lastAttempt && (
          <div className="rounded-control border border-red-200 bg-red-50/50 p-2">
            <p className="mb-1 text-xs font-medium text-red-900">The latest attempt didn't replace this layout.</p>
            <GenerationFindings findings={lastAttempt.issues} roomLabel={roomLabel} />
          </div>
        )}

        <details className="panel rounded-card p-3" open={activeLayout.findings.some((f) => f.severity !== 'info')}>
          <summary className="cursor-pointer text-xs font-semibold text-ink">Checks &amp; explanations</summary>
          <GenerationFindings findings={activeLayout.findings} roomLabel={roomLabel} className="mt-2" />
          <ul className="mt-2 space-y-1 border-t border-canvas-line pt-2">
            {activeLayout.explanations.map((e, i) => (
              <li key={i} className="text-xs text-ink-soft/80">
                {e.message}
              </li>
            ))}
          </ul>
        </details>

        {groups.map(({ room, lines }) => (
          <section key={room.id}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <h3 className="text-xs font-semibold tracking-[0.06em] text-ink-soft/50 uppercase">{room.label}</h3>
              <span className="tnum text-xs font-medium text-ink-soft">{formatUsd(lines.reduce((s, l) => s + l.priceMinor * l.quantity, 0))}</span>
            </div>
            <div className="panel space-y-1 rounded-card p-2">
              {lines.map((line) => (
                <ShoppingLine
                  key={line.catalogItemId}
                  line={line}
                  unitSystem={project.unitSystem}
                  alternatives={catalog.items.filter(
                    (i) => i.selectionStatus === 'eligible' && i.objectType === line.objectType && i.catalogItemId !== line.catalogItemId && i.allowedRoomTypes.includes(room.type),
                  )}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-canvas-line p-4">
        <button
          type="button"
          onClick={() => navigate(`/projects/${project.id}/rules`)}
          className="inline-flex items-center gap-2 rounded-control px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-canvas"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <Link
          to={`/projects/${project.id}/preview?layoutId=${activeLayout.id}`}
          className="inline-flex items-center gap-2 rounded-control px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-canvas"
        >
          <Eye size={16} />
          Preview
        </Link>
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

function ShoppingLine({ line, alternatives, unitSystem }: { line: LayoutLine; alternatives: CatalogItem[]; unitSystem: UnitSystem }) {
  const [open, setOpen] = useState(false)
  const size = (i: CatalogItem) =>
    i.footprint.w && i.footprint.d ? `${formatLengthM(i.footprint.w, unitSystem)} × ${formatLengthM(i.footprint.d, unitSystem)}` : 'size unknown'
  return (
    <div className="rounded-control p-1.5">
      <div className="flex items-center gap-2">
        <Thumb url={line.imageUrl} alt={line.name} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-ink">
            {line.name}
            {line.colorName && <span className="font-normal text-ink-soft/60"> · {line.colorName}</span>}
          </div>
          <div className="tnum text-[11px] text-ink-soft/50">
            ×{line.quantity} · {formatUsd(line.priceMinor * line.quantity)}
          </div>
        </div>
        <a href={line.url} target="_blank" rel="noreferrer" aria-label={`View ${line.name} on IKEA`} className="shrink-0 rounded-control p-1.5 text-ink-soft/40 hover:bg-canvas hover:text-accent">
          <ExternalLink size={13} />
        </a>
      </div>
      {alternatives.length > 0 && (
        <div className="pl-12">
          <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="mt-1 inline-flex items-center gap-1 text-[11px] text-ink-soft/60 hover:text-accent-deep">
            <ChevronDown size={12} className={clsx('transition-transform', open && 'rotate-180')} />
            {alternatives.length} alternative{alternatives.length === 1 ? '' : 's'}
          </button>
          {open && (
            <div className="mt-1 space-y-1">
              {alternatives.map((alt) => (
                <div key={alt.catalogItemId} className="flex items-center gap-2 rounded-control bg-canvas px-2 py-1">
                  <Thumb url={alt.source.imageUrls[0]} alt={alt.name} />
                  <div className="min-w-0 flex-1 text-[11px]">
                    <div className="truncate font-medium text-ink">
                      {alt.name}
                      {alt.colorName && <span className="font-normal text-ink-soft/60"> · {alt.colorName}</span>}
                    </div>
                    <div className="tnum text-ink-soft/50">
                      {alt.priceMinor !== null ? formatUsd(alt.priceMinor) : 'no price'} · {size(alt)}
                    </div>
                  </div>
                  <a href={alt.source.url} target="_blank" rel="noreferrer" aria-label={`View ${alt.name} on IKEA`} className="shrink-0 p-1 text-ink-soft/40 hover:text-accent">
                    <ExternalLink size={12} />
                  </a>
                </div>
              ))}
              <p className="text-[10px] text-ink-soft/50">For browsing only. To get a different product, adjust colors, size limits or budget and apply again.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
