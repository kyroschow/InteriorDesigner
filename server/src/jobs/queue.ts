import type { Catalog } from '../catalog/load.ts'
import type { AppConfig } from '../config.ts'
import type { GenerationRecord, LayoutRecord, Store } from '../db/store.ts'
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

/** One generation at a time (single GPU); jobs live in SQLite so a restart does not lose the queue. */
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
    for (let g = this.deps.store.nextQueuedGeneration(); g && !this.controller.signal.aborted; g = this.deps.store.nextQueuedGeneration()) {
      try {
        await this.run(g)
      } catch (err) {
        if (err instanceof LlmError && err.kind === 'aborted') return
        this.deps.log?.('generation crashed', { generationId: g.id, error: String(err) })
        this.finish(g, 'failed', 'ENGINE_ERROR', [{ code: 'ENGINE_ERROR', message: err instanceof Error ? err.message : String(err) }])
      }
    }
  }

  private save(g: GenerationRecord) {
    this.deps.store.updateGeneration(g)
  }

  private finish(g: GenerationRecord, status: GenerationRecord['status'], errorCode: string | null, issues: GenerationRecord['issues']) {
    g.status = status
    g.errorCode = errorCode
    g.issues = issues
    g.finishedAt = now()
    this.save(g)
  }

  private async run(g: GenerationRecord) {
    const { store, catalog, llm, config } = this.deps
    g.status = 'running'
    g.stage = 'selecting'
    g.startedAt = now()
    this.save(g)

    const project = store.getProject(g.projectId)
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

    let result: LoopResult
    if (prepared.instances.length === 0) {
      result = { ok: true, resolved: [], report: { pass: true, violations: [], metrics: [], score: 100, totalPriceMinor: 0, unpricedItemIds: [] }, rationale: 'Nothing to place.', turns: [] }
    } else {
      if (!llm) return this.finish(g, 'failed', 'ENGINE_ERROR', [{ code: 'LLM_UNAVAILABLE', message: 'No layout model is configured (LLM_PROVIDER=none).' }])
      g.stage = 'placing'
      g.progress = { turn: 0, maxTurns: config.generation.maxTurns, turns: [] }
      this.save(g)
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
        onTurn: (turn, index) => {
          g.progress = { turn: index, maxTurns: config.generation.maxTurns, turns: [...g.progress.turns, turn] }
          this.save(g)
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
    this.save(g)
    const instanceRequirement = new Map(prepared.instances.map((i) => [i.instanceId, i.requirementId]))
    const placements = [...prepared.retained, ...result.resolved.map((r) => toPlacedObject(r, instanceRequirement.get(r.instanceId)!))]
    const snapshot = g.snapshot

    store.tx(() => {
      const current = store.getProject(g.projectId)!
      const fresh = current.revision === g.inputRevision && current.configuration.revision === g.inputConfigurationRevision
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
        engineReport: result.report,
        rationale: result.rationale,
        planner: llm?.id ?? 'none',
        createdAt: now(),
      }
      store.insertLayout(layout)
      if (fresh) {
        current.activeLayoutId = layout.id
        current.stale = null
        store.saveProject(current)
      }
      g.layoutId = layout.id
      this.finish(g, fresh ? 'succeeded' : 'stale', null, fresh ? [] : [{ code: 'STALE', message: 'The project changed while generating; the result was kept but not activated.' }])
    })
  }
}
