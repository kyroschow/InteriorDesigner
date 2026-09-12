/**
 * Units.
 *
 * Everything in the app is stored in **integer inches**. Floor plans are full of
 * thirds (a 16'8" wall) and repeated division; floats accumulate error and produce
 * the classic "wall is 0.0001in from the corner" bug. Integers in the smallest unit
 * we ever display make the geometry exact.
 *
 * Display is US customary (ft + in) because that is what Drafted shows:
 * "38 ft 0 in", "97 ft 10 in W x 32 ft 0 in D", "2,494 ft²".
 */

export const INCHES_PER_FOOT = 12
/** Editor grid: one grid square = 1 ft. Snap resolution is finer — see SNAP_IN. */
export const GRID_IN = 12
/** Snapping quantum, 1 inch. Drafted's dimension labels resolve to whole inches. */
export const SNAP_IN = 1

/** 240 -> "20 ft 0 in" */
export function formatFtIn(inches: number): string {
  const sign = inches < 0 ? '-' : ''
  const a = Math.abs(Math.round(inches))
  const ft = Math.floor(a / INCHES_PER_FOOT)
  const inch = a % INCHES_PER_FOOT
  return `${sign}${ft} ft ${inch} in`
}

/** 240 -> `20'0"` — the compact form used inside floor-plan room labels. */
export function formatFtInTick(inches: number): string {
  const sign = inches < 0 ? '-' : ''
  const a = Math.abs(Math.round(inches))
  const ft = Math.floor(a / INCHES_PER_FOOT)
  const inch = a % INCHES_PER_FOOT
  return `${sign}${ft}'${inch}"`
}

/** Square inches -> whole square feet. */
export function sqInToSqFt(sqIn: number): number {
  return Math.round(sqIn / (INCHES_PER_FOOT * INCHES_PER_FOOT))
}

export function sqFtToSqIn(sqFt: number): number {
  return Math.round(sqFt * INCHES_PER_FOOT * INCHES_PER_FOOT)
}

/** 2494 -> "2,494 ft²" */
export function formatArea(sqFt: number): string {
  return `${Math.round(sqFt).toLocaleString('en-US')} ft²`
}

/** 2494 -> "2,494" */
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

/** Width x Depth as Drafted prints it: "97 ft 10 in W x 32 ft 0 in D" */
export function formatWD(widthIn: number, depthIn: number): string {
  return `${formatFtIn(widthIn)} W x ${formatFtIn(depthIn)} D`
}

export function snap(value: number, quantum = SNAP_IN): number {
  return Math.round(value / quantum) * quantum
}

/** Clamp helper used all over the editor. */
export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}
