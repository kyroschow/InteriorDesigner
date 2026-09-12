/**
 * Units.
 *
 * Everything in the app is stored in **integer inches**. Floor plans are full of
 * thirds (a 16'8" wall) and repeated division; floats accumulate error and produce
 * the classic "wall is 0.0001in from the corner" bug. Integers in the smallest unit
 * we ever display make the geometry exact.
 *
 * Display is US customary (ft + in) by default, matching what Drafted shows:
 * "38 ft 0 in", "97 ft 10 in W x 32 ft 0 in D", "2,494 ft²". Metric display
 * (onboarding's unit choice) converts at render time — inches stay the one
 * stored unit either way.
 */
import type { UnitSystem } from '@/store/onboardingStore'

export const INCHES_PER_FOOT = 12
const M_PER_INCH = 0.0254
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

/** 240 -> "6.10 m" */
export function formatMeters(inches: number): string {
  const sign = inches < 0 ? '-' : ''
  return `${sign}${(Math.abs(inches) * M_PER_INCH).toFixed(2)} m`
}

/** Square inches -> square meters. */
export function sqInToSqM(sqIn: number): number {
  return sqIn * M_PER_INCH * M_PER_INCH
}

/** 23.4 -> "23.4 m²" */
export function formatAreaMetric(sqM: number): string {
  return `${sqM.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} m²`
}

/** A length in inches, displayed per the project's chosen unit system. */
export function formatLength(inches: number, system: UnitSystem): string {
  return system === 'metric' ? formatMeters(inches) : formatFtIn(inches)
}

/** An area in square inches, displayed per the project's chosen unit system. */
export function formatAreaBySystem(sqIn: number, system: UnitSystem): string {
  return system === 'metric' ? formatAreaMetric(sqInToSqM(sqIn)) : formatArea(sqInToSqFt(sqIn))
}

// ------------------------------------------------ API geometry (meters)

const M_PER_FT = 0.3048
const M2_PER_FT2 = M_PER_FT * M_PER_FT

/** 3.2 -> "3.20 m" or "10 ft 6 in", per the project's unit system. */
export function formatLengthM(meters: number, system: UnitSystem): string {
  return formatLength(meters / M_PER_INCH, system)
}

/** 24 -> "24.0 m²" or "258 ft²". */
export function formatAreaM2(squareMeters: number, system: UnitSystem): string {
  return system === 'metric' ? formatAreaMetric(squareMeters) : formatArea(squareMeters / M2_PER_FT2)
}

/** Numeric inputs use meters for metric and decimal feet for imperial. */
export const lengthInputUnit = (system: UnitSystem) => (system === 'metric' ? 'm' : 'ft')

export function metersToInput(meters: number, system: UnitSystem): number {
  const value = system === 'metric' ? meters : meters / M_PER_FT
  return Math.round(value * 100) / 100
}

/** Rounds to millimeters, the API's precision. */
export function inputToMeters(value: number, system: UnitSystem): number {
  const meters = system === 'metric' ? value : value * M_PER_FT
  return Math.round(meters * 1000) / 1000
}

/** 14900 -> "$149.00" */
export function formatUsd(minor: number): string {
  return (minor / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
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
