/**
 * Validates request bodies against docs/design/schemas/request-bodies.schema.json
 * itself, so the design schema stays the single source of truth. Implements
 * only the JSON Schema 2020-12 keywords that file uses.
 */
import schemaDocument from '../../../docs/design/schemas/request-bodies.schema.json'
import type { ApiErrorDetail } from '@/types/interior'

type SchemaNode = Record<string, unknown>

const defs = (schemaDocument as { $defs: Record<string, SchemaNode> }).$defs

export type RequestDefinition =
  | 'CreateProjectRequest'
  | 'UpdateProjectRequest'
  | 'UploadFloorPlanRequest'
  | 'ReplaceRoomsRequest'
  | 'ReplaceConfigurationRequest'
  | 'UpdateRoomNoteRequest'
  | 'CreateGenerationRequest'

const join = (path: string, key: string | number) =>
  typeof key === 'number' ? `${path}[${key}]` : path ? `${path}.${key}` : key

function typeMatches(type: string, value: unknown): boolean {
  switch (type) {
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value)
    case 'array':
      return Array.isArray(value)
    case 'string':
      return typeof value === 'string'
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value)
    case 'number':
      return typeof value === 'number' && Number.isFinite(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'null':
      return value === null
    default:
      return false
  }
}

function validateNode(node: SchemaNode, value: unknown, path: string, out: ApiErrorDetail[]): void {
  const fail = (code: string, message: string) => out.push({ path: path || '(body)', code, message })

  if (typeof node.$ref === 'string') {
    const name = node.$ref.replace('#/$defs/', '')
    validateNode(defs[name], value, path, out)
    return
  }
  if ('not' in node) {
    const inner: ApiErrorDetail[] = []
    validateNode(node.not as SchemaNode, value, path, inner)
    if (inner.length === 0) fail('NOT', 'Value matches a forbidden schema.')
  }
  if (node.type !== undefined) {
    const types = Array.isArray(node.type) ? (node.type as string[]) : [node.type as string]
    if (!types.some((t) => typeMatches(t, value))) {
      fail('TYPE', `Expected ${types.join(' or ')}.`)
      return
    }
  }
  if ('const' in node && value !== node.const) fail('CONST', `Must be ${JSON.stringify(node.const)}.`)
  if (Array.isArray(node.enum) && !node.enum.includes(value)) {
    fail('ENUM', `Must be one of ${node.enum.map((v) => JSON.stringify(v)).join(', ')}.`)
  }

  if (typeof value === 'string') {
    const length = [...value].length
    if (typeof node.minLength === 'number' && length < node.minLength) fail('MIN_LENGTH', `Must be at least ${node.minLength} characters.`)
    if (typeof node.maxLength === 'number' && length > node.maxLength) fail('MAX_LENGTH', `Must be at most ${node.maxLength} characters.`)
    if (typeof node.pattern === 'string' && !new RegExp(node.pattern, 'u').test(value)) fail('PATTERN', `Must match ${node.pattern}.`)
  }

  if (typeof value === 'number') {
    if (typeof node.minimum === 'number' && value < node.minimum) fail('MINIMUM', `Must be ≥ ${node.minimum}.`)
    if (typeof node.maximum === 'number' && value > node.maximum) fail('MAXIMUM', `Must be ≤ ${node.maximum}.`)
    if (typeof node.exclusiveMinimum === 'number' && value <= node.exclusiveMinimum) fail('EXCLUSIVE_MINIMUM', `Must be > ${node.exclusiveMinimum}.`)
  }

  if (Array.isArray(value)) {
    if (typeof node.minItems === 'number' && value.length < node.minItems) fail('MIN_ITEMS', `Must have at least ${node.minItems} items.`)
    if (typeof node.maxItems === 'number' && value.length > node.maxItems) fail('MAX_ITEMS', `Must have at most ${node.maxItems} items.`)
    if (node.uniqueItems === true) {
      const seen = new Set(value.map((v) => JSON.stringify(v)))
      if (seen.size !== value.length) fail('UNIQUE_ITEMS', 'Items must be unique.')
    }
    if (node.items) value.forEach((item, i) => validateNode(node.items as SchemaNode, item, join(path, i), out))
  }

  if (typeMatches('object', value)) {
    const obj = value as Record<string, unknown>
    const properties = (node.properties ?? {}) as Record<string, SchemaNode>
    for (const key of (node.required ?? []) as string[]) {
      if (!(key in obj)) out.push({ path: join(path, key), code: 'REQUIRED', message: 'Required.' })
    }
    for (const [key, child] of Object.entries(obj)) {
      if (properties[key]) validateNode(properties[key], child, join(path, key), out)
      else if (node.additionalProperties === false) out.push({ path: join(path, key), code: 'UNKNOWN_PROPERTY', message: 'Unknown property.' })
    }
  }

  if (Array.isArray(node.anyOf)) {
    const passes = (node.anyOf as SchemaNode[]).some((branch) => {
      const inner: ApiErrorDetail[] = []
      validateNode(branch, value, path, inner)
      return inner.length === 0
    })
    if (!passes) fail('ANY_OF', 'Does not match any allowed shape.')
  }
  if (Array.isArray(node.oneOf)) {
    const branches = (node.oneOf as SchemaNode[]).map((branch) => {
      const inner: ApiErrorDetail[] = []
      validateNode(branch, value, path, inner)
      return inner
    })
    const passing = branches.filter((b) => b.length === 0).length
    if (passing !== 1) {
      // Surface the closest branch's errors — more useful than "matches 0 of 2".
      const closest = branches.reduce((best, b) => (b.length < best.length ? b : best), branches[0])
      if (passing === 0 && closest.length > 0) out.push(...closest)
      else fail('ONE_OF', 'Must match exactly one allowed shape.')
    }
  }
}

/** Errors for `body` against `#/$defs/<definition>`; empty when valid. */
export function validateRequest(definition: RequestDefinition, body: unknown): ApiErrorDetail[] {
  const out: ApiErrorDetail[] = []
  validateNode(defs[definition], body, '', out)
  return out
}
