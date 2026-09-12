import clsx from 'clsx'

interface StepHeaderProps {
  step: number
  total: number
  eyebrow: string
  title: string
  subtitle?: string
  /** 'compact' for screens where a bigger hero above already carries the visual weight. */
  size?: 'default' | 'compact'
}

/** Shared header for the onboarding screens: step count, title, subtitle. */
export function StepHeader({ step, total, eyebrow, title, subtitle, size = 'default' }: StepHeaderProps) {
  const isCompact = size === 'compact'
  return (
    <div className={isCompact ? 'mb-6' : 'mb-8'}>
      <div className={clsx('flex items-center gap-3', isCompact ? 'mb-2' : 'mb-3')}>
        <span
          className={clsx(
            'font-semibold tracking-[0.14em] text-accent-deep uppercase',
            isCompact ? 'text-[10px]' : 'text-xs',
          )}
        >
          {eyebrow}
        </span>
        <span className="tnum text-xs text-ink-soft/50">
          Step {step} of {total}
        </span>
      </div>
      <h1 className={clsx('serif text-ink', isCompact ? 'text-base sm:text-lg' : 'text-3xl sm:text-4xl')}>
        {title}
      </h1>
      {subtitle ? (
        <p className={clsx('mt-2 max-w-md text-ink-soft/70', isCompact ? 'text-xs' : 'text-[15px]')}>
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
