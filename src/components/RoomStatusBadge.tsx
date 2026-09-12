import clsx from 'clsx'
import type { RoomStatus } from '@/types/interior'

const STATUS: Record<RoomStatus, { label: string; className: string; title: string }> = {
  unconfigured: { label: 'Not set up', className: 'bg-canvas text-ink-soft/60', title: 'No furniture or notes yet.' },
  configured: { label: 'Awaiting generation', className: 'bg-amber-50 text-amber-800', title: 'Configured — awaiting generation.' },
  generating: { label: 'Generating', className: 'bg-accent-pale text-accent-deep', title: 'A layout is being generated.' },
  furnished: { label: 'Furnished', className: 'bg-emerald-50 text-emerald-800', title: 'The active layout matches the current settings.' },
  stale: { label: 'Stale', className: 'bg-orange-50 text-orange-800', title: "Settings changed since the layout was generated; it may not meet the latest requirements." },
  error: { label: 'Failed', className: 'bg-red-50 text-red-800', title: 'The last generation for these settings failed.' },
}

export function RoomStatusBadge({ status }: { status: RoomStatus | undefined }) {
  if (!status) return null
  const s = STATUS[status]
  return (
    <span title={s.title} className={clsx('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap', s.className)}>
      {s.label}
    </span>
  )
}
