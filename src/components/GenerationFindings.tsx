import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import clsx from 'clsx'
import type { Finding } from '@/types/interior'

interface GenerationFindingsProps {
  findings: Finding[]
  roomLabel: (roomId: string) => string
  className?: string
}

const ICON = { error: AlertCircle, warning: AlertTriangle, info: Info }
const TONE = { error: 'text-red-700', warning: 'text-amber-700', info: 'text-ink-soft/60' }
const ORDER = { error: 0, warning: 1, info: 2 }

/** Validator findings, unmet requirements and suggestions, most severe first. */
export function GenerationFindings({ findings, roomLabel, className }: GenerationFindingsProps) {
  if (findings.length === 0) return null
  const sorted = [...findings].sort((a, b) => ORDER[a.severity] - ORDER[b.severity])
  return (
    <ul className={clsx('space-y-1.5', className)}>
      {sorted.map((f, i) => {
        const Icon = ICON[f.severity]
        return (
          <li key={`${f.code}-${i}`} className="flex gap-2 text-xs text-ink-soft">
            <Icon size={13} className={clsx('mt-0.5 shrink-0', TONE[f.severity])} />
            <span className="min-w-0">
              {f.roomId && <span className="font-semibold text-ink">{roomLabel(f.roomId)}: </span>}
              {f.message}
              {f.ruleId && <span className="ml-1 text-[10px] text-ink-soft/50">{f.ruleId}</span>}
              {f.suggestion && <span className="block text-ink-soft/60 italic">{f.suggestion}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
