/**
 * Copied from src/lib/rng.ts (frontend) so the server build does not depend on
 * the frontend's tsconfig/alias setup.
 */

/** FNV-1a 32-bit string hash. */
export function hashString(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
