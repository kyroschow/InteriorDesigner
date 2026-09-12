import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Brand } from '@/components/Brand'
import { StepHeader } from '@/components/StepHeader'
import { OptionCard } from '@/components/OptionCard'
import { useOnboardingStore, type UnitSystem } from '@/store/onboardingStore'

const UNIT_OPTIONS: Array<{
  value: UnitSystem
  badge: string
  title: string
  description: string
  example: string
}> = [
  {
    value: 'imperial',
    badge: 'ft',
    title: 'Imperial',
    description: 'Feet and inches, the way US floor plans are usually drawn.',
    example: '12 ft 6 in',
  },
  {
    value: 'metric',
    badge: 'm',
    title: 'Metric',
    description: 'Meters and centimeters.',
    example: '3.8 m',
  },
]

/** Onboarding step 1: pick a measurement system for the whole project. */
export function UnitsScreen() {
  const navigate = useNavigate()
  const unitSystem = useOnboardingStore((s) => s.unitSystem)
  const setUnitSystem = useOnboardingStore((s) => s.setUnitSystem)

  return (
    <div className="animate-pane-in mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-6 py-16">
      <div className="mb-8">
        <Brand size="sm" />
      </div>

      <StepHeader
        step={1}
        total={2}
        eyebrow="New project"
        title="How do you like to measure?"
        subtitle="This sets how dimensions are shown across your project. You can change it later in settings."
      />

      <div role="radiogroup" aria-label="Unit system" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {UNIT_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            selected={unitSystem === opt.value}
            onClick={() => setUnitSystem(opt.value)}
            icon={<span className="serif text-base font-semibold">{opt.badge}</span>}
            title={opt.title}
            description={opt.description}
            example={opt.example}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => navigate('/setup')}
        className="mt-8 inline-flex items-center justify-center gap-2 self-start rounded-control bg-ink px-5 py-2.5 text-sm font-semibold text-app transition-transform hover:-translate-y-0.5"
      >
        Continue
        <ArrowRight size={16} />
      </button>
    </div>
  )
}
