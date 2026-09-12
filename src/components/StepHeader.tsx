interface StepHeaderProps {
  step: number
  total: number
  eyebrow: string
  title: string
  subtitle?: string
}

/** Shared header for the onboarding screens: step count, title, subtitle. */
export function StepHeader({ step, total, eyebrow, title, subtitle }: StepHeaderProps) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-xs font-semibold tracking-[0.14em] text-brass-deep uppercase">
          {eyebrow}
        </span>
        <span className="tnum text-xs text-ink-soft/50">
          Step {step} of {total}
        </span>
      </div>
      <h1 className="serif text-3xl text-ink sm:text-4xl">{title}</h1>
      {subtitle ? <p className="mt-2 max-w-md text-[15px] text-ink-soft/70">{subtitle}</p> : null}
    </div>
  )
}
