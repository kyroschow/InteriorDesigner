import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ChevronDown, Download, ExternalLink, Eye, ImageOff, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { GenerationFindings } from '@/components/GenerationFindings'
import type { ExportFormat } from '@/lib/exportSvg'
import { shortName } from '@/lib/sceneCoordinates'
import { formatLengthM, formatUsd } from '@/lib/units'
import { useProjectContext } from '@/screens/ProjectLayout'
import type { CatalogItem, PlacedObject, UnitSystem } from '@/types/interior'

const FORMATS: Array<{ id: ExportFormat; label: string }> = [
  { id: 'png', label: 'PNG' },
  { id: 'svg', label: 'SVG' },
  { id: 'pdf', label: 'PDF' },
]

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

interface Line {
  placement: PlacedObject
  item: CatalogItem | undefined
  quantity: number
}

/**
 * Results: the active, immutable layout — what was placed, the safety check,
 * what it costs, and real alternatives to browse. Alternatives are read-only:
 * the planner owns product choice, so a different pick means changing
 * constraints and applying again.
 */
export function ExportScreen() {
  const { project, catalog, activeLayout, generation, generationActive, exportPlan } = useProjectContext()
  const navigate = useNavigate()
  const [format, setFormat] = useState<ExportFormat>('png')
  const roomLabel = (id: string) => project.floor.rooms.find((r) => r.id === id)?.label ?? id

  if (!project.activeLayoutId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <h2 className="serif text-lg text-ink">No layout yet</h2>
        <p className="text-sm text-ink-soft/70">{generationActive ? 'Generating your first layout…' : 'Configured — awaiting generation.'}</p>
        {!generationActive && (
          <button type="button" onClick={() => navigate(`/projects/${project.id}/rules`)} className="rounded-control bg-ink px-4 py-2 text-sm font-semibold text-app">
            Go to Brief &amp; apply
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

  const itemsById = new Map(catalog.items.map((i) => [i.id, i]))
  const budget = project.configuration.budget
  const report = activeLayout.engineReport
  const lastAttempt = generation && generation.layoutId !== activeLayout.id && (generation.status === 'failed' || generation.status === 'stale') ? generation : null
  const groups = activeLayout.scene.rooms
    .map((room) => {
      const lines = new Map<string, Line>()
      for (const p of activeLayout.placements.filter((pl) => pl.roomId === room.id)) {
        const existing = lines.get(p.itemId)
        if (existing) existing.quantity++
        else lines.set(p.itemId, { placement: p, item: itemsById.get(p.itemId), quantity: 1 })
      }
      return { room, lines: [...lines.values()] }
    })
    .filter((g) => g.lines.length > 0)
  const unpriced = activeLayout.placements.filter((p) => p.priceMinor === null).length

  return (
    <>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <h2 className="serif text-lg text-ink">Your furnished plan</h2>
          <div className="mt-2 flex items-baseline justify-between rounded-control bg-accent-pale px-3 py-2">
            <span className="text-xs font-medium text-accent-deep">
              {activeLayout.placements.length} item{activeLayout.placements.length === 1 ? '' : 's'} · {budget ? `budget ${formatUsd(budget.amountMinor)}` : 'no budget set'}
            </span>
            <span className="tnum text-sm font-semibold text-accent-deep">{formatUsd(activeLayout.totalPriceMinor)}</span>
          </div>
          <p className="mt-1 text-[10px] text-ink-soft/50">
            Local catalog prices, not live offers; excludes tax and shipping{unpriced ? ` and ${unpriced} standard-size stand-in${unpriced === 1 ? '' : 's'} with no price` : ''}.
          </p>
        </div>

        {project.stale && (
          <p className="rounded-control bg-orange-50 px-3 py-2 text-xs text-orange-900">
            {project.stale.reason} This layout may not match the latest settings; apply again to update it.
          </p>
        )}
        {lastAttempt && (
          <div className="rounded-control border border-red-200 bg-red-50/50 p-2">
            <p className="mb-1 text-xs font-medium text-red-900">The latest attempt didn't replace this layout.</p>
            <GenerationFindings findings={lastAttempt.issues} roomLabel={roomLabel} />
          </div>
        )}

        <details className="panel rounded-card p-3" open={!report.pass}>
          <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-ink">
            <CheckCircle2 size={13} className={report.pass ? 'text-emerald-700' : 'text-red-700'} />
            {report.pass ? 'Every safety rule passes' : `${report.violations.length} rule violation(s)`} · open-space score {report.score}
          </summary>
          <ul className="mt-2 space-y-0.5 text-[11px] text-ink-soft">
            {report.metrics.map((m) => (
              <li key={m.roomId} className="flex justify-between gap-2">
                <span>{roomLabel(m.roomId)}</span>
                <span className="tnum text-ink-soft/70">
                  {Math.round(m.walkableAreaPct)}% walkable
                  {m.minPathWidthM != null ? ` · narrowest path ${formatLengthM(m.minPathWidthM, project.unitSystem)}` : ''}
                </span>
              </li>
            ))}
          </ul>
          <GenerationFindings findings={report.violations.map((v) => ({ code: 'RULE_VIOLATION', ruleId: v.ruleId, roomId: v.roomId ?? undefined, message: v.message, suggestion: v.hint }))} roomLabel={roomLabel} className="mt-2" />
          {activeLayout.rationale && (
            <p className="mt-2 border-t border-canvas-line pt-2 text-xs text-ink-soft/80">
              “{activeLayout.rationale}” <span className="text-[10px] text-ink-soft/50">— {activeLayout.planner}</span>
            </p>
          )}
        </details>

        {groups.map(({ room, lines }) => (
          <section key={room.id}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <h3 className="text-xs font-semibold tracking-[0.06em] text-ink-soft/50 uppercase">{room.label}</h3>
              <span className="tnum text-xs font-medium text-ink-soft">{formatUsd(lines.reduce((s, l) => s + (l.placement.priceMinor ?? 0) * l.quantity, 0))}</span>
            </div>
            <div className="panel space-y-1 rounded-card p-2">
              {lines.map((line) => (
                <ShoppingLine
                  key={line.placement.itemId}
                  line={line}
                  unitSystem={project.unitSystem}
                  alternatives={catalog.items.filter((i) => i.source === 'inventory' && i.objectType === line.placement.type && i.roomTypes.includes(room.type) && i.id !== line.placement.itemId)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="shrink-0 space-y-3 border-t border-canvas-line p-4">
        <div role="radiogroup" aria-label="Export format" className="flex gap-1.5 rounded-control bg-canvas p-1">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={format === f.id}
              onClick={() => setFormat(f.id)}
              className={clsx('flex-1 rounded-control py-1.5 text-xs font-semibold transition-colors', format === f.id ? 'panel text-ink' : 'text-ink-soft/60 hover:text-ink')}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
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

function ShoppingLine({ line, alternatives, unitSystem }: { line: Line; alternatives: CatalogItem[]; unitSystem: UnitSystem }) {
  const [open, setOpen] = useState(false)
  const { placement, item, quantity } = line
  const standIn = placement.source === 'default'
  return (
    <div className="rounded-control p-1.5">
      <div className="flex items-center gap-2">
        <Thumb url={item?.imageUrl} alt={placement.name} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-ink" title={placement.name}>
            {shortName(placement.name)}
            {item?.colorName && <span className="font-normal text-ink-soft/60"> · {item.colorName}</span>}
          </div>
          <div className="tnum text-[11px] text-ink-soft/50">
            ×{quantity} · {placement.priceMinor !== null ? formatUsd(placement.priceMinor * quantity) : standIn ? 'standard size, no product yet' : 'no price'}
          </div>
        </div>
        {item?.url && (
          <a href={item.url} target="_blank" rel="noreferrer" aria-label={`View ${shortName(placement.name)} on IKEA`} className="shrink-0 rounded-control p-1.5 text-ink-soft/40 hover:bg-canvas hover:text-accent">
            <ExternalLink size={13} />
          </a>
        )}
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
                <div key={alt.id} className="flex items-center gap-2 rounded-control bg-canvas px-2 py-1">
                  <Thumb url={alt.imageUrl} alt={alt.name} />
                  <div className="min-w-0 flex-1 text-[11px]">
                    <div className="truncate font-medium text-ink" title={alt.name}>
                      {shortName(alt.name)}
                      {alt.colorName && <span className="font-normal text-ink-soft/60"> · {alt.colorName}</span>}
                    </div>
                    <div className="tnum text-ink-soft/50">
                      {alt.priceMinor !== null ? formatUsd(alt.priceMinor) : 'no price'} · {formatLengthM(alt.footprint.w, unitSystem)} × {formatLengthM(alt.footprint.d, unitSystem)}
                    </div>
                  </div>
                  {alt.url && (
                    <a href={alt.url} target="_blank" rel="noreferrer" aria-label={`View ${shortName(alt.name)} on IKEA`} className="shrink-0 p-1 text-ink-soft/40 hover:text-accent">
                      <ExternalLink size={12} />
                    </a>
                  )}
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
