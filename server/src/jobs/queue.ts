import type { ClientSession } from 'mongodb'
import type { Catalog } from '../catalog/load.ts'
import type { AppConfig } from '../config.ts'
import type { GenerationRecord, LayoutRecord, Store, TurnSummary } from '../db/store.ts'
import { type LoopResult, runAgentLoop } from '../generation/agentLoop.ts'
import { prepareGeneration, toPlacedObject } from '../generation/prepare.ts'
import { LlmError, type LlmClient } from '../llm/types.ts'
import { newId } from '../projects/service.ts'
import { buildFloor } from '../rooms/reconstruct.ts'

const now = () => new Date().toISOString()

export interface QueueDeps {
  store: Store
  catalog: Catalog
  llm: LlmClient | null
  config: Pick<AppConfig, 'generation' | 'llmTimeoutMs'>
  log?: (msg: string, extra?: Record<string, unknown>) => void
  trace?: Parameters<typeof runAgentLoop>[0]['trace']
}

/** One generation at a time (single GPU); jobs live in MongoDB so a restart does not lose the queue. */
export class GenerationQueue {
  private draining: Promise<void> | null = null
  private controller = new AbortController()

  constructor(private readonly deps: QueueDeps) {}

  kick(): void {
    this.draining ??= this.drain().finally(() => {
      this.draining = null
    })
  }

  /** Resolves when the queue is empty (used by tests and shutdown). */
  async idle(): Promise<void> {
    while (this.draining) await this.draining
  }

  stop(): void {
    this.controller.abort()
  }

  private async drain() {
    while (!this.controller.signal.aborted) {
      const g = await this.deps.store.claimNextQueued(now())
      if (!g) return
      try {
        await this.run(g)
      } catch (err) {
        if (err instanceof LlmError && err.kind === 'aborted') return
        if (this.controller.signal.aborted) return
        this.deps.log?.('generation crashed', { generationId: g.id, error: String(err) })
        await this.finish(g, 'failed', 'ENGINE_ERROR', [{ code: 'ENGINE_ERROR', message: err instanceof Error ? err.message : String(err) }])
      }
    }
  }

  private save(g: GenerationRecord, session?: ClientSession) {
    return this.deps.store.updateGeneration(g, session)
  }

  private applyFinish(g: GenerationRecord, status: GenerationRecord['status'], errorCode: string | null, issues: GenerationRecord['issues']) {
    g.status = status
    g.errorCode = errorCode
    g.issues = issues
    g.finishedAt = now()
  }

  private async finish(g: GenerationRecord, status: GenerationRecord['status'], errorCode: string | null, issues: GenerationRecord['issues']) {
    this.applyFinish(g, status, errorCode, issues)
    await this.save(g)
    this.logFinish(g)
  }

  private logFinish(g: GenerationRecord) {
    const seconds = g.startedAt && g.finishedAt ? ((Date.parse(g.finishedAt) - Date.parse(g.startedAt)) / 1000).toFixed(1) : '?'
    this.log(`${g.id} ${g.status.toUpperCase()}${g.errorCode ? ` (${g.errorCode})` : ''} after ${seconds} s${g.layoutId ? `, layout ${g.layoutId}` : ''}`)
    for (const issue of g.issues.slice(0, 5)) this.log(`  - ${issue.code}${issue.ruleId ? ` ${issue.ruleId}` : ''}: ${issue.message}`)
  }

  private log(message: string) {
    this.deps.log?.(message)
  }

  private logTurn(id: string, t: TurnSummary) {
    const verdict = t.pass === undefined ? '' : t.pass ? ' PASS' : ' FAIL'
    const counts = t.violations !== undefined ? `, ${t.violations} violations, score ${t.score}` : ''
    this.log(`${id} turn ${t.turn}: ${t.tool}${verdict}${counts}${t.note ? ` (${t.note})` : ''} in ${(t.latencyMs / 1000).toFixed(1)} s`)
    for (const detail of t.details ?? []) this.log(`    - ${detail}`)
  }

