import type { ReactNode } from 'react'
import clsx from 'clsx'

interface OptionCardProps {
  selected: boolean
  onClick: () => void
  icon: ReactNode
  title: string
  description: string
  /** Small piece of concrete detail, e.g. a worked example. Right-aligned on desktop. */
  example?: string
  disabled?: boolean
}

/** A large selectable tile used throughout onboarding for either/or choices. */
export function OptionCard({
  selected,
  onClick,
  icon,
  title,
  description,
  example,
  disabled,
}: OptionCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'panel flex w-full flex-col gap-3 rounded-card border-2 p-6 text-left transition-all',
        'hover:-translate-y-0.5 hover:shadow-lg focus-visible:-translate-y-0.5',
        disabled && 'cursor-not-allowed opacity-50 hover:translate-y-0',
        selected ? 'border-brass bg-gold' : 'border-transparent',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={clsx(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-control',
            selected ? 'bg-brass text-app' : 'bg-canvas text-ink-soft',
          )}
        >
          {icon}
        </div>
        <div
          className={clsx(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
            selected ? 'border-brass bg-brass' : 'border-canvas-line bg-transparent',
          )}
        >
          {selected ? <span className="h-2 w-2 rounded-full bg-app" /> : null}
        </div>
      </div>
      <div>
        <div className="serif text-lg text-ink">{title}</div>
        <p className="mt-1 text-sm text-ink-soft/70">{description}</p>
      </div>
      {example ? (
        <div className="tnum mt-1 text-sm font-medium text-gold-ink">{example}</div>
      ) : null}
    </button>
  )
}
