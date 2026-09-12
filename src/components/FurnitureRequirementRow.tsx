import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { QuantityStepper } from '@/components/QuantityStepper'
import { inputToMeters, lengthInputUnit, metersToInput } from '@/lib/units'
import { COLOR_FAMILIES, type FurnitureType, type Requirement, type UnitSystem } from '@/types/interior'

/** UI cap per line; the API accepts up to 100. */
const MAX_PER_LINE = 10

const SWATCH: Record<string, string> = {
  white: '#f5f5f4',
  black: '#1f2937',
  gray: '#8a8f98',
  beige: '#d6c7a1',
  brown: '#7c5a3a',
  natural: '#c8a27a',
  blue: '#3b6ea5',
  green: '#5f8a6b',
}

interface FurnitureRequirementRowProps {
  type: FurnitureType
  roomId: string | null
  requirement: Requirement | undefined
  /** Color families present among this type's real products. */
  availableColors: string[]
  /** Only a standard-size stand-in exists for this type (no product, price or color). */
  standardSizeOnly: boolean
  unitSystem: UnitSystem
  errors: string[]
  onChange: (next: Requirement | null) => void
}

type DimKey = 'w' | 'd' | 'h'
const DIMS: DimKey[] = ['w', 'd', 'h']
const DIM_LABELS: Record<DimKey, string> = { w: 'W', d: 'D', h: 'H' }

/** One furniture type: exact quantity, then optional limits (colors, max size). */
export function FurnitureRequirementRow({ type, roomId, requirement, availableColors, standardSizeOnly, unitSystem, errors, onChange }: FurnitureRequirementRowProps) {
  const quantity = requirement?.quantity ?? 0
  const allowedColors = requirement?.allowedColors ?? []
  const [open, setOpen] = useState(false)
  const dimsFrom = (req?: Requirement): Record<DimKey, string> => {
    const m = req?.maxDimensionsM
    return m ? { w: String(metersToInput(m.w, unitSystem)), d: String(metersToInput(m.d, unitSystem)), h: String(metersToInput(m.h, unitSystem)) } : { w: '', d: '', h: '' }
  }
  const [dims, setDims] = useState(() => dimsFrom(requirement))
  useEffect(() => setDims(dimsFrom(requirement)), [unitSystem, requirement?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const setQuantity = (value: number) => {
    if (value <= 0) {
      onChange(null)
      setOpen(false)
      return
    }
    // allowedColors: [] matches the server's normalization, so a saved draft isn't reported as dirty.
    onChange({ id: `req-${roomId ?? 'any'}-${type.id}`, objectType: type.id, roomId, allowedColors: [], ...requirement, quantity: value })
  }

  const toggleColor = (color: string) => {
    if (!requirement) return
    onChange({ ...requirement, allowedColors: allowedColors.includes(color) ? allowedColors.filter((c) => c !== color) : [...allowedColors, color] })
  }

  const updateDim = (key: DimKey, value: string) => {
    const next = { ...dims, [key]: value }
    setDims(next)
    if (!requirement) return
    const values = DIMS.map((k) => Number(next[k]))
    if (DIMS.every((k) => next[k].trim() === '')) {
      const { maxDimensionsM: _drop, ...rest } = requirement
      onChange(rest)
    } else if (DIMS.every((k) => next[k].trim() !== '') && values.every((v) => Number.isFinite(v) && v > 0)) {
      const [w, d, h] = values.map((v) => inputToMeters(v, unitSystem))
      onChange({ ...requirement, maxDimensionsM: { w, d, h } })
    }
  }
  const partialDims = DIMS.some((k) => dims[k].trim() !== '') && !requirement?.maxDimensionsM

  const summary = requirement
    ? [
        standardSizeOnly ? 'Standard size' : allowedColors.length ? allowedColors.join(', ') : 'Any color',
        requirement.maxDimensionsM ? `max ${dims.w}×${dims.d}×${dims.h} ${lengthInputUnit(unitSystem)}` : 'no size limit',
      ].join(' · ')
    : ''

  return (
    <div className="py-0.5">
      <QuantityStepper label={type.label} value={quantity} max={MAX_PER_LINE} onChange={setQuantity} />
      {requirement && (
        <div className="pb-1.5 pl-1">
          <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="inline-flex max-w-full items-center gap-1 text-[11px] text-ink-soft/60 hover:text-accent-deep">
            <ChevronDown size={12} className={clsx('shrink-0 transition-transform', open && 'rotate-180')} />
            <span className="truncate">{summary}</span>
          </button>
          {open && (
            <div className="mt-1.5 space-y-2 rounded-control bg-canvas p-2">
              {standardSizeOnly ? (
                <p className="text-[10px] text-ink-soft/60">No real product is in the catalog for this yet, so the planner uses a standard-size stand-in with no price or color.</p>
              ) : (
                <fieldset>
                  <legend className="mb-1 text-[10px] font-semibold tracking-[0.06em] text-ink-soft/50 uppercase">Allowed colors</legend>
                  <div className="flex flex-wrap gap-1">
                    {COLOR_FAMILIES.filter((c) => availableColors.includes(c) || allowedColors.includes(c)).map((color) => {
                      const on = allowedColors.includes(color)
                      return (
                        <button
                          key={color}
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => toggleColor(color)}
                          className={clsx(
                            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] capitalize',
                            on ? 'border-accent bg-accent-pale text-accent-deep' : 'border-canvas-line bg-app text-ink-soft',
                          )}
                        >
                          <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: SWATCH[color] }} />
                          {color}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-1 text-[10px] text-ink-soft/50">None selected means any color.</p>
                </fieldset>
              )}
              <fieldset>
                <legend className="mb-1 text-[10px] font-semibold tracking-[0.06em] text-ink-soft/50 uppercase">Maximum size ({lengthInputUnit(unitSystem)})</legend>
                <div className="flex gap-1.5">
                  {DIMS.map((key) => (
                    <label key={key} className="flex items-center gap-1 text-[11px] text-ink-soft">
                      {DIM_LABELS[key]}
                      <input
                        inputMode="decimal"
                        value={dims[key]}
                        onChange={(e) => updateDim(key, e.target.value)}
                        aria-label={`Maximum ${key === 'w' ? 'width' : key === 'd' ? 'depth' : 'height'}`}
                        className="tnum w-14 rounded-control border border-canvas-line bg-app px-1.5 py-0.5 text-xs text-ink focus:border-accent focus:outline-none"
                      />
                    </label>
                  ))}
                </div>
                {partialDims && <p className="mt-1 text-[10px] text-amber-700">Fill in all three to apply a size limit.</p>}
              </fieldset>
            </div>
          )}
          {errors.map((message, i) => (
            <p key={i} className="mt-1 text-[11px] text-red-700">
              {message}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
