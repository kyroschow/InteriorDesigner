import { QuantityStepper } from '@/components/QuantityStepper'
import type { FurnitureType, Requirement } from '@/types/interior'

/** UI cap per line; the API accepts up to 100. */
const MAX_PER_LINE = 10

interface FurnitureRequirementRowProps {
  type: FurnitureType
  roomId: string | null
  requirement: Requirement | undefined
  errors: string[]
  onChange: (next: Requirement | null) => void
}

/** One furniture type and its exact quantity. Style, color and size preferences go in the room notes. */
export function FurnitureRequirementRow({ type, roomId, requirement, errors, onChange }: FurnitureRequirementRowProps) {
  return (
    <div className="py-0.5">
      <QuantityStepper
        label={type.label}
        value={requirement?.quantity ?? 0}
        max={MAX_PER_LINE}
        onChange={(value) => onChange(value <= 0 ? null : { id: `req-${roomId ?? 'any'}-${type.id}`, objectType: type.id, roomId, ...requirement, quantity: value })}
      />
      {errors.map((message, i) => (
        <p key={i} className="pb-1 text-[11px] text-red-700">
          {message}
        </p>
      ))}
    </div>
  )
}
