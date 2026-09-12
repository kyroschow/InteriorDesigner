import { Minus, Plus } from 'lucide-react'

interface QuantityStepperProps {
  label: string
  value: number
  max: number
  onChange: (value: number) => void
}

/** A furniture line: name on the left, -/count/+ on the right, clamped to [0, max]. */
export function QuantityStepper({ label, value, max, onChange }: QuantityStepperProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-ink-soft">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= 0}
          onClick={() => onChange(value - 1)}
          className="flex h-6 w-6 items-center justify-center rounded-control border border-canvas-line text-ink-soft disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:border-accent enabled:hover:text-accent"
        >
          <Minus size={12} />
        </button>
        <span className="tnum w-4 text-center text-sm font-medium text-ink">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="flex h-6 w-6 items-center justify-center rounded-control border border-canvas-line text-ink-soft disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:border-accent enabled:hover:text-accent"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  )
}
