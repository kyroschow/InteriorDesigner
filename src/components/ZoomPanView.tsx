import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Minus, Plus, Scan } from 'lucide-react'
import clsx from 'clsx'

const MIN_SCALE = 0.5
const MAX_SCALE = 6
const BUTTON_STEP = 1.4
/** Pointer travel (px) before a press becomes a pan instead of a click. */
const DRAG_THRESHOLD_PX = 4

interface View {
  scale: number
  x: number
  y: number
}

interface ZoomPanViewProps {
  children: ReactNode
  /** Changing this resets to the fitted view (e.g. when switching rooms). */
  resetKey?: string | number | null
  className?: string
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Zoom (wheel, trackpad pinch, +/− buttons) and pan (drag) for the floor plan.
 * Purely visual: it transforms a wrapper, so exports of the inner SVG are unaffected.
 * Clicks on rooms still work; a press only pans once the pointer moves.
 */
export function ZoomPanView({ children, resetKey, className }: ZoomPanViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 })
  const drag = useRef<{ id: number; startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)

  const reset = useCallback(() => setView({ scale: 1, x: 0, y: 0 }), [])
  useEffect(reset, [resetKey, reset])

  /** Zoom by `factor`, keeping the point under (px, py) — container coordinates — fixed. */
  const zoomAt = useCallback((factor: number, px?: number, py?: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    const cx = px ?? (rect ? rect.width / 2 : 0)
    const cy = py ?? (rect ? rect.height / 2 : 0)
    setView((v) => {
      const scale = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE)
      const k = scale / v.scale
      return { scale, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k }
    })
  }, [])

  // Wheel needs a non-passive listener to stop the page from scrolling.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const speed = e.ctrlKey ? 0.01 : 0.0015 // trackpad pinch arrives as ctrl+wheel with small deltas
      zoomAt(Math.exp(-e.deltaY * speed), e.clientX - rect.left, e.clientY - rect.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  const zoomed = view.scale !== 1 || view.x !== 0 || view.y !== 0

  return (
    <div
      ref={containerRef}
      className={clsx('relative overflow-hidden select-none', view.scale > 1 ? 'cursor-grab touch-none' : 'touch-pan-y', className)}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        drag.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, originX: view.x, originY: view.y, moved: false }
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d || d.id !== e.pointerId) return
        const dx = e.clientX - d.startX
        const dy = e.clientY - d.startY
        if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
        if (!d.moved) {
          d.moved = true
          e.currentTarget.setPointerCapture(e.pointerId)
        }
        setView((v) => ({ ...v, x: d.originX + dx, y: d.originY + dy }))
      }}
      onPointerUp={(e) => {
        suppressClick.current = Boolean(drag.current?.moved)
        if (drag.current?.moved) e.currentTarget.releasePointerCapture(e.pointerId)
        drag.current = null
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
      onClickCapture={(e) => {
        // A drag that ends over a room must not also select it.
        if (suppressClick.current) {
          e.stopPropagation()
          suppressClick.current = false
        }
      }}
    >
      <div className="h-full w-full origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
        {children}
      </div>

      <div className="absolute right-3 bottom-3 flex items-center gap-0.5 rounded-control border border-canvas-line bg-app/95 p-0.5 shadow-sm" onPointerDown={(e) => e.stopPropagation()}>
        <button type="button" aria-label="Zoom out" onClick={() => zoomAt(1 / BUTTON_STEP)} disabled={view.scale <= MIN_SCALE} className="rounded-[7px] p-1.5 text-ink-soft hover:bg-canvas disabled:opacity-30">
          <Minus size={14} />
        </button>
        <span className="tnum w-11 text-center text-[11px] text-ink-soft" aria-live="polite">
          {Math.round(view.scale * 100)}%
        </span>
        <button type="button" aria-label="Zoom in" onClick={() => zoomAt(BUTTON_STEP)} disabled={view.scale >= MAX_SCALE} className="rounded-[7px] p-1.5 text-ink-soft hover:bg-canvas disabled:opacity-30">
          <Plus size={14} />
        </button>
        <button type="button" aria-label="Fit to view" onClick={reset} disabled={!zoomed} className="rounded-[7px] p-1.5 text-ink-soft hover:bg-canvas disabled:opacity-30">
          <Scan size={14} />
        </button>
      </div>
    </div>
  )
}
