import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import clsx from 'clsx'

/** Generation issues and configuration findings share this shape. */
export interface FindingLike {
  code: string
  message?: string
  roomId?: string
  requirementId?: string
  ruleId?: string
  suggestion?: string
}

interface GenerationFindingsProps {
  findings: FindingLike[]
  roomLabel: (roomId: string) => string
  className?: string
}

type Severity = 'error' | 'warning' | 'info'
const severityOf = (code: string): Severity => (code === 'SUGGESTION' ? 'info' : code === 'NO_CATALOG_MATCH' || code === 'STALE' ? 'warning' : 'error')
const ICON = { error: AlertCircle, warning: AlertTriangle, info: Info }
const TONE = { error: 'text-red-700', warning: 'text-amber-700', info: 'text-ink-soft/60' }
const ORDER = { error: 0, warning: 1, info: 2 }

/** Rule violations, unmet requirements and suggestions, most severe first. */
export function GenerationFindings({ findings, roomLabel, className }: GenerationFindingsProps) {
  if (findings.length === 0) return null
  const sorted = [...findings].sort((a, b) => ORDER[severityOf(a.code)] - ORDER[severityOf(b.code)])
  return (
    <ul className={clsx('space-y-1.5', className)}>
      {sorted.map((f, i) => {
        const severity = severityOf(f.code)
        const Icon = ICON[severity]
        return (
          <li key={`${f.code}-${i}`} className="flex gap-2 text-xs text-ink-soft">
            <Icon size={13} className={clsx('mt-0.5 shrink-0', TONE[severity])} />
            <span className="min-w-0">
              {f.roomId && <span className="font-semibold text-ink">{roomLabel(f.roomId)}: </span>}
              {f.message ?? f.code.replace(/_/g, ' ').toLowerCase()}
              {f.ruleId && <span className="ml-1 text-[10px] text-ink-soft/50">{f.ruleId}</span>}
              {f.suggestion && <span className="block text-ink-soft/60 italic">{f.suggestion}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
