export interface RulePack {
  id: string
  label: string
  description: string
}

/**
 * The interior-rule-library's 10-systems files, grouped into selectable packs
 * (the individual fengshui-01/02/06/09 files are facets of one system, not
 * separate toggles). Selection is captured but not yet applied — there's no
 * agent to evaluate rules against a layout yet, only the deterministic packer
 * in furniturePlacement.ts. Per-room files under 20-rooms aren't exposed here.
 */
export const RULE_PACKS: RulePack[] = [
  {
    id: 'feng-shui',
    label: 'Feng Shui',
    description: 'Form school, command position, five elements, remedies.',
  },
  {
    id: 'vastu',
    label: 'Vastu Shastra',
    description: 'Directional placement, room mandala, cross-system conflicts.',
  },
  {
    id: 'style-packs',
    label: 'Style Packs',
    description: 'Machine-applicable style modifiers — balance, color, materials.',
  },
]
