import { Ajv2020 } from 'ajv/dist/2020.js'
import type { Catalog } from '../catalog/load.ts'
import type { TurnSummary } from '../db/store.ts'
import { hashString } from '../lib/rng.ts'
import { fmt, poseRect } from '../geometry/rect.ts'
import { type ChatMessage, type LlmClient, LlmError } from '../llm/types.ts'
import type { EngineReport } from '../rules/engine.ts'
import type { ProposedPlacement, ResolvedPlacement } from './expander.ts'
import { type PreparedGeneration, type ProposalOutcome, buildContext, evaluateProposal } from './prepare.ts'
import { CHECK_LAYOUT_TOOL, LAYOUT_TOOLS, SUBMIT_LAYOUT_TOOL, SYSTEM_PROMPT } from './tools.ts'

const ajv = new Ajv2020({ allErrors: true, strict: false })
const validateArgs = {
  [CHECK_LAYOUT_TOOL.name]: ajv.compile(CHECK_LAYOUT_TOOL.parameters),
  [SUBMIT_LAYOUT_TOOL.name]: ajv.compile(SUBMIT_LAYOUT_TOOL.parameters),
}

export type LoopResult =
  | { ok: true; resolved: ResolvedPlacement[]; report: EngineReport; rationale: string; turns: TurnSummary[] }
  | { ok: false; code: 'NO_VALID_LAYOUT_FOUND' | 'LLM_UNAVAILABLE'; message: string; lastOutcome: ProposalOutcome | null; turns: TurnSummary[] }

export interface LoopOptions {
  llm: LlmClient
  catalog: Catalog
  prepared: PreparedGeneration
  scopeLabel: string
  seedKey: string
  maxTurns: number
  timeBudgetMs: number
  llmTimeoutMs: number
  signal?: AbortSignal
  onTurn?: (turn: TurnSummary, turnIndex: number) => void
  /** Full per-call record (model arguments and tool result), for debugging prompts. */
  trace?: (entry: { turn: number; tool: string; arguments: string; result: string; content: string }) => void
}

/** What the model sees after each tool call: pass/fail, violations with fixes, resolved positions. */
function toolResult(tool: 'check_layout' | 'submit_layout', outcome: ProposalOutcome, checkId?: string): string {
  const { report } = outcome
  const verdict = tool === 'submit_layout' ? (outcome.accepted ? 'ACCEPTED' : 'REJECTED') : report.pass && outcome.argumentErrors.length === 0 ? 'PASS' : 'FAIL'
  const complete = verdict === 'PASS' && outcome.missing.length === 0
  return JSON.stringify({
    result: verdict,
    checkId,
    next: complete ? `Every instance passes. Call submit_layout with {"checkId":"${checkId}","rationale":"..."}.` : undefined,
    argumentErrors: outcome.argumentErrors.length ? outcome.argumentErrors.slice(0, 10) : undefined,
    notPlacedYet: outcome.missing.length ? outcome.missing : undefined,
    violations: report.violations.slice(0, 10).map((v) => ({ rule: v.ruleId, room: v.roomId, items: v.itemIds, problem: v.message, fix: v.hint })),
    moreViolations: report.violations.length > 10 ? report.violations.length - 10 : undefined,
    resolved: outcome.resolved.map((r) => {
      const rect = poseRect(r.pose, r.footprint)
      return { id: r.instanceId, room: r.roomId, rot: r.pose.rot, rect: [rect.x0, rect.y0, rect.x1, rect.y1].map((v) => Number(fmt(v))) }
    }),
    metrics: report.metrics.map((m) => ({ room: m.roomId, walkableAreaPct: m.walkableAreaPct, minPathWidthM: m.minPathWidthM })),
    score: report.score,
    totalUsd: report.totalPriceMinor / 100,
  })
}

/** Older tool results shrink to a one-line digest so the loop fits a 32k context. */
function compact(messages: ChatMessage[]): ChatMessage[] {
  const toolIndexes = messages.map((m, i) => (m.role === 'tool' ? i : -1)).filter((i) => i >= 0)
  const keep = new Set(toolIndexes.slice(-2))
  return messages.map((m, i) => {
    if (m.role !== 'tool' || keep.has(i)) return m
    try {
      const parsed = JSON.parse(m.content) as { result: string; violations?: { problem: string }[] }
      return { ...m, content: JSON.stringify({ result: parsed.result, earlierViolations: parsed.violations?.slice(0, 3).map((v) => v.problem) }) }
    } catch {
      return m
    }
  })
}

