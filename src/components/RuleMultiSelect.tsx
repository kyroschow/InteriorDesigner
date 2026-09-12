import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import clsx from 'clsx'
import type { Finding, Rule, RoomType, RulesResponse } from '@/types/interior'

interface RuleMultiSelectProps {
  rules: Rule[]
  beliefSystems: RulesResponse['beliefSystems']
  roomTypes: RoomType[]
  selected: string[]
  enabledBeliefSystems: string[]
  notices: Finding[]
  onToggleRule: (ruleId: string) => void
  onToggleBelief: (systemId: string) => void
}

/** Library rules grouped by system. Only supported rules can be checked; the rest explain why not. */
export function RuleMultiSelect({ rules, beliefSystems, roomTypes, selected, enabledBeliefSystems, notices, onToggleRule, onToggleBelief }: RuleMultiSelectProps) {
  const [query, setQuery] = useState('')
  const [selectableOnly, setSelectableOnly] = useState(false)

  const blockedReason = (rule: Rule) => {
    if (rule.availability !== 'supported') return rule.reason ?? 'Not available.'
    if (rule.beliefSystem && !enabledBeliefSystems.includes(rule.beliefSystem)) {
      return `Enable ${beliefSystems.find((b) => b.id === rule.beliefSystem)?.label ?? rule.beliefSystem} above to select this rule.`
    }
    return null
  }

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const applicable = rules.filter((r) => r.appliesTo.rooms.length === 0 || r.appliesTo.rooms.some((rt) => roomTypes.includes(rt as RoomType)))
    const visible = applicable.filter(
      (r) => (!q || `${r.id} ${r.title} ${r.system}`.toLowerCase().includes(q)) && (!selectableOnly || r.availability === 'supported' || selected.includes(r.id)),
    )
    const bySystem = new Map<string, Rule[]>()
    for (const rule of visible) bySystem.set(rule.system, [...(bySystem.get(rule.system) ?? []), rule])
    return [...bySystem.entries()]
      .map(([system, items]) => ({ system, items, selectable: items.filter((r) => r.availability === 'supported').length }))
      .sort((a, b) => b.selectable - a.selectable || a.system.localeCompare(b.system))
  }, [rules, roomTypes, query, selectableOnly, selected])

  const total = groups.reduce((n, g) => n + g.items.length, 0)

  return (
    <div className="space-y-3">
      {beliefSystems.length > 0 && (
        <fieldset>
          <legend className="mb-1 text-xs font-medium text-ink-soft">Traditions</legend>
          <p className="mb-1.5 text-[11px] text-ink-soft/60">Belief-based rules only apply when you opt into their tradition. They never override safety rules.</p>
          <div className="flex flex-wrap gap-1.5">
            {beliefSystems.map((system) => {
              const on = enabledBeliefSystems.includes(system.id)
              return (
                <button
                  key={system.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => onToggleBelief(system.id)}
                  className={clsx('rounded-full border px-2.5 py-1 text-xs', on ? 'border-accent bg-accent-pale text-accent-deep' : 'border-canvas-line text-ink-soft')}
                >
                  {system.label}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      <div className="flex items-center gap-2">
        <label className="flex flex-1 items-center gap-1.5 rounded-control border border-canvas-line bg-app px-2 py-1.5 focus-within:border-accent">
          <Search size={13} className="text-ink-soft/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rules"
            aria-label="Search rules"
            className="w-full bg-transparent text-xs text-ink placeholder:text-ink-soft/40 focus:outline-none"
          />
        </label>
        <label className="flex shrink-0 items-center gap-1 text-[11px] text-ink-soft">
          <input type="checkbox" checked={selectableOnly} onChange={(e) => setSelectableOnly(e.target.checked)} />
          Selectable only
        </label>
      </div>
      <p className="tnum text-[11px] text-ink-soft/60">
        {selected.length} selected · {total} rules apply to these room types
      </p>

      {notices.map((n, i) => (
        <p key={i} className={clsx('rounded-control px-2 py-1 text-[11px]', n.severity === 'warning' ? 'bg-amber-50 text-amber-800' : 'bg-canvas text-ink-soft')}>
          {n.message}
        </p>
      ))}

      <div className="space-y-1.5">
        {groups.map((group) => (
          <details key={group.system} open={group.selectable > 0 || query.trim() !== ''} className="rounded-control border border-canvas-line">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-2.5 py-1.5 text-xs font-medium text-ink">
              <span className="truncate">{group.system}</span>
              <span className="tnum shrink-0 text-[10px] text-ink-soft/50">
                {group.selectable}/{group.items.length} selectable
              </span>
            </summary>
            <ul className="divide-y divide-canvas-line border-t border-canvas-line">
              {group.items.map((rule) => {
                const reason = blockedReason(rule)
                const checked = selected.includes(rule.id)
                const disabled = reason !== null && !checked
                return (
                  <li key={rule.id} className="px-2.5 py-2">
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        aria-label={rule.title}
                        disabled={disabled}
                        onClick={() => onToggleRule(rule.id)}
                        className={clsx(
                          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2',
                          checked ? 'border-accent bg-accent' : 'border-canvas-line',
                          disabled && 'cursor-not-allowed opacity-40',
                        )}
                      >
                        {checked && <Check size={10} className="text-app" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className={clsx('text-xs font-medium', disabled ? 'text-ink-soft/60' : 'text-ink')}>{rule.title}</div>
                        <div className="text-[10px] text-ink-soft/50">
                          {rule.id} · {rule.severity}
                          {rule.confidence ? ` · ${rule.confidence.replace(/_/g, ' ')}` : ''}
                          {rule.beliefGated ? ' · belief-gated' : ''}
                        </div>
                        {reason && <p className="mt-0.5 text-[11px] text-ink-soft/70">{reason}</p>}
                        <details className="mt-1 text-[10px] text-ink-soft/60">
                          <summary className="cursor-pointer">Details</summary>
                          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                            <dt>Source</dt>
                            <dd className="break-all">{rule.source.path}</dd>
                            <dt>Rooms</dt>
                            <dd>{rule.appliesTo.rooms.join(', ') || 'any'}</dd>
                            {rule.requiresRules.length > 0 && (
                              <>
                                <dt>Requires</dt>
                                <dd>{rule.requiresRules.join(', ')}</dd>
                              </>
                            )}
                            {rule.conflictsWith.length > 0 && (
                              <>
                                <dt>Conflicts</dt>
                                <dd>{rule.conflictsWith.join(', ')}</dd>
                              </>
                            )}
                            {rule.params.length > 0 && (
                              <>
                                <dt>Defaults</dt>
                                <dd>{rule.params.map((p) => `${p.key}=${p.default}${p.unit && p.unit !== 'bool' ? ` ${p.unit}` : ''}`).join(', ')}</dd>
                              </>
                            )}
                          </dl>
                        </details>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </details>
        ))}
      </div>
    </div>
  )
}
