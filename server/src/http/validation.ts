import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Ajv2020 } from 'ajv/dist/2020.js'
import type { ErrorObject, ValidateFunction } from 'ajv'
import { AppError, type ErrorDetail } from './errors.ts'

const SCHEMA_KEY = 'request-bodies.schema.json'
const schemaPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../docs/design/schemas', SCHEMA_KEY)

// strictRequired is off because UpdateProjectRequest uses `anyOf: [{required: [name]}, ...]`.
export const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false })
ajv.addFormat('binary', true)
ajv.addSchema(JSON.parse(readFileSync(schemaPath, 'utf8')), SCHEMA_KEY)

const validators = new Map<string, ValidateFunction>()

export function requestValidator(definition: string): ValidateFunction {
  let validate = validators.get(definition)
  if (!validate) {
    validate = ajv.getSchema(`${SCHEMA_KEY}#/$defs/${definition}`)
    if (!validate) throw new Error(`Unknown request schema definition ${definition}`)
    validators.set(definition, validate)
  }
  return validate
}

/** `/requirements/0/roomId` -> `requirements[0].roomId` */
export function toPath(instancePath: string): string {
  return instancePath
    .split('/')
    .filter(Boolean)
    .reduce((acc, part) => (/^\d+$/.test(part) ? `${acc}[${part}]` : acc ? `${acc}.${part}` : part), '')
}

export function ajvDetails(errors: ErrorObject[] | null | undefined): ErrorDetail[] {
  return (errors ?? []).slice(0, 20).map((e) => {
    const extra = e.keyword === 'additionalProperties' ? ` (${(e.params as { additionalProperty: string }).additionalProperty})` : ''
    const missing = e.keyword === 'required' ? `.${(e.params as { missingProperty: string }).missingProperty}` : ''
    return { path: toPath(e.instancePath) + missing || '(body)', code: e.keyword.toUpperCase(), message: `${e.message ?? 'invalid'}${extra}` }
  })
}

/** Validate a request body against a `$defs` entry; failures become 422 VALIDATION_FAILED. */
export function validateBody<T>(definition: string, body: unknown): T {
  const validate = requestValidator(definition)
  if (!validate(body)) {
    throw new AppError(422, 'VALIDATION_FAILED', `Request body does not match ${definition}.`, ajvDetails(validate.errors))
  }
  return body as T
}
