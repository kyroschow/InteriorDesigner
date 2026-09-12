#!/usr/bin/env node
/**
 * Indexes interior-rule-library/**.md into a compact JSON registry for the mock
 * `GET /rules` endpoint. Only the metadata the UI and mock validator need is
 * kept (ids, applicability, severity, dependencies, default params); predicates
 * and prose stay in the Markdown. Re-run after editing the library:
 *
 *   npm run rules:index
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const libraryDir = join(root, 'interior-rule-library')
const outFile = join(root, 'src/api/mock/data/ruleIndex.json')

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : name.endsWith('.md') ? [path] : []
  })
}

const unquote = (s) => s.trim().replace(/^["']|["']$/g, '')

/** `[a, b]` -> ['a', 'b'];  anything else -> null (caller decides). */
function inlineList(value) {
  const m = value.trim().match(/^\[(.*)\]$/)
  if (!m) return null
  return m[1]
    .split(',')
    .map(unquote)
    .filter(Boolean)
}

/**
 * Tiny line-based reader for the SPEC-CONTRACT rule shape: top-level scalars,
 * inline or block lists, and the `applies_to` / `params` sub-blocks. Not a YAML
 * parser — records that don't fit are reported and skipped.
 */
function parseRecord(yaml) {
  const lines = yaml.split('\n')
  const rec = { appliesTo: { rooms: [], objects: [] }, params: [] }
  let i = 0
  const readBlockList = (start) => {
    const items = []
    let j = start
    while (j < lines.length && /^\s+-\s/.test(lines[j])) {
      items.push(unquote(lines[j].replace(/^\s+-\s/, '')))
      j++
    }
    return { items, next: j }
  }
  while (i < lines.length) {
    const line = lines[i]
    const top = line.match(/^([a-z_]+):\s*(.*)$/)
    if (!top) {
      i++
      continue
    }
    const [, key, rawValue] = top
    const value = rawValue.replace(/\s+#.*$/, '')
    if (key === 'applies_to') {
      i++
      while (i < lines.length && /^\s+/.test(lines[i])) {
        const sub = lines[i].match(/^\s+(rooms|objects):\s*(.*)$/)
        if (sub) {
          const list = inlineList(sub[2].replace(/\s+#.*$/, ''))
          if (list) {
            rec.appliesTo[sub[1]] = list
            i++
          } else {
            const block = readBlockList(i + 1)
            rec.appliesTo[sub[1]] = block.items
            i = block.next
          }
        } else i++
      }
      continue
    }
    if (key === 'params') {
      i++
      let current = null
      while (i < lines.length && (/^\s+/.test(lines[i]) || lines[i].trim() === '')) {
        const k = lines[i].match(/^\s+-\s+key:\s*(.+)$/)
        const d = lines[i].match(/^\s+default:\s*(.+)$/)
        const u = lines[i].match(/^\s+unit:\s*(.+)$/)
        if (k) {
          current = { key: unquote(k[1]), default: null, unit: null }
          rec.params.push(current)
        } else if (current && d) {
          const raw = unquote(d[1].replace(/\s+#.*$/, ''))
          current.default = raw !== '' && !Number.isNaN(Number(raw)) ? Number(raw) : raw
        } else if (current && u) current.unit = unquote(u[1])
        i++
      }
      continue
    }
    if (key === 'requires_rules' || key === 'conflicts_with') {
      const list = inlineList(value)
      if (list) {
        rec[key] = list
        i++
      } else {
        const block = readBlockList(i + 1)
        rec[key] = block.items
        i = block.next
      }
      continue
    }
    if (['id', 'title', 'system', 'group', 'version', 'status', 'scope', 'severity', 'confidence', 'belief_gated'].includes(key)) {
      rec[key] = unquote(value)
    }
    i++
  }
  return rec
}

const files = walk(libraryDir).sort()
const hash = createHash('sha256')
const items = []
const skipped = []
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  hash.update(text)
  const path = relative(root, file)
  const re = /^###\s+(.+)\n+```yaml\n([\s\S]*?)\n```/gm
  let m
  while ((m = re.exec(text))) {
    const rec = parseRecord(m[2])
    if (!rec.id || !rec.title || !rec.system || !rec.severity) {
      skipped.push(`${path}: ${m[1].trim()}`)
      continue
    }
    items.push({
      id: rec.id,
      title: rec.title,
      system: rec.system,
      group: rec.group ?? null,
      version: Number(rec.version) || 1,
      status: rec.status ?? 'active',
      scope: rec.scope ?? null,
      severity: rec.severity,
      confidence: rec.confidence ?? null,
      beliefGated: rec.belief_gated === 'true',
      appliesTo: rec.appliesTo,
      requiresRules: rec.requires_rules ?? [],
      conflictsWith: rec.conflicts_with ?? [],
      params: rec.params,
      source: { path, heading: m[1].trim() },
    })
  }
}

const seen = new Set()
const duplicates = items.filter((r) => (seen.has(r.id) ? true : (seen.add(r.id), false))).map((r) => r.id)
const unique = items.filter((r, idx) => items.findIndex((o) => o.id === r.id) === idx)

const version = `rules-${hash.digest('hex').slice(0, 12)}`
writeFileSync(outFile, JSON.stringify({ version, items: unique }) + '\n')
console.log(`Indexed ${unique.length} rules from ${files.length} files -> ${relative(root, outFile)} (${version})`)
if (duplicates.length) console.log(`Duplicate ids kept first occurrence: ${duplicates.join(', ')}`)
if (skipped.length) console.log(`Skipped ${skipped.length} records without id/title/system/severity:\n  ${skipped.join('\n  ')}`)
