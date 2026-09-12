export interface RulePack {
  id: string
  label: string
  description: string
}

/**
 * Selectable design-rule packs offered at generation time. Selection is
 * captured but not yet applied — there's no agent to evaluate rules against
 * a layout yet, only the deterministic packer in furniturePlacement.ts.
 */
export const RULE_PACKS: RulePack[] = [
  {
    id: 'safety',
    label: 'Safety',
    description: 'Clearances, walkways, and fire egress kept clear.',
  },
  {
    id: 'feng-shui',
    label: 'Feng Shui',
    description: 'Form school, command position, five elements, remedies.',
  },
]