export async function runAgentLoop(options: LoopOptions): Promise<LoopResult> {
  const { llm, catalog, prepared } = options
  const started = Date.now()
  const turns: TurnSummary[] = []
  let lastOutcome: ProposalOutcome | null = null
  let consecutiveFailures = 0
  let successfulCalls = 0
  const checks = new Map<string, ProposedPlacement[]>()

  let messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: buildContext(prepared, catalog, options.scopeLabel) },
  ]

  for (let turn = 1; turn <= options.maxTurns; turn++) {
    if (Date.now() - started > options.timeBudgetMs) break
    if (options.signal?.aborted) throw new LlmError('aborted', 'Generation was cancelled.')

    let response
    try {
      response = await llm.chat({
        messages: compact(messages),
        tools: LAYOUT_TOOLS,
        toolChoice: 'required',
        temperature: turn === 1 ? 0.2 : 0.4,
        seed: hashString(`${options.seedKey}:${turn}`),
        maxTokens: 6000,
        timeoutMs: Math.min(options.llmTimeoutMs, Math.max(1000, options.timeBudgetMs - (Date.now() - started))),
        signal: options.signal,
      })
    } catch (err) {
      if (err instanceof LlmError && err.kind === 'aborted') throw err
      consecutiveFailures++
      const note = err instanceof Error ? err.message : String(err)
      turns.push({ turn, tool: 'error', note, latencyMs: 0 })
      options.onTurn?.(turns.at(-1)!, turn)
      if (successfulCalls === 0 || consecutiveFailures >= 2) {
        return { ok: false, code: 'LLM_UNAVAILABLE', message: `The layout model failed: ${note}`, lastOutcome, turns }
      }
      continue
    }
    consecutiveFailures = 0
    successfulCalls++

    const calls = response.toolCalls
    messages.push({ role: 'assistant', content: response.content, toolCalls: calls })
    if (calls.length === 0) {
      messages.push({ role: 'user', content: 'Respond with a check_layout or submit_layout tool call.' })
      turns.push({ turn, tool: 'none', note: 'no tool call', latencyMs: response.latencyMs })
      options.onTurn?.(turns.at(-1)!, turn)
      continue
    }

    for (const call of calls) {
      const tool = call.name === SUBMIT_LAYOUT_TOOL.name ? 'submit_layout' : call.name === CHECK_LAYOUT_TOOL.name ? 'check_layout' : null
      let content: string
      if (!tool) {
        content = JSON.stringify({ error: `Unknown tool ${call.name}. Use check_layout or submit_layout.` })
        turns.push({ turn, tool: call.name, note: 'unknown tool', latencyMs: response.latencyMs })
      } else {
        let args: unknown
        try {
          args = JSON.parse(call.arguments)
        } catch {
          args = undefined
        }
        const validate = validateArgs[tool]
        if (args === undefined || !validate(args)) {
          const errors = args === undefined ? ['arguments are not valid JSON'] : (validate.errors ?? []).slice(0, 8).map((e) => `${e.instancePath || '(root)'} ${e.message}`)
          content = JSON.stringify({ result: 'INVALID_ARGUMENTS', errors })
          turns.push({ turn, tool, note: 'invalid arguments', latencyMs: response.latencyMs })
        } else {
          const { placements: given, rationale, checkId: requestedCheck } = args as { placements?: ProposedPlacement[]; rationale?: string; checkId?: string | null }
          // Submitting by checkId reuses the exact placements that were checked, so the model never retypes them.
          const placements = tool === 'submit_layout' && requestedCheck ? checks.get(requestedCheck) : given
          if (!placements) {
            const error = requestedCheck
              ? `unknown checkId ${requestedCheck} (known: ${[...checks.keys()].join(', ') || 'none yet'})`
              : 'provide placements (or a checkId for submit_layout)'
            content = JSON.stringify({ result: 'INVALID_ARGUMENTS', errors: [error] })
            turns.push({ turn, tool, note: 'invalid arguments', details: [error], latencyMs: response.latencyMs })
          } else {
            const outcome = evaluateProposal(prepared, catalog, placements, tool === 'submit_layout' ? 'submit' : 'check')
            lastOutcome = outcome
            let checkId: string | undefined
            if (tool === 'check_layout') {
              checkId = `check-${checks.size + 1}`
              checks.set(checkId, placements)
            }
            content = toolResult(tool, outcome, checkId)
            turns.push({
              turn,
              tool,
              pass: tool === 'submit_layout' ? outcome.accepted : outcome.report.pass && outcome.argumentErrors.length === 0,
              violations: outcome.report.violations.length + outcome.argumentErrors.length,
              score: outcome.report.score,
              details: [...outcome.argumentErrors, ...outcome.report.violations.map((v) => `${v.ruleId}: ${v.message}`)].slice(0, 5),
              latencyMs: response.latencyMs,
            })
            if (tool === 'submit_layout' && outcome.accepted) {
              options.onTurn?.(turns.at(-1)!, turn)
              options.trace?.({ turn, tool: call.name, arguments: call.arguments, result: content, content: response.content })
              return { ok: true, resolved: outcome.resolved, report: outcome.report, rationale: rationale ?? '', turns }
            }
          }
        }
      }
      options.onTurn?.(turns.at(-1)!, turn)
      options.trace?.({ turn, tool: call.name, arguments: call.arguments, result: content, content: response.content })
      messages.push({ role: 'tool', toolCallId: call.id, name: call.name, content })
    }
    messages = messages.slice()
  }

  return {
    ok: false,
    code: 'NO_VALID_LAYOUT_FOUND',
    message: lastOutcome
      ? `No valid layout was found within ${turns.at(-1)?.turn ?? 0} model turns.`
      : `The model never produced a usable layout proposal within ${turns.at(-1)?.turn ?? 0} turns (${turns.at(-1)?.note ?? 'no tool call'}).`,
    lastOutcome,
    turns,
  }
}
