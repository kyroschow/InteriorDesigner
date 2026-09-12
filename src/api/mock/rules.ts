/**
 * Rule registry for `GET /rules`, built from the real library index
 * (scripts/build-rule-index.mjs). A rule is selectable only when the mock has
 * an evaluator for it and every `requires_rules` dependency is also available.
 */
import index from './data/ruleIndex.json'
import type { ApiErrorDetail, Finding, Rule, RulesResponse } from '@/types/interior'

type IndexedRule = Omit<Rule, 'availability' | 'reason' | 'requiredInputs' | 'beliefSystem' | 'severity'> & { severity: string }

const RAW = (index as { version: string; items: IndexedRule[] }).items
export const RULE_VERSION = (index as { version: string }).version

/** What the mock actually checks. Anything not listed is shown but not selectable. */
export const RULE_EVALUATORS: Record<string, string> = {
  'FS-CMD-026': 'Mock evaluator checks that furniture stays out of door swing and doorway clearance zones. Traffic routes are not evaluated.',
}

/** Rules that need inputs the app doesn't collect yet. */
const MISSING_INPUTS: Record<string, string[]> = {
  'RM-BEDP-001': ['room.assigned_occupants', 'room.light_control_capability'],
}

const BELIEF_LABELS: Record<string, string> = { feng_shui: 'Feng shui', vastu: 'Vastu' }
/** Some gated rules are filed under non-tradition systems (e.g. FS-CURE-005 is `product.ux`); their id prefix names the tradition. */
const BELIEF_BY_ID_PREFIX: Record<string, string> = { FS: 'feng_shui', VS: 'vastu' }

const byId = new Map(RAW.map((r) => [r.id, r]))

function beliefSystemOf(rule: IndexedRule): string | null {
  if (!rule.beliefGated) return null
  const root = rule.system.split('.')[0]
  return BELIEF_LABELS[root] ? root : (BELIEF_BY_ID_PREFIX[rule.id.split('-')[0]] ?? root)
}

const availabilityCache = new Map<string, Pick<Rule, 'availability' | 'reason' | 'requiredInputs'>>()

function availabilityOf(id: string, trail: string[] = []): Pick<Rule, 'availability' | 'reason' | 'requiredInputs'> {
  const cached = availabilityCache.get(id)
  if (cached) return cached
  const rule = byId.get(id)
  let result: Pick<Rule, 'availability' | 'reason' | 'requiredInputs'>
  if (!rule) {
    result = { availability: 'unsupported', reason: `${id} is not in the library snapshot.`, requiredInputs: [] }
  } else if (rule.status === 'deprecated') {
    result = { availability: 'unsupported', reason: 'Deprecated in the library.', requiredInputs: [] }
  } else if (MISSING_INPUTS[id]) {
    result = { availability: 'missing_inputs', reason: `Needs information the app doesn't collect yet: ${MISSING_INPUTS[id].join(', ')}.`, requiredInputs: MISSING_INPUTS[id] }
  } else if (!RULE_EVALUATORS[id]) {
    result = { availability: 'unsupported', reason: 'No evaluator is implemented for this rule yet.', requiredInputs: [] }
  } else {
    result = { availability: 'supported', reason: RULE_EVALUATORS[id], requiredInputs: [] }
    for (const dep of rule.requiresRules) {
      if (trail.includes(dep)) continue
      const depAvailability = availabilityOf(dep, [...trail, id])
      if (depAvailability.availability !== 'supported') {
        result = {
          availability: depAvailability.availability,
          reason: `Depends on ${dep}: ${depAvailability.reason}`,
          requiredInputs: depAvailability.requiredInputs,
        }
        break
      }
    }
  }
  availabilityCache.set(id, result)
  return result
}

export const RULES: Rule[] = RAW.map((rule) => ({
  ...rule,
  severity: rule.severity as Rule['severity'],
  beliefSystem: beliefSystemOf(rule),
  ...availabilityOf(rule.id),
}))

export const BELIEF_SYSTEMS: RulesResponse['beliefSystems'] = [...new Set(RULES.map((r) => r.beliefSystem).filter((s): s is string => s !== null))]
  .sort()
  .map((id) => ({ id, label: BELIEF_LABELS[id] ?? id.replace(/_/g, ' ') }))

export function listRules(roomType: string | null): Rule[] {
  if (!roomType) return RULES
  return RULES.filter((r) => r.appliesTo.rooms.length === 0 || r.appliesTo.rooms.includes(roomType))
}

/**
 * Validates a rule selection and resolves dependencies. Returns the ids that
 * generation will actually apply (selection plus auto-included dependencies).
 */
export function resolveRuleSelection(
  selected: string[],
  enabledBeliefSystems: string[],
): { errors: ApiErrorDetail[]; findings: Finding[]; resolved: string[] } {
  const errors: ApiErrorDetail[] = []
  const findings: Finding[] = []
  enabledBeliefSystems.forEach((id, i) => {
    if (!BELIEF_SYSTEMS.some((b) => b.id === id)) {
      errors.push({ path: `configuration.enabledBeliefSystems[${i}]`, code: 'UNKNOWN_BELIEF_SYSTEM', message: `Unknown belief system ${id}.` })
    }
  })
  const resolved = new Set<string>()
  selected.forEach((id, i) => {
    const path = `configuration.selectedRuleIds[${i}]`
    const rule = RULES.find((r) => r.id === id)
    if (!rule) {
      errors.push({ path, code: 'UNKNOWN_RULE', ruleId: id, message: `Unknown rule ${id}.` })
      return
    }
    if (rule.availability !== 'supported') {
      errors.push({ path, code: 'RULE_UNAVAILABLE', ruleId: id, message: `${rule.title}: ${rule.reason}` })
      return
    }
    if (rule.beliefSystem && !enabledBeliefSystems.includes(rule.beliefSystem)) {
      errors.push({ path, code: 'BELIEF_SYSTEM_NOT_ENABLED', ruleId: id, message: `Enable ${rule.beliefSystem} to apply ${rule.title}.` })
      return
    }
    const visit = (ruleId: string) => {
      if (resolved.has(ruleId)) return
      resolved.add(ruleId)
      RULES.find((r) => r.id === ruleId)?.requiresRules.forEach(visit)
    }
    visit(id)
  })
  for (const id of resolved) {
    if (!selected.includes(id)) {
      findings.push({ code: 'RULE_AUTO_INCLUDED', severity: 'info', ruleId: id, message: `${id} is also applied because a selected rule depends on it.` })
    }
    for (const other of RULES.find((r) => r.id === id)?.conflictsWith ?? []) {
      if (resolved.has(other) && id < other) {
        findings.push({
          code: 'RULE_CONFLICT',
          severity: 'warning',
          ruleId: id,
          message: `${id} conflicts with ${other}; the higher tier of the precedence ladder wins and the result explains which.`,
        })
      }
    }
  }
  return { errors, findings, resolved: [...resolved] }
}