  /** `g` was already claimed (status running, stage selecting). */
  private async run(g: GenerationRecord) {
    const { store, catalog, llm, config } = this.deps
    this.log(`${g.id} started (project ${g.projectId}, ${g.scope.kind === 'home' ? 'whole home' : `room ${g.scope.roomId}`})`)

    const project = await store.getProject(g.projectId)
    if (!project || project.revision !== g.inputRevision || project.configuration.revision !== g.inputConfigurationRevision) {
      return this.finish(g, 'stale', null, [{ code: 'STALE', message: 'The project changed before this generation started.' }])
    }
    if (g.catalogVersion !== catalog.version) {
      return this.finish(g, 'failed', 'ENGINE_ERROR', [{ code: 'SNAPSHOT_VERSION_MISMATCH', message: 'The furniture catalog changed; start a new generation.' }])
    }

    const preparation = prepareGeneration(g, catalog)
    if ('issues' in preparation) {
      const code = preparation.issues.some((i) => i.code === 'BUDGET_EXCEEDED') ? 'BUDGET_EXCEEDED' : 'NO_CATALOG_MATCH'
      return this.finish(g, 'failed', code, preparation.issues)
    }
    const { prepared } = preparation
    const counts = new Map<string, { n: number; candidates: number }>()
    for (const inst of prepared.instances) {
      const entry = counts.get(inst.requirementId) ?? { n: 0, candidates: new Set(Object.values(inst.candidates).flat().map((c) => c.id)).size }
      counts.set(inst.requirementId, { ...entry, n: entry.n + 1 })
    }
    this.log(
      `${g.id} placing ${prepared.instances.length} items: ${[...counts].map(([req, c]) => `${req} x${c.n} (${c.candidates} candidates)`).join(', ') || 'none'}`,
    )

    let result: LoopResult
    if (prepared.instances.length === 0) {
      result = { ok: true, resolved: [], report: { pass: true, violations: [], metrics: [], score: 100, totalPriceMinor: 0, unpricedItemIds: [] }, rationale: 'Nothing to place.', turns: [] }
    } else {
      if (!llm) return this.finish(g, 'failed', 'ENGINE_ERROR', [{ code: 'LLM_UNAVAILABLE', message: 'No layout model is configured (LLM_PROVIDER=none).' }])
      g.stage = 'placing'
      g.progress = { turn: 0, maxTurns: config.generation.maxTurns, turns: [] }
      await this.save(g)
      result = await runAgentLoop({
        llm,
        catalog,
        prepared,
        scopeLabel: g.scope.kind === 'home' ? 'the whole home' : `room ${g.scope.roomId} only`,
        seedKey: g.id,
        maxTurns: config.generation.maxTurns,
        timeBudgetMs: config.generation.timeBudgetMs,
        llmTimeoutMs: config.llmTimeoutMs,
        signal: this.controller.signal,
        trace: this.deps.trace,
        onTurnStart: (turn) => this.log(`${g.id} turn ${turn}/${config.generation.maxTurns}: waiting for ${llm.id}...`),
        onTurn: async (turn, index) => {
          g.progress = { turn: index, maxTurns: config.generation.maxTurns, turns: [...g.progress.turns, turn] }
          await this.save(g)
          this.logTurn(g.id, turn)
        },
      })
    }

    if (!result.ok) {
      const issues: GenerationRecord['issues'] = [{ code: result.code, message: result.message }]
      for (const error of result.lastOutcome?.argumentErrors.slice(0, 10) ?? []) {
        issues.push({ code: 'INVALID_PROPOSAL', message: error })
      }
      for (const instanceId of result.lastOutcome?.missing ?? []) {
        issues.push({ code: 'NOT_PLACED', instanceIds: [instanceId], message: `${instanceId} was never placed.` })
      }
      for (const v of result.lastOutcome?.report.violations.slice(0, 10) ?? []) {
        issues.push({ code: 'RULE_VIOLATION', ruleId: v.ruleId, roomId: v.roomId ?? undefined, instanceIds: v.itemIds, message: v.message, suggestion: v.hint })
      }
      if (result.code === 'NO_VALID_LAYOUT_FOUND') {
        issues.push({ code: 'SUGGESTION', message: 'Try fewer or smaller items, or let the planner choose rooms (roomId: null) for flexible items.' })
      }
      return this.finish(g, 'failed', result.code === 'LLM_UNAVAILABLE' ? 'ENGINE_ERROR' : result.code, issues)
    }

    g.stage = 'validating'
    await this.save(g)
    const instanceRequirement = new Map(prepared.instances.map((i) => [i.instanceId, i.requirementId]))
    const placements = [...prepared.retained, ...result.resolved.map((r) => toPlacedObject(r, instanceRequirement.get(r.instanceId)!))]
    const snapshot = g.snapshot
    const { report, rationale } = result

    // Layout insert, activation and job completion commit together; a concurrent
    // project edit either lands first (result kept but not activated) or retries after.
    await store.withTransaction(async (session) => {
      const current = await store.getProject(g.projectId, session)
      const fresh = !!current && current.revision === g.inputRevision && current.configuration.revision === g.inputConfigurationRevision
      const layout: LayoutRecord = {
        id: newId('lay'),
        projectId: g.projectId,
        generationId: g.id,
        activated: fresh,
        inputRevision: g.inputRevision,
        inputConfigurationRevision: g.inputConfigurationRevision,
        catalogVersion: g.catalogVersion,
        scope: g.scope,
        scene: buildFloor(snapshot.rooms, snapshot.roomTransforms, placements, (o) => o.roomId),
        placements,
        totalPriceMinor: placements.reduce((sum, p) => sum + (p.priceMinor ?? 0), 0),
        currency: 'USD',
        engineReport: report,
        rationale,
        planner: llm?.id ?? 'none',
        createdAt: now(),
      }
      await store.insertLayout(layout, session)
      if (fresh && current) {
        current.activeLayoutId = layout.id
        current.stale = null
        await store.saveProject(current, session)
      }
      g.layoutId = layout.id
      this.applyFinish(g, fresh ? 'succeeded' : 'stale', null, fresh ? [] : [{ code: 'STALE', message: 'The project changed while generating; the result was kept but not activated.' }])
      await this.save(g, session)
    })
    this.logFinish(g)
  }
}
