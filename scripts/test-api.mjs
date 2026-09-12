#!/usr/bin/env node
/**
 * Bundles tests/*.test.ts with the esbuild that ships with Vite (resolving the
 * `@/` alias) and runs them with node:test. No extra dependencies.
 *
 *   npm run test:api
 */
import { build } from 'esbuild'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const outdir = mkdtempSync(join(tmpdir(), 'interior-api-test-'))
const entryPoints = readdirSync(join(root, 'tests'))
  .filter((f) => f.endsWith('.test.ts'))
  .map((f) => join(root, 'tests', f))

await build({
  entryPoints,
  outdir,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  logLevel: 'warning',
  plugins: [
    {
      name: 'at-alias',
      setup(b) {
        b.onResolve({ filter: /^@\// }, (args) => b.resolve(`./${args.path.slice(2)}`, { resolveDir: join(root, 'src'), kind: args.kind }))
      },
    },
  ],
})

const files = readdirSync(outdir)
  .filter((f) => f.endsWith('.js'))
  .map((f) => join(outdir, f))
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' })
process.exit(result.status ?? 1)
