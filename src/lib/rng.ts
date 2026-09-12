/**
 * Deterministic seeded RNG.
 *
 * Every generated design must be reproducible: variant "C" of a given room list +
 * footprint must always come out identical. `Math.random()` is banned in generation
 * code — thread a Rng through instead.
 */

export interface Rng {
  /** [0, 1) */
  next(): number
  /** integer in [lo, hi] inclusive */
  int(lo: number, hi: number): number
  /** float in [lo, hi) */
  range(lo: number, hi: number): number
  pick<T>(items: readonly T[]): T
  /** Fisher-Yates, returns a new array */
  shuffle<T>(items: readonly T[]): T[]
  bool(pTrue?: number): boolean
}

/** mulberry32 — small, fast, good enough distribution for layout sampling. */
export function makeRng(seed: number): Rng {
  let s = seed >>> 0
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const rng: Rng = {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    range: (lo, hi) => lo + next() * (hi - lo),
    pick: (items) => items[Math.floor(next() * items.length)],
    shuffle: (items) => {
      const a = items.slice()
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    },
    bool: (p = 0.5) => next() < p,
  }
  return rng
}

/** Stable 32-bit hash of a string — turns a project id + variant letter into a seed. */
export function hashString(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** The seed for variant `slot` ("A".."E") of a given design run. */
export function variantSeed(designId: string, slot: string): number {
  return hashString(`${designId}::${slot}`)
}
