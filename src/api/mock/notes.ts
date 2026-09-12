/**
 * Mock room-note interpreter. Allowlisted interpretations only (object-type
 * prohibition, side clearance with explicit units, allowed color families,
 * style/material preferences); everything else is reported honestly as
 * ambiguous, unsupported or conflicting. Note text is never executed and can
 * only constrain its own room.
 */
import { typeDef, typesOverlap } from './catalog'
import type { NoteClause, NoteInterpretation, Requirement } from '@/types/interior'

export const PARSER_VERSION = 'mock-note-parser-1'

const TARGETS: Array<[RegExp, string]> = [
  [/\b(tvs?|televisions?|tv stands?|tv units?)\b/, 'storage.tv_stand'],
  [/\b(nightstands?|night stands?|bedside tables?)\b/, 'tables.nightstand'],
  [/\b(dressers?|chests? of drawers)\b/, 'storage.dresser'],
  [/\b(dining (tables?|sets?))\b/, 'tables.dining_set'],
  [/\b(sofas?|couch(es)?|loveseats?|sectionals?)\b/, 'seating.sofa'],
  [/\bbeds?\b/, 'sleep.bed'],
]

const COLOR_WORDS: Array<[RegExp, string]> = [
  [/\bwhite\b/, 'white'],
  [/\bbeige\b/, 'beige'],
  [/\bgr[ae]y\b/, 'gray'],
  [/\bblack\b/, 'black'],
  [/\b(brown|walnut)\b/, 'brown'],
  [/\b(natural|light wood|oak|pine|birch)\b/, 'natural'],
  [/\bblue\b/, 'blue'],
  [/\bgreen\b/, 'green'],
]

/** Terms compared against catalog colorFamilies/materials/styleTags/featureTags for soft ranking. */
const PREFERENCE_WORDS: Array<[RegExp, string]> = [
  ...COLOR_WORDS,
  [/\bwood(en)?\b/, 'wood'],
  [/\b(fabric|upholster(ed|y))\b/, 'upholstered'],
  [/\bleather\b/, 'leather'],
  [/\b(metal|steel)\b/, 'steel'],
  [/\bglass\b/, 'glass'],
  [/\bmodern\b/, 'modern'],
  [/\bminimal(ist)?\b/, 'minimalist'],
  [/\bscandinavian\b/, 'scandinavian'],
  [/\btraditional\b/, 'traditional'],
  [/\bcasual\b/, 'casual'],
  [/\brustic\b/, 'rustic'],
  [/\bstorage\b/, 'storage'],
]

const UNIT_TO_M: Record<string, number> = { mm: 0.001, cm: 0.01, m: 1, ft: 0.3048, in: 0.0254 }

function unitKey(unit: string): keyof typeof UNIT_TO_M {
  if (unit.startsWith('milli') || unit === 'mm') return 'mm'
  if (unit.startsWith('centi') || unit === 'cm') return 'cm'
  if (unit.startsWith('fe') || unit.startsWith('fo') || unit === 'ft' || unit === "'") return 'ft'
  if (unit.startsWith('in') || unit === '"') return 'in'
  return 'm'
}

