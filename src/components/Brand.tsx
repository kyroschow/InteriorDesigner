import { Compass } from 'lucide-react'
import clsx from 'clsx'

interface BrandProps {
  size?: 'sm' | 'lg' | 'xl'
}

const MARK_SIZE = { sm: 'h-8 w-8', lg: 'h-10 w-10', xl: 'h-20 w-20' }
const ICON_SIZE = { sm: 16, lg: 20, xl: 40 }
const WORDMARK_SIZE = { sm: 'text-lg', lg: 'text-2xl', xl: 'text-6xl' }
const GAP_SIZE = { sm: 'gap-2', lg: 'gap-3', xl: 'gap-4' }

/** Product wordmark — a compass, because that's what a plan gets drawn with. */
export function Brand({ size = 'sm' }: BrandProps) {
  return (
    <div className={clsx('flex items-center', GAP_SIZE[size])}>
      <div
        className={clsx(
          'flex shrink-0 items-center justify-center rounded-control bg-accent text-app',
          MARK_SIZE[size],
        )}
      >
        <Compass size={ICON_SIZE[size]} />
      </div>
      <span className={clsx('serif font-semibold text-ink', WORDMARK_SIZE[size])}>Plotter</span>
    </div>
  )
}