const LENGTH = /(\d+(?:\.\d+)?)\s*(millimet(?:er|re)s?|mm|centimet(?:er|re)s?|cm|met(?:er|re)s?|m|feet|foot|ft|inch(?:es)?|in|'|")?(?=$|[^a-z])/

export function preferenceTermsIn(text: string): string[] {
  const lower = text.toLowerCase()
  return [...new Set(PREFERENCE_WORDS.filter(([re]) => re.test(lower)).map(([, term]) => term))]
}

const findTarget = (lower: string) => TARGETS.find(([re]) => re.test(lower))?.[1]
const typeLabel = (objectType: string) => typeDef(objectType)?.label.replace(/ \(any.*\)$/, '').toLowerCase() ?? objectType

type Interpreted = Omit<NoteClause, 'roomId' | 'sourceText' | 'span'>

function interpretSentence(text: string, roomId: string, requirements: Requirement[]): Interpreted {
  const lower = text.toLowerCase()
  const target = findTarget(lower)
  const colors = [...new Set(COLOR_WORDS.filter(([re]) => re.test(lower)).map(([, id]) => id))]
  const inRoom = requirements.filter((r) => r.quantity > 0 && r.roomId === roomId)

  // Clearance: "Keep at least 0.8 m clear in front of the bed."
  if (/\b(clear|clearance|space|gap|room to walk)\b/.test(lower) && (/\b(keep|leave|at least|minimum)\b/.test(lower) || LENGTH.test(lower))) {
    const side = /\b(in front of|front of|foot of)\b/.test(lower)
      ? 'front'
      : /\b(behind|back of)\b/.test(lower)
        ? 'back'
        : /\bleft\b/.test(lower)
          ? 'left'
          : /\bright\b/.test(lower)
            ? 'right'
            : undefined
    const m = lower.match(LENGTH)
    const unitIsFront = m?.[2] === 'in' && /^\s*front/.test(lower.slice((m.index ?? 0) + m[0].length))
    const base = { kind: 'minimum_clearance' as const, strength: 'hard' as const, targetObjectType: target }
    if (!target) return { ...base, status: 'ambiguous', message: 'Say which piece of furniture needs the clearance, e.g. "the bed".' }
    if (!m || !m[2] || unitIsFront) return { ...base, status: 'ambiguous', message: 'Add a unit to the distance, e.g. "0.8 m" or "30 in".' }
    if (!side) return { ...base, status: 'ambiguous', message: 'Say which side needs to stay clear: front, back, left or right.' }
    const valueM = Math.round(Number(m[1]) * UNIT_TO_M[unitKey(m[2])] * 1000) / 1000
    return { ...base, side, valueM, status: 'supported', message: `Keeps ${valueM} m clear on the ${side} of the ${typeLabel(target)}.` }
  }

  if (/\b(more|fewer|less) than\b/.test(lower) || /\b(\d+|two|three|four|five|six|another|extra|add|remove)\b[^.]*\b(beds?|sofas?|couch(es)?|nightstands?|dressers?|tvs?|tv stands?|chairs?)\b/.test(lower)) {
    return {
      kind: 'unrecognized',
      targetObjectType: target,
      strength: 'hard',
      status: 'conflict',
      message: 'Quantities come from the furniture settings, not notes. Change the quantity there and remove this from the note.',
    }
  }

  // Prohibition: "No TV in this bedroom." / "Do not place a TV in this room."
  const hardNo = /^\s*(no|never)\b|\b(don't|do not|never|without|not allowed)\b/.test(lower)
  const softNo = /\bavoid\b/.test(lower)
  if (hardNo || softNo) {
    if (!target) {
      return { kind: 'object_type_prohibition', strength: 'hard', status: 'ambiguous', message: "Couldn't tell which furniture type this rules out." }
    }
    const conflicting = inRoom.find((r) => typesOverlap(r.objectType, target))
    const strength = hardNo ? 'hard' : 'soft'
    if (conflicting) {
      return {
        kind: 'object_type_prohibition',
        targetObjectType: target,
        strength,
        status: 'conflict',
        message: `Conflicts with the request for ${conflicting.quantity} × ${typeLabel(conflicting.objectType)} in this room. Change one of them.`,
      }
    }
    return {
      kind: 'object_type_prohibition',
      targetObjectType: target,
      strength,
      status: 'supported',
      message: hardNo ? `No ${typeLabel(target)} will be placed in this room.` : `Will avoid a ${typeLabel(target)} here where possible.`,
    }
  }

  if (/(\$\s?\d|\bbudget\b|\b\d+\s*(dollars|usd)\b|\bspend\b)/.test(lower)) {
    return { kind: 'unrecognized', strength: 'hard', status: 'conflict', message: 'The budget is set once for the whole project. Change it in the design settings.' }
  }

  // Color constraint: "Only white furniture." / "The dresser must be black."
  if (colors.length > 0 && /\b(only|must be|has to be|needs to be|all)\b/.test(lower)) {
    const scoped = inRoom.filter((r) => !target || typesOverlap(r.objectType, target))
    const clash = scoped.find((r) => r.allowedColors.length > 0 && !r.allowedColors.some((c) => colors.includes(c)))
    const base = { kind: 'allowed_color_families' as const, targetObjectType: target, colorFamilies: colors, strength: 'hard' as const }
    if (clash) {
      return { ...base, status: 'conflict', message: `The ${typeLabel(clash.objectType)} request only allows ${clash.allowedColors.join(', ')}. Change one of them.` }
    }
    return { ...base, status: 'supported', message: `Only ${colors.join(' or ')} ${target ? typeLabel(target) : 'furniture'} in this room.` }
  }

  const terms = preferenceTermsIn(lower)
  if (terms.length > 0 && !/\b(must|required|always|has to|have to|need to)\b/.test(lower)) {
    return { kind: 'style_preference', targetObjectType: target, preferenceTerms: terms, strength: 'soft', status: 'supported', message: `Prefers ${terms.join(', ')} when ranking products.` }
  }

  if (/\b(must|required|always|has to|have to|need to|never)\b/.test(lower)) {
    return {
      kind: 'unrecognized',
      strength: 'hard',
      status: 'ambiguous',
      message: 'Reads as a requirement, but it isn\'t one the generator can check. Try "No TV" or "Keep 0.8 m clear in front of the bed".',
    }
  }
  return { kind: 'unrecognized', strength: 'soft', status: 'unsupported', message: "Saved as a preference, but the generator can't act on it yet." }
}

export function interpretNote(roomId: string, note: string, requirements: Requirement[]): NoteInterpretation {
  const clauses: NoteClause[] = []
  // Sentence boundaries, except a period inside a decimal like "0.8 m".
  for (const match of note.matchAll(/(?:[^.!?;\n]|\.(?=\d))+[.!?]?/g)) {
    const raw = match[0]
    const text = raw.trim()
    if (!text || !/[a-z0-9]/i.test(text)) continue
    const start = (match.index ?? 0) + raw.indexOf(text)
    clauses.push({ roomId, sourceText: text, span: { start, end: start + text.length }, ...interpretSentence(text, roomId, requirements) })
  }
  return { roomId, parserVersion: PARSER_VERSION, clauses }
}

/** Hard clauses that are not "supported" block Apply; unsupported soft ones proceed as visible findings. */
export const isUnresolved = (c: NoteClause) => c.strength === 'hard' && (c.status === 'ambiguous' || c.status === 'unsupported')
